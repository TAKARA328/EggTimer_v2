// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

const Alexa = require('ask-sdk-core');
const i18n  = require('i18next');

const languageStrings  = require('./languageStrings');

const apl_document     = require('./apl/document.json');
const apl_data         = require('./apl/data.json');
const apl_directive    = require('./apl/directive.json');
const apl_command_yuge = require('./apl/command_yuge.json');
const apl_command_S    = require('./apl/command_S.json');
const apl_command_M    = require('./apl/command_M.json');
const apl_command_L    = require('./apl/command_L.json');

const apla_document    = require('./apla/document.json');
const apla_directive   = require('./apla/directive.json');
const apla_data        = require('./apla/data.json');

const TIMERS_PERMISSION = 'alexa::alerts:timers:skill:readwrite';
// change to test different types of timers
const TIMER_FUNCTION = getAnnouncementTimer;
//const TIMER_FUNCTION = getCustomTaskLaunchTimer;    // Direct skill connections

// フラグ
// お湯準備できてる（true:できてる/false:できてない）
let F_READY = false;
// 茹で可能（true:開始できる/false:開始できない）
let F_START = false;

let EXIT_COUNT = 0;

var boiledtime = { "S" : {"time01": 'PT5M10S', "time02" : 'PT6M10S', "time03" : 'PT8M40S', "time04" : 'PT11M40S' },
                   "M" : {"time01": 'PT5M30S', "time02" : 'PT6M30S', "time03" : 'PT9M'   , "time04" : 'PT12M'},
                   "L" : {"time01": 'PT5M50S', "time02" : 'PT6M50S', "time03" : 'PT9M20S', "time04" : 'PT12M20S'}};

var EGG_SIZE_NAME = ['S', 'M', 'L'];

// タイマーのJSON
function getAnnouncementTimer(handlerInput, title, msgtext, duration) {
    return {
        duration: duration,
        timerLabel: title,
        creationBehavior: {
            displayExperience: {
                visibility: 'VISIBLE'
            }
        },
        triggeringBehavior: {
            operation: {
                type : 'ANNOUNCE',
                textToAnnounce: [{
                    locale: handlerInput.t('ANNOUNCEMENT_LOCALE_MSG'),
                    text: msgtext
                }]
            },
            notificationConfig: {
                playAudible: false
            }
        }
    };
}

// パーミッションのチェック
function verifyConsentToken(handlerInput){
    let {requestEnvelope} = handlerInput;
    const {permissions} = requestEnvelope.context.System.user;
    if (!(permissions && permissions.consentToken)){
        console.log('No permissions found!');
        // we send a request to enable by voice
        // note that you'll need another handler to process the result, see AskForResponseHandler
        return handlerInput.responseBuilder
            .addDirective({
            type: 'Connections.SendRequest',
            'name': 'AskFor',
            'payload': {
                '@type': 'AskForPermissionsConsentRequest',
                '@version': '1',
                'permissionScope': TIMERS_PERMISSION
            },
            token: 'verifier'
        }).getResponse();
    }
    console.log('Permissions found: ' + permissions.consentToken);
    return null;
}

// APLのチェック
function isAPLAlreadyDisplayed(handlerInput){
    let {requestEnvelope} = handlerInput;
    let isAPL = requestEnvelope["context"]["Alexa.Presentation.APL"];
    console.log(`isAPLAlreadyDisplayed:isAPL ${JSON.stringify(isAPL)}`);
    if (isAPL === undefined) {
        return false;
    }
    return true;
}



const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        console.log(`LaunchRequestHandler:`);
        F_READY = false;
        F_START = false;
        EXIT_COUNT = 0;

        let response = verifyConsentToken(handlerInput);
        if(response)
            return response;

        F_READY = true;

        // APL-A
        apla_data.myData.ssml  = handlerInput.t('WELCOME_MSG') + handlerInput.t('READEY_REPROMPT_MSG');
        apla_data.myData.audio = 'https://dl.dropboxusercontent.com/s/s4pe32n63wli255/futto.mp3';
        apla_directive.document = apla_document;
        apla_directive.datasources = apla_data;
        handlerInput.responseBuilder
            .addDirective(apla_directive)

        // apl
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
            console.log(`LaunchRequestHandler:set APL`);
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            handlerInput.responseBuilder
                .addDirective(apl_directive)
                .addDirective(apl_command_yuge)
        };

        console.log(`LaunchRequestHandler:set responseBuilder`);
        return handlerInput.responseBuilder
            .speak("")
            .reprompt(handlerInput.t('READEY_REPROMPT_MSG'))
            .getResponse();
    }
};


const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && F_START === false;
    },
    handle(handlerInput) {
        console.log(`YesIntentHandler:`);

        let response = verifyConsentToken(handlerInput);
        if(response)
            return response;

        // apl
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
            console.log(`YesIntentHandler:set APL`);
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            handlerInput.responseBuilder
                .addDirective(apl_directive)
        };

        // ワンショットで入って来た時の対処
        // お湯が沸いているか言う
        if (F_READY === true) {
            // 準備ＯＫ（お湯が沸騰している。）
            F_START = true;
            return handlerInput.responseBuilder
                .speak(handlerInput.t('SIZE_MSG'))
                .reprompt(handlerInput.t('SIZE_REPROMPT_MSG'))
                .getResponse();
        } else {
            // お湯は沸騰していますか？
            F_READY = true;
            return handlerInput.responseBuilder
                .speak(handlerInput.t('READEY_REPROMPT_MSG'))
                .reprompt(handlerInput.t('READEY_REPROMPT_MSG'))
                .getResponse();
        }
    }
};

const NoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent';
    },
    handle(handlerInput) {
        console.log(`NoIntentHandler:`);

        let response = verifyConsentToken(handlerInput);
        if(response)
            return response;

        // apl
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
            console.log(`NoIntentHandler:set APL`);
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            handlerInput.responseBuilder
                .addDirective(apl_directive)
        };

        // ワンショットで入って来た時の対処
        // お湯が沸いているか言う
        if (F_START === true) {
            // 準備ＯＫ（お湯が沸騰している。） ⇒ またね。
            if (EXIT_COUNT < 1) {
                EXIT_COUNT++;
                return handlerInput.responseBuilder
                    .speak(handlerInput.t('START_AGAIN_MSG'))
                    .reprompt(handlerInput.t('START_REPROMPT_MSG'))
                    .getResponse();
            } else {
                EXIT_COUNT = 0;
                return handlerInput.responseBuilder
                .speak(handlerInput.t('EXIT_MSG'))
                .withShouldEndSession(true)
                .getResponse();
            }
        } else {
            // お湯は沸騰していますか？ ⇒ お湯が沸いたら来てね。
            F_READY = false;
            F_START = false;
            EXIT_COUNT = 0;
            return handlerInput.responseBuilder
                .speak(handlerInput.t('GOODBYE_MSG'))
                .withShouldEndSession(true)
                .getResponse();
        }
    }
};

const SizeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SizeIntent';
    },
    handle(handlerInput) {
        console.log(`SizeIntentHandler:`);
        let SizeId = '';

        let response = verifyConsentToken(handlerInput);
        if(response)
            return response;

        const {requestEnvelope, attributesManager, serviceClientFactory} = handlerInput;
        const SizeName = Alexa.getSlot(requestEnvelope, 'SizeName');
        console.log('SizeName: ' + JSON.stringify(SizeName));

        const sessionAttributes = attributesManager.getSessionAttributes();

        try  {
            SizeId = SizeName.resolutions.resolutionsPerAuthority[0].values[0].value.id;
            sessionAttributes['SizeId'] = SizeId;
        } catch (error) {
            SizeId = 'No ID';
        }
        console.log(`SizeId: ${SizeId}`);

        // Slot ID Check ('S', 'M', 'L')
        if (EGG_SIZE_NAME.includes(SizeId)) {
            F_START = true;

            // apl
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
                if (!isAPLAlreadyDisplayed(handlerInput)) {
                    console.log(`SizeIntentHandler:set APL`);
                    apl_directive.document = apl_document;
                    apl_directive.datasources = apl_data;
                    handlerInput.responseBuilder
                        .addDirective(apl_directive)
                };
                if (SizeId === 'S') {
                    handlerInput.responseBuilder
                        .addDirective(apl_command_S)
                } else if (SizeId === 'M') {
                    handlerInput.responseBuilder
                        .addDirective(apl_command_M)
                } else {
                    handlerInput.responseBuilder
                        .addDirective(apl_command_L)
                }
            };

            // APL-A
            apla_data.myData.ssml  = handlerInput.t('START_MSG');
            apla_data.myData.audio = 'https://dl.dropboxusercontent.com/s/epyc5lcthvk2f61/in.mp3';
            apla_directive.document = apla_document;
            apla_directive.datasources = apla_data;
            handlerInput.responseBuilder
                .addDirective(apla_directive)

            return handlerInput.responseBuilder
                .speak("")
                .reprompt(handlerInput.t('START_REPROMPT_MSG'))
                .getResponse();
        } else {
            // apl
            if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
                console.log(`SizeIntentHandler:set APL else`);
                apl_directive.document = apl_document;
                apl_directive.datasources = apl_data;
                handlerInput.responseBuilder
                    .addDirective(apl_directive)
            };

            //   サイズをもう一度聞く
            return handlerInput.responseBuilder
                .speak(handlerInput.t('SIZE_REPROMPT_MSG'))
                .reprompt(handlerInput.t('SIZE_REPROMPT_MSG'))
                .getResponse();
        }
    }
};

const SetTimerIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent'
            && F_START === true;
    },
    async handle(handlerInput) {
        console.log(`SetTimerIntentHandler:`);
        const {requestEnvelope, attributesManager, serviceClientFactory} = handlerInput;
        verifyConsentToken(handlerInput);
        const sessionAttributes = attributesManager.getSessionAttributes();
        const SizeId = sessionAttributes['SizeId'];
        console.log('SizeId: ' + JSON.stringify(SizeId));

//        const timer = TIMER_FUNCTION(handlerInput, handlerInput.t('ANNOUNCEMENT_TIMER_TITLE01_MSG'), 'PT5M');
//        console.log('About to create timer: ' + JSON.stringify(timer));
        
        try {
            const timerServiceClient = serviceClientFactory.getTimerManagementServiceClient();
            let timersList = await timerServiceClient.getTimers();
            console.log('Current timers: ' + JSON.stringify(timersList));

            console.log('time01: ' + JSON.stringify(boiledtime[SizeId]['time01']));
            console.log('time02: ' + JSON.stringify(boiledtime[SizeId]['time02']));
            console.log('time03: ' + JSON.stringify(boiledtime[SizeId]['time03']));
            console.log('time04: ' + JSON.stringify(boiledtime[SizeId]['time04']));

            // ここでタイマーがセットされる
            const timerResponse  = await timerServiceClient.createTimer(TIMER_FUNCTION(handlerInput, handlerInput.t('ANNOUNCEMENT_TIMER_TITLE01_MSG'), handlerInput.t('ANNOUNCEMENT_TEXT01_MSG'), boiledtime[SizeId]['time01']));
            const timerResponse2 = await timerServiceClient.createTimer(TIMER_FUNCTION(handlerInput, handlerInput.t('ANNOUNCEMENT_TIMER_TITLE02_MSG'), handlerInput.t('ANNOUNCEMENT_TEXT02_MSG'), boiledtime[SizeId]['time02']));
            const timerResponse3 = await timerServiceClient.createTimer(TIMER_FUNCTION(handlerInput, handlerInput.t('ANNOUNCEMENT_TIMER_TITLE03_MSG'), handlerInput.t('ANNOUNCEMENT_TEXT03_MSG'), boiledtime[SizeId]['time03']));
            const timerResponse4 = await timerServiceClient.createTimer(TIMER_FUNCTION(handlerInput, handlerInput.t('ANNOUNCEMENT_TIMER_TITLE04_MSG'), handlerInput.t('ANNOUNCEMENT_TEXT04_MSG'), boiledtime[SizeId]['time04']));
            console.log('Timer creation response: ' + JSON.stringify(timerResponse));

            const timerId = timerResponse.id;
            const timerStatus = timerResponse.status;

            if(timerStatus === 'ON') {
                const sessionAttributes = attributesManager.getSessionAttributes();
                sessionAttributes['lastTimerId'] = timerId;

                F_READY = false;
                F_START = false;

                // APL-A
                apla_data.myData.ssml  = handlerInput.t('CREATE_TIMER_OK_MSG');
                apla_data.myData.audio = 'https://dl.dropboxusercontent.com/s/ob6cqpvwrnpo4zi/end.mp3';
                apla_data.myData.volume = "60%";
                apla_directive.document = apla_document;
                apla_directive.datasources = apla_data;
                handlerInput.responseBuilder
                    .addDirective(apla_directive)

                return handlerInput.responseBuilder
                    .speak('')
                    .withShouldEndSession(true)
                    .getResponse();
            } else
                throw { statusCode: 308, message: 'Timer did not start' };
                
        } catch (error) {
            console.log('Create timer error: ' + JSON.stringify(error));
            F_READY = false;
            F_START = false;
            return handlerInput.responseBuilder
                    .speak(handlerInput.t('CREATE_TIMER_ERROR_MSG'))
                    .withShouldEndSession(true)
                    .getResponse();
        }
    }
};

const AskForResponseHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'Connections.Response'
            && handlerInput.requestEnvelope.request.name === 'AskFor';
    },
    async handle(handlerInput) {
        console.log(`AskForResponseHandler:`);
        const {request} = handlerInput.requestEnvelope;
        const {payload, status} = request;
        console.log('Connections reponse status + payload: ' + status + ' - ' + JSON.stringify(payload));

        if (status.code === '200') {
            if (payload.status === 'ACCEPTED') {
                // Request was accepted
                F_READY = true;
                handlerInput.responseBuilder
                    .speak(handlerInput.t('VOICE_PERMISSION_ACCEPTED') + handlerInput.t('READEY_REPROMPT_MSG'))
                    .reprompt(handlerInput.t('READEY_REPROMPT_MSG'));
            } else if (payload.status === 'DENIED') {
                // Request was denied
                handlerInput.responseBuilder
                    .speak(handlerInput.t('VOICE_PERMISSION_DENIED') + handlerInput.t('GOODBYE_MSG'));
            } else if (payload.status === 'NOT_ANSWERED') {
                // Request was not answered
                handlerInput.responseBuilder
                    .speak(handlerInput.t('VOICE_PERMISSION_DENIED') + handlerInput.t('GOODBYE_MSG'));
            }
            if(payload.status !== 'ACCEPTED' && !payload.isCardThrown){
                handlerInput.responseBuilder
                        .speak(handlerInput.t('PERMISSIONS_CARD_MSG'))
                        .withAskForPermissionsConsentCard([TIMERS_PERMISSION]);
            }
            return handlerInput.responseBuilder.getResponse();
        }

        if (status.code === '400') {
            console.log('You forgot to specify the permission in the skill manifest!')
        }

        // Something failed.
        console.log(`Connections.Response indicated failure. error: ${request.status.message}`);

        return handlerInput.responseBuilder
            .speak(handlerInput.t('VOICE_PERMISSION_ERROR') + handlerInput.t('GOODBYE_MSG'))
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        console.log(`HelpIntentHandler:`);
        let ssml  = '';

        // apl
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
            console.log(`HelpIntentHandler:set APL`);
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            handlerInput.responseBuilder
                .addDirective(apl_directive)
        };

        // ワンショットで入って来た時の対処
        // お湯が沸いているか言う
        if (F_READY === true && F_START === true) {
            // 準備ＯＫ（お湯が沸騰している。）
            F_START = true;
            ssml = handlerInput.t('HELP_MSG') + handlerInput.t('SIZE_MSG');
            handlerInput.responseBuilder
                .reprompt(handlerInput.t('HELP_MSG') + handlerInput.t('SIZE_MSG'))
                //.getResponse();
        } else {
            // お湯は沸騰していますか？
            F_READY = true;
            ssml = handlerInput.t('HELP_MSG') + handlerInput.t('READEY_REPROMPT_MSG');
            handlerInput.responseBuilder
                .reprompt(handlerInput.t('HELP_MSG') + handlerInput.t('READEY_REPROMPT_MSG'))
                //.getResponse();
        }

        // APL-A
        apla_data.myData.ssml  = ssml;
        apla_data.myData.audio = 'https://dl.dropboxusercontent.com/s/boj5cp1dj3j2fqx/help.mp3';
        apla_directive.document = apla_document;
        apla_directive.datasources = apla_data;
        handlerInput.responseBuilder
            .addDirective(apla_directive)

        return handlerInput.responseBuilder
            .speak('')
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        console.log(`FallbackIntentHandler:`);
        F_READY = false;
        F_START = false;
        EXIT_COUNT = 0;

        // APL-A
        apla_data.myData.ssml  = handlerInput.t('FALLBACK_MSG');
        apla_data.myData.audio = 'https://dl.dropboxusercontent.com/s/s4pe32n63wli255/futto.mp3';
        apla_directive.document = apla_document;
        apla_directive.datasources = apla_data;
        handlerInput.responseBuilder
            .addDirective(apla_directive)

        // apl
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
            console.log(`FallbackIntentHandler:set APL`);
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            handlerInput.responseBuilder
                .addDirective(apl_directive)
        };

        return handlerInput.responseBuilder
            .speak('')
            .withShouldEndSession(true)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
            ||  Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        console.log(`CancelAndStopIntentHandler:`);
        F_READY = false;
        F_START = false;
        EXIT_COUNT = 0;

        // APL-A
        apla_data.myData.ssml  = handlerInput.t('GOODBYE_MSG');
        apla_data.myData.audio = 'https://dl.dropboxusercontent.com/s/ob6cqpvwrnpo4zi/end.mp3';
        apla_directive.document = apla_document;
        apla_directive.datasources = apla_data;
        handlerInput.responseBuilder
            .addDirective(apla_directive)
        
        // apl
        if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'] && !isAPLAlreadyDisplayed(handlerInput)) {
            console.log(`CancelAndStopIntentHandler:set APL`);
            apl_directive.document = apl_document;
            apl_directive.datasources = apl_data;
            handlerInput.responseBuilder
                .addDirective(apl_directive)
        };

        return handlerInput.responseBuilder
            .speak('')
            .withShouldEndSession(true)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        console.log(`SessionEndedRequestHandler: ${JSON.stringify(handlerInput)}`);
        F_READY = false;
        F_START = false;
        EXIT_COUNT = 0;

        return handlerInput.responseBuilder.getResponse();
    }
};

const AcceptGrantResponseHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.context.request.type === 'Alexa.Authorization.Grant';
    },
    async handle(handlerInput) {
        console.log(`AcceptGrantResponseHandler:`);
        console.log('AcceptGrant.response: ' + handlerInput + ' - ' + JSON.stringify(handlerInput));

        return handlerInput.responseBuilder
            .withShouldEndSession(true)
            .getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = handlerInput.t('REFLECTOR_MSG', {intent: intentName});

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .withShouldEndSession(true)
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        let speechOutput = '';
        F_READY = false;
        F_START = false;
        EXIT_COUNT = 0;

        try {
            speechOutput = handlerInput.t('ERROR_MSG');
        } catch (e) {
            console.log(`ErrorHandler cathe`)
            console.log(e)
            return handlerInput.responseBuilder
                .withShouldEndSession(true)
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak(speechOutput)
//            .reprompt(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

// This request interceptor will log all incoming requests to this lambda
const LoggingRequestInterceptor = {
    process(handlerInput) {
        console.log(`Incoming request: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        console.log(`Incoming request handler: ${JSON.stringify(handlerInput)}`);
    }
};

// This request interceptor will bind a translation function 't' to the handlerInput
// Additionally it will handle picking a random value if instead of a string it receives an array
const LocalisationRequestInterceptor = {
    process(handlerInput) {
        try {
            const localisationClient = i18n.init({
                lng: Alexa.getLocale(handlerInput.requestEnvelope),
                resources: languageStrings,
                returnObjects: true
            });
            console.log(`handlerInput: ${JSON.stringify(handlerInput)}`);
            localisationClient.localise = function localise() {
                const args = arguments;
                const value = i18n.t(...args);
                if (Array.isArray(value)) {
                    return value[Math.floor(Math.random() * value.length)];
                }
                return value;
            };
            handlerInput.t = function translate(...args) {
                return localisationClient.localise(...args);
            }
        } catch (e) {
            console.log(`LocalisationRequestInterceptor cathe`)
            console.log(e)
            return null;
        }
    }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        AskForResponseHandler,
        YesIntentHandler,
        NoIntentHandler,
        SizeIntentHandler,
        SetTimerIntentHandler,
        HelpIntentHandler,
        FallbackIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler,
        AcceptGrantResponseHandler
        )
    .addErrorHandlers(
        ErrorHandler
    )
    .addRequestInterceptors(
        LocalisationRequestInterceptor,
        LoggingRequestInterceptor
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('sample/egg-timer')
    .lambda();