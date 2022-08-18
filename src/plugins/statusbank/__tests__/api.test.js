import { createDateIntervals, parseFullTransactionsMail, parseDepositsMail } from '../api'

describe('createDateIntervals', () => {
  it('should convert date period', () => {
    expect(
      createDateIntervals(new Date('2018-01-01T20:45+03:00'), new Date('2018-03-05T09:00+03:00'))
    ).toEqual(
      [
        [new Date('2018-01-01T20:45:00+03:00'), new Date('2018-02-01T20:44:59.999+03:00')],
        [new Date('2018-02-01T20:45:00+03:00'), new Date('2018-03-04T20:44:59.999+03:00')],
        [new Date('2018-03-04T20:45:00+03:00'), new Date('2018-03-05T09:00:00.000+03:00')]
      ]
    )
  })
})

describe('deposits parsing', () => {
  const tt = [
    {
      name: 'deposit',
      html: '<html><head> <meta http-equiv="Content-Type" content="text/html; charset=windows-1251"> <title>Список операций</title> <style>body{padding:5px;margin:0;font-family:Arial,sans-serif;font-size: 10pt;width:22cm;}table{font-family:Arial,sans-serif;font-size: 8pt;border-collapse: collapse;}thead{background-color: #F1F5F9;}tbody{font-size: 11px;}.section_1{width: 100%;margin: 0;padding: 0;color: #333;font: 12px/16px Arial, Helvetica, sans-serif;font-size: 10px;line-height: 10pt;}.section_1 th{border-bottom: 1px solid #e4e4e4;height: 1cm;margin: 0 auto;}.section_1 td{margin: 0.1cm;padding: 0.1cm;}.section_1 td+td{border-left:1px solid #e4e4e4;}.section_1 tr{margin: 0;padding: 0;}.section_1 tr:last-of-type{border-bottom: 1px solid #e4e4e4;}.col2,.col5{word-break: normal;}.col1,.col3, .col4{width: 3cm;}.col2{width:0.5cm;}.col5{width: 1.4cm;}.right{float: right;}.summ{text-align: right;}.center{text-align: center;}.disable{color: lightgray}</style></head><body> <table style="font-size:10pt; width:100%;"> <tr> <td><b>ОАО "СтатусБанк"</b></td><td style="text-align: right;"><b>30.10.2021 00:00:45</b></td></tr></table> <p style="margin-right:auto;text-align:center;"> <b>Список операций<br>по карточке 521058******2222</b><br></p><table class="section_1" cellspacing="0"><thead> <tr><th class="col1">Дата <br>операции</th><th class="col2">От-<br>мена</th><th class="col3">Операция</th><th class="col4 summ">Сумма <br>операции</th><th class="col5">Код авто-<br>ризации</th><th class="col6">RRN</th><th class="col7">Место совершения</th> </tr></thead><tbody><tr ><td class="col1">26.05.2021 00:00:00</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-10,00 BYN</td><td class="col5 center">580048</td><td class="col6 center">126902372717</td><td class="col7">SHJ16093, POS, SHOP "EVROOPT"</td></tr></tbody></table> <p style="margin-right:auto;text-align:center;"> <b>По любым вопросам, касающимся операций по карточке,<br>просим обращаться в офис банка.<br>Для экстренной блокировки карточки звоните по телефону 375(17)360-00-44</b></p></body></html>',
      expectedTransactions: [
        {
          amount: null,
          amountReal: -10,
          authCode: null,
          cardNum: '521058******2222',
          currency: null,
          currencyReal: 'BYN',
          date: '26.05.2021 00:00:00',
          description: null,
          mcc: null,
          place: 'SHJ16093, POS, SHOP "EVROOPT"',
          type: 'OPLATA'
        }
      ]
    },
    {
      name: 'deposit-2',
      html: '<html><head> <meta http-equiv="Content-Type" content="text/html; charset=windows-1251"> <title>Список операций</title> <style>body{padding:5px;margin:0;font-family:Arial,sans-serif;font-size: 10pt;width:22cm;}table{font-family:Arial,sans-serif;font-size: 8pt;border-collapse: collapse;}thead{background-color: #F1F5F9;}tbody{font-size: 11px;}.section_1{width: 100%;margin: 0;padding: 0;color: #333;font: 12px/16px Arial, Helvetica, sans-serif;font-size: 10px;line-height: 10pt;}.section_1 th{border-bottom: 1px solid #e4e4e4;height: 1cm;margin: 0 auto;}.section_1 td{margin: 0.1cm;padding: 0.1cm;}.section_1 td+td{border-left:1px solid #e4e4e4;}.section_1 tr{margin: 0;padding: 0;}.section_1 tr:last-of-type{border-bottom: 1px solid #e4e4e4;}.col2,.col5 {word-break: normal;}.col1,.col3, .col4 {width: 3cm;}.col2 {width:0.5cm;}.col5 {width: 1.4cm;}.right {float: right;}.summ {text-align: right;}.center {text-align: center;}.disable {color: lightgray} </style></head><body> <table style="font-size:10pt; width:100%;"> <tr> <td><b>ОАО "СтатусБанк"</b></td> <td style="text-align: right;"><b>15.05.2022 18:12:48</b></td> </tr> </table> <p style="margin-right:auto;text-align:center;"> <b>Список операций<br>по карточке 521058******2883</b><br> </p><table class="section_1" cellspacing="0"><thead> <tr><th class="col1">Дата <br>операции</th><th class="col2">От-<br>мена</th><th class="col3">Операция</th><th class="col4 summ">Сумма <br>операции</th><th class="col5">Код авто-<br>ризации</th><th class="col6">RRN</th><th class="col7">Место совершения</th> </tr></thead><tbody><tr ><td class="col1">15.05.2022 15:03:27</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-31,96 BYN</td><td class="col5 center">723375</td><td class="col6 center">001302722072</td><td class="col7">760900, POS, DBO STATUSBANK</td></tr></tbody><tbody><tr ><td class="col1">14.05.2022 09:45:14</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-20,27 BYN</td><td class="col5 center"></td><td class="col6 center">213317802768</td><td class="col7">SHJ33564, POS, SHOP "EVROOPT"</td></tr></tbody><tbody><tr ><td class="col1">14.05.2022 09:44:59</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-20,27 BYN</td><td class="col5 center"></td><td class="col6 center">213317801828</td><td class="col7">SHJ33564, POS, SHOP "EVROOPT"</td></tr></tbody><tbody><tr ><td class="col1">13.05.2022 15:59:56</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-80,00 BYN</td><td class="col5 center">632609</td><td class="col6 center">001300631308</td><td class="col7">760900, POS, DBO STATUSBANK</td></tr></tbody><tbody><tr ><td class="col1">13.05.2022 15:10:51</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-50,14 BYN</td><td class="col5 center">579052</td><td class="col6 center">001300577751</td><td class="col7">760900, POS, DBO STATUSBANK</td></tr></tbody><tbody><tr ><td class="col1">10.05.2022 17:29:43</td><td class="col2 center"></td><td class="col3">OPLATA V INTERNET</td><td class="col4 summ">-46,60 BYN</td><td class="col5 center">595988</td><td class="col6 center">213096290460</td><td class="col7">SWA19629, EPOS, I.-SHOP WWW.EMALL.BY</td></tr></tbody><tbody><tr ><td class="col1">10.05.2022 16:09:18</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">200,00 BYN</td><td class="col5 center">494656</td><td class="col6 center">001297493358</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody><tbody><tr ><td class="col1">05.05.2022 21:08:21</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-8,65 BYN</td><td class="col5 center">532613</td><td class="col6 center">212521226820</td><td class="col7">SHJ34646, POS, SHOP "EVROOPT"</td></tr></tbody><tbody><tr ><td class="col1">05.05.2022 21:06:09</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">10,70 BYN</td><td class="col5 center">531339</td><td class="col6 center">001293530045</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody><tbody><tr ><td class="col1">05.05.2022 13:16:04</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-4,27 BYN</td><td class="col5 center">075329</td><td class="col6 center">212513466639</td><td class="col7">SAG49342, POS, STOLOVAYA N 26 BAPB</td></tr></tbody><tbody><tr ><td class="col1">05.05.2022 08:47:55</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">0,85 BYN</td><td class="col5 center">694788</td><td class="col6 center">000135168362</td><td class="col7">ACCOUNT, VOICE, STATUSBANK</td></tr></tbody><tbody><tr ><td class="col1">04.05.2022 18:29:16</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-7,90 BYN</td><td class="col5 center">389546</td><td class="col6 center">212418040590</td><td class="col7">SHC01265, POS, ZOOSHOP "EKZOTIKA"</td></tr></tbody><tbody><tr ><td class="col1">04.05.2022 18:27:03</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-2,75 BYN</td><td class="col5 center">387580</td><td class="col6 center">212418384367</td><td class="col7">SAG42829, POS, SHOP "DARY OT ZARI" N8</td></tr></tbody><tbody><tr ><td class="col1">04.05.2022 17:45:11</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">12,50 BYN</td><td class="col5 center">346089</td><td class="col6 center">001292344796</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody><tbody><tr ><td class="col1">04.05.2022 13:30:48</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-1,98 BYN</td><td class="col5 center">102497</td><td class="col6 center">212413480334</td><td class="col7">SAG54383, POS, STOLOVAYA N 26 BAPB</td></tr></tbody><tbody><tr ><td class="col1">04.05.2022 13:17:41</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-5,36 BYN</td><td class="col5 center">089015</td><td class="col6 center">212413466473</td><td class="col7">SAG49342, POS, STOLOVAYA N 26 BAPB</td></tr></tbody><tbody><tr ><td class="col1">04.05.2022 13:02:11</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">15,00 BYN</td><td class="col5 center">072452</td><td class="col6 center">001292071159</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody><tbody><tr ><td class="col1">28.04.2022 16:04:06</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA KARTU</td><td class="col4 summ">0,56 BYN</td><td class="col5 center">244232</td><td class="col6 center">211893543532</td><td class="col7">SWA19354, POS, SHOP"WWW.E-DOSTAVKA.BY</td></tr></tbody><tbody><tr ><td class="col1">15.04.2022 15:51:34</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-82,95 BYN</td><td class="col5 center">770809</td><td class="col6 center">001274769534</td><td class="col7">760900, POS, DBO STATUSBANK</td></tr></tbody><tbody><tr ><td class="col1">14.04.2022 20:54:21</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-16,13 BYN</td><td class="col5 center">935056</td><td class="col6 center">210420608558</td><td class="col7">SHJ34664, POS, SHOP "EVROOPT"</td></tr></tbody><tbody><tr ><td class="col1">14.04.2022 20:46:00</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">99,08 BYN</td><td class="col5 center">928977</td><td class="col6 center">001273927703</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody></table> <p style="margin-right:auto;text-align:center;"> <b>По любым вопросам, касающимся операций по карточке,<br>просим обращаться в офис банка.<br>Для экстренной блокировки карточки звоните по телефону 375(17)360-00-44</b></p></body></html>',
      expectedTransactions: [
        {
          amount: null,
          amountReal: -31.96,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '15.05.2022 15:03:27',
          description: null,
          mcc: null,
          place: '760900, POS, DBO STATUSBANK',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -20.27,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '14.05.2022 09:45:14',
          description: null,
          mcc: null,
          place: 'SHJ33564, POS, SHOP "EVROOPT"',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -20.27,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '14.05.2022 09:44:59',
          description: null,
          mcc: null,
          place: 'SHJ33564, POS, SHOP "EVROOPT"',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -80,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '13.05.2022 15:59:56',
          description: null,
          mcc: null,
          place: '760900, POS, DBO STATUSBANK',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -50.14,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '13.05.2022 15:10:51',
          description: null,
          mcc: null,
          place: '760900, POS, DBO STATUSBANK',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -46.6,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '10.05.2022 17:29:43',
          description: null,
          mcc: null,
          place: 'SWA19629, EPOS, I.-SHOP WWW.EMALL.BY',
          type: 'OPLATA V INTERNET'
        },
        {
          amount: null,
          amountReal: 200,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '10.05.2022 16:09:18',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: -8.65,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '05.05.2022 21:08:21',
          description: null,
          mcc: null,
          place: 'SHJ34646, POS, SHOP "EVROOPT"',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: 10.7,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '05.05.2022 21:06:09',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: -4.27,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '05.05.2022 13:16:04',
          description: null,
          mcc: null,
          place: 'SAG49342, POS, STOLOVAYA N 26 BAPB',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: 0.85,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '05.05.2022 08:47:55',
          description: null,
          mcc: null,
          place: 'ACCOUNT, VOICE, STATUSBANK',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: -7.9,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '04.05.2022 18:29:16',
          description: null,
          mcc: null,
          place: 'SHC01265, POS, ZOOSHOP "EKZOTIKA"',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -2.75,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '04.05.2022 18:27:03',
          description: null,
          mcc: null,
          place: 'SAG42829, POS, SHOP "DARY OT ZARI" N8',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: 12.5,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '04.05.2022 17:45:11',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: -1.98,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '04.05.2022 13:30:48',
          description: null,
          mcc: null,
          place: 'SAG54383, POS, STOLOVAYA N 26 BAPB',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -5.36,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '04.05.2022 13:17:41',
          description: null,
          mcc: null,
          place: 'SAG49342, POS, STOLOVAYA N 26 BAPB',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: 15,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '04.05.2022 13:02:11',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: 0.56,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '28.04.2022 16:04:06',
          description: null,
          mcc: null,
          place: 'SWA19354, POS, SHOP"WWW.E-DOSTAVKA.BY',
          type: 'ZACHISLENIE NA KARTU'
        },
        {
          amount: null,
          amountReal: -82.95,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '15.04.2022 15:51:34',
          description: null,
          mcc: null,
          place: '760900, POS, DBO STATUSBANK',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: -16.13,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '14.04.2022 20:54:21',
          description: null,
          mcc: null,
          place: 'SHJ34664, POS, SHOP "EVROOPT"',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: 99.08,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '14.04.2022 20:46:00',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        }
      ]
    },
    {
      name: 'deposit-3',
      html: '<html><head> <meta http-equiv="Content-Type" content="text/html; charset=windows-1251"> <title>Список операций</title> <style>body{padding:5px;margin:0;font-family:Arial,sans-serif;font-size: 10pt;width:22cm;}table{font-family:Arial,sans-serif;font-size: 8pt;border-collapse: collapse;}thead{background-color: #F1F5F9;}tbody{font-size: 11px;}.section_1{width: 100%;margin: 0;padding: 0;color: #333;font: 12px/16px Arial, Helvetica, sans-serif;font-size: 10px;line-height: 10pt;}.section_1 th{border-bottom: 1px solid #e4e4e4;height: 1cm;margin: 0 auto;}.section_1 td{margin: 0.1cm;padding: 0.1cm;}.section_1 td+td{border-left:1px solid #e4e4e4;}.section_1 tr{margin: 0;padding: 0;}.section_1 tr:last-of-type{border-bottom: 1px solid #e4e4e4;}.col2,.col5 {word-break: normal;}.col1,.col3, .col4 {width: 3cm;}.col2 {width:0.5cm;}.col5 {width: 1.4cm;}.right {float: right;}.summ {text-align: right;}.center {text-align: center;}.disable {color: lightgray} </style></head><body> <table style="font-size:10pt; width:100%;"> <tr> <td><b>ОАО "СтатусБанк"</b></td> <td style="text-align: right;"><b>24.05.2022 20:14:14</b></td> </tr> </table> <p style="margin-right:auto;text-align:center;"> <b>Список операций<br>по карточке 521058******8691</b><br> </p><table class="section_1" cellspacing="0"><thead> <tr><th class="col1">Дата <br>операции</th><th class="col2">От-<br>мена</th><th class="col3">Операция</th><th class="col4 summ">Сумма <br>операции</th><th class="col5">Код авто-<br>ризации</th><th class="col6">RRN</th><th class="col7">Место совершения</th> </tr></thead><tbody><tr ><td class="col1">22.05.2022 16:52:49</td><td class="col2 center"></td><td class="col3">OPLATA</td><td class="col4 summ">-6,14 BYN</td><td class="col5 center">954615</td><td class="col6 center">214216254680</td><td class="col7">SHS10181, POS, SHOP "SOSEDI"</td></tr></tbody><tbody><tr ><td class="col1">22.05.2022 14:06:49</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">7,00 BYN</td><td class="col5 center">809351</td><td class="col6 center">001309808041</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody><tbody><tr ><td class="col1">22.05.2022 14:04:44</td><td class="col2 center"></td><td class="col3">ZACHISLENIE NA SCHET</td><td class="col4 summ">53,79 BYN</td><td class="col5 center">807517</td><td class="col6 center">001309806207</td><td class="col7">899997, EPOS, STATUSBANK ABS</td></tr></tbody><tbody><tr ><td class="col1">21.05.2022 21:49:40</td><td class="col2 center"></td><td class="col3">SMENA STATUSA</td><td class="col4 summ">0,00 BYN</td><td class="col5 center">436517</td><td class="col6 center">001309435207</td><td class="col7">899920, EPOS, Term from STATUS STB</td></tr></tbody></table> <p style="margin-right:auto;text-align:center;"> <b>По любым вопросам, касающимся операций по карточке,<br>просим обращаться в офис банка.<br>Для экстренной блокировки карточки звоните по телефону 375(17)360-00-44</b></p></body></html>',
      expectedTransactions: [
        {
          amount: null,
          amountReal: -6.14,
          authCode: null,
          cardNum: '521058******8691',
          currency: null,
          currencyReal: 'BYN',
          date: '22.05.2022 16:52:49',
          description: null,
          mcc: null,
          place: 'SHS10181, POS, SHOP "SOSEDI"',
          type: 'OPLATA'
        },
        {
          amount: null,
          amountReal: 7,
          authCode: null,
          cardNum: '521058******8691',
          currency: null,
          currencyReal: 'BYN',
          date: '22.05.2022 14:06:49',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: 53.79,
          authCode: null,
          cardNum: '521058******8691',
          currency: null,
          currencyReal: 'BYN',
          date: '22.05.2022 14:04:44',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: 0,
          authCode: null,
          cardNum: '521058******8691',
          currency: null,
          currencyReal: 'BYN',
          date: '21.05.2022 21:49:40',
          description: null,
          mcc: null,
          place: '899920, EPOS, Term from STATUS STB',
          type: 'SMENA STATUSA'
        }
      ]
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      expect(parseDepositsMail(tc.html)).toEqual(tc.expectedTransactions)
    })
  }
})

describe('transactions parsing', () => {
  const tt = [
    {
      name: 'transactions',
      html: '<style>*{padding: 0; margin: 0; border:0; font-size:100%; font-weight: normal; vertical-align: baseline; font-family: Arial, Helvetica, sans-serif;}table{border-collapse: collapse; border-spacing: 0;}h3{font-family: MetaNormalLFC, "Times New Roman", Times, serif; font-weight: normal; color: #333; font-size: 18px; margin-bottom: 15px;}.body-mini-vipiska{width: 735px; position: relative; min-height: 100px; clear: both; background: #fff; padding: 30px 0px 90px; border-left: 1px solid #dce0e6; border-right: 1px solid #dce0e6; border-bottom: 1px solid #c7cbd4; box-shadow: 0px 1px 1px -1px #c7cbd4; -webkit-border-radius: 6px; -moz-border-radius: 6px; border-radius: 6px; font-size: 13px; z-index: 100;}.body-mini-vipiska.corner:after{content: ; background: url("../img/bg-paper-corner.png") no-repeat; position: absolute; bottom: -1px; right: -4px; display: block; width: 67px; height: 94px; z-index: -1;}.body-mini-vipiska .head{margin: 0 15px;}.body-mini-vipiska .head p{color: #767676;}.body-mini-vipiska p strong{color: #000;}.table-schet-var1{width: 100%; border-top: 1px solid #d2d2d2; font-size: 11px; color: #333;}.table-schet{font-size: 11px; color: #333;}.table-schet-var1 tr td{text-align: right; padding: 0px 18px 5px; font-size: 12px; vertical-align: middle;}.table-schet-var1 tr:first-child td{padding: 5px 18px 0;}.table-schet-var1 tr td+td{width: 100px;}.table-schet,.table-schet tr td{border-top: 1px solid #d2d2d2;}.table-schet tbody tr td,.table-schet thead tr th{padding: 9px 4px 9px 4px; text-align: center; line-height: 12px; width: 90px; vertical-align: middle;}.table-schet thead tr th:first-child,.table-schet tbody tr td:first-child{padding: 10px 4px 10px 15px; text-align: center;}.table-schet thead tr th+th+th{width: 160px; padding-left: 0px; text-align: center;}.table-schet tbody tr td+td+td{width: 160px; padding-left: 0px; text-align: left;}.table-schet tbody tr td+td+td+td,.table-schet thead tr th+th+th+th{width: 120px; padding-left: 0px; text-align: center;}.table-schet thead tr th+th+th+th+th,.table-schet tbody tr td+td+td+td+td{border-left: none; max-width: 120px; padding: 10px 4px 10px 15px; word-wrap: break-word; text-align: center;}.table-schet thead tr th+th+th+th+th+th,.table-schet tbody tr td+td+td+td+td+td{width: 100px; max-width: 100px; padding: 10px 4px 10px 15px; text-align: center;}.table-schet tbody tr td+td+td+td+td+td+td,.table-schet thead tr th+th+th+th+th+th+th{width: 100px; max-width: 110px; text-align: right;}.table-schet tbody tr td+td+td+td+td+td+td{font-size: 12px;}.table-schet-var1 thead tr th{padding-top: 10px; font-size: 12px; text-transform: uppercase; text-align: right; padding-right: 85px;}.hide{display:none}</style><div class="body-mini-vipiska corner"><div class="head"> <h3>ОАО СТАТУСБАНК. Выписка по карточке</h3> <p>Карточка 521058******2222</p><p></p><p>Иванов Иван Иванович</p><p>Паспорт выдан </p><p>&nbsp;</p><p>За период с: <strong>01.10.2021</strong> по: <strong>20.10.2021</strong></p><p>Сформировано: 30.10.2021 00:00:00</p></div><div class="head"> <p>&nbsp;</p></div><hr> <p>&nbsp;</p><table class="table-schet"> <thead> <tr> <th>Дата совершения операции</th> <th>Дата отражения операции по счёту</th> <th>Тип транзакции</th> <th>Валюта счёта</th> <th>Сумма операции в валюте счёта</th> <th>Сумма в валюте операции</th> <th>Место проведения</th><th>Код авторизации</th><th>MCC-код</th> </tr></thead> <tbody> <tr><td>10.10.2021</td><td>12.10.2021</td><td>Покупка товара / получение услуг</td><td>BYN</td><td>-1,16</td><td>-1,16 BYN</td><td>SHOP "EUROOPT PRIME"</td><td>052279</td><td>5411</td></tr></tbody> </table> <table class="table-schet-var1"> <thead> <tr> <th colspan="2">Обороты за период</th> </tr></thead> <tbody> <tr> <td>+ поступило:</td><td><b>0,00</b></td></tr><tr> <td>– списано:</td><td><b>1,16</b></td></tr></tbody> </table> <hr></div>',
      expectedTransactions: [
        {
          amount: -1.16,
          amountReal: -1.16,
          authCode: '052279',
          cardNum: '521058******2222',
          currency: 'BYN',
          currencyReal: 'BYN',
          date: '10.10.2021',
          description: null,
          mcc: '5411',
          place: 'SHOP "EUROOPT PRIME"',
          type: 'Покупка товара / получение услуг'
        }
      ]
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      expect(parseFullTransactionsMail(tc.html)).toEqual(tc.expectedTransactions)
    })
  }
})
