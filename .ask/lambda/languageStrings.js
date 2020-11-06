// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

module.exports = {
    ja: {
        translation: {
            WELCOME_MSG: ['はい。それでは、始めましょう。', 'はい。さっそく、始めましょう。', 'はい。それじゃあ、始めましょう。'],
            HELP_MSG: `茹で卵を作るための、タイマーです。沸騰したお湯に、タマゴを入れて、このタイマーをセットしてください。それでは、再開します。`,
            REPROMPT_MSG: `どうですか？`,
            GOODBYE_MSG: ['そうですか。お湯が沸騰したら、また起動してください。', 'わかりました。お湯が沸騰したら、また呼び出してください。'],
            EXIT_MSG: ['そうですか。では、またあとで起動してください。', 'わかりました。またあとで呼び出してください。'],
            REFLECTOR_MSG: '{{intent}}がトリガーされました',
            FALLBACK_MSG: `すみません。ちょっとわかりませんでした。もう一度<phoneme alphabet="x-amazon-pron-kana" ph="タメシテ">試して</phoneme>みてください。`,
            ERROR_MSG: 'すみません。なんだかうまく行かないみたいです。もう一度<phoneme alphabet="x-amazon-pron-kana" ph="タメシテ">試して</phoneme>みてください。',
            PERMISSIONS_CARD_MSG: 'お客様のAlexaアプリに、このスキルがタイマーを使用することを許可するためのカードを送りました。権限を許可していただいた後に、もう一度このスキルを呼び出してください。',
            TIMER_COUNT_MSG: '現在、{{count}}個のタイマーがセットされています。',
            TIMER_COUNT_MSG_plural: '現在、{{count}}個のタイマーがセットされています。',
            LAST_TIMER_MSG: 'お客様のタイマーは、現在 {{status}}',
            NO_TIMER_MSG: `現在、タイマーがセットされていません。タイマーをセットして、と言ってみてください。`,
            SIZE_MSG: `たまごは、エス、エム、エル、何サイズですか？`,
            SIZE_REPROMPT_MSG: `なにサイズですか？`,
            START_MSG: `それでは、たまごを、<phoneme alphabet="x-amazon-pron-kana" ph="オユ'">お湯</phoneme> に入れてください。<break time="3s"/>入れましたか？`,
            START_AGAIN_MSG: `たまごを、入れてください。<break time="0.5s"/>入れましたか？`,
            START_REPROMPT_MSG: `入れましたか？`,
            READEY_REPROMPT_MSG: `<phoneme alphabet="x-amazon-pron-kana" ph="オユ'">お湯</phoneme>は沸騰していますか？`,
            ANNOUNCEMENT_TIMER_TITLE01_MSG: 'とろとろ卵',
            ANNOUNCEMENT_TIMER_TITLE02_MSG: '半熟卵',
            ANNOUNCEMENT_TIMER_TITLE03_MSG: 'しっとり卵',
            ANNOUNCEMENT_TIMER_TITLE04_MSG: '固ゆで卵',
            ANNOUNCEMENT_LOCALE_MSG: 'ja-JP',
            ANNOUNCEMENT_TEXT01_MSG: 'トロトロたまごが、できました。',
            ANNOUNCEMENT_TEXT02_MSG: '半熟たまごが、できました。',
            ANNOUNCEMENT_TEXT03_MSG: 'しっとりたまごが、できました。',
            ANNOUNCEMENT_TEXT04_MSG: '固ゆでたまごが、できました。',
            VOICE_PERMISSION_ACCEPTED: ['それでは、始めましょう。', 'さっそく、始めましょう。', 'それじゃあ、始めましょう。'],
            VOICE_PERMISSION_DENIED: 'タイマーの使用許可をいただけなかったので、このスキルを続けることができません。後ほどもう一度お試しください。',
            VOICE_PERMISSION_ERROR: 'タイマーの使用許可をいただく途中でエラーが起きてしまいました。後ほどもう一度お試しください。',
            CREATE_TIMER_OK_MSG: 'ゆで卵タイマーをセットしました。時間が来たらお知らせします。お好みの固さで取り出してください。では。しばらくお待ちください。',
            CREATE_TIMER_ERROR_MSG: 'タイマーのセットに失敗しました。ごめんなさい。'
        }
    }
}