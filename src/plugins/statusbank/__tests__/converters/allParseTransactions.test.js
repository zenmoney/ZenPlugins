import { parseFullTransactionsMail, parseDepositsMail } from '../../api'

describe('parseTransactions', () => {
  it.each([
    [
      '<?xml version="1.0" encoding="windows-1251" ?>\n<BS_Response>\n <ServerTime>20230630162426</ServerTime>\n <Session Expired="895"/>\n<MailAttachment>\n<Attachment>\n<Body Mimetype="text/html" xml:space="preserve"><![CDATA[<style>\n* {\n padding: 0;\n margin: 0;\n border:0;\n font-size:100%;\n font-weight: normal;\n vertical-align: baseline;\n font-family: Arial, Helvetica, sans-serif;\n}\ntable {\n border-collapse: collapse;\n border-spacing: 0;\n}\nh3 {\n font-family: \'MetaNormalLFC\', "Times New Roman", Times, serif;\n font-weight: normal;\n color: #333;\n font-size: 18px;\n margin-bottom: 15px;\n}\n.body-mini-vipiska{\n width: 735px;\n position: relative;\n min-height: 100px;\n clear: both;\n background: #fff;\n padding: 30px 0px 90px;\n border-left: 1px solid #dce0e6;\n border-right: 1px solid #dce0e6;\n border-bottom: 1px solid #c7cbd4;\n box-shadow: 0px 1px 1px -1px #c7cbd4;\n -webkit-border-radius: 6px;\n -moz-border-radius: 6px;\n border-radius: 6px;\n font-size: 13px;\n z-index: 100;\n}\n.body-mini-vipiska.corner:after {\n content: \';\n background: url("../img/bg-paper-corner.png") no-repeat;\n position: absolute;\n bottom: -1px;\n right: -4px;\n display: block;\n width: 67px;\n height: 94px;\n z-index: -1;\n}\n.body-mini-vipiska .head {\n margin: 0 15px;\n}\n.body-mini-vipiska .head p {\n color: #767676;\n}\n.body-mini-vipiska p strong {\n color: #000;\n}\n.table-schet-var1 {\n width: 100%;\n border-top: 1px solid #d2d2d2;\n font-size: 11px;\n color: #333;\n}\n.table-schet {\n font-size: 11px;\n color: #333;\n}\n.table-schet-var1 tr td {\n text-align: right;\n padding: 0px 18px 5px;\n font-size: 12px;\n vertical-align: middle;\n}\n.table-schet-var1 tr:first-child td {\n padding: 5px 18px 0;\n}\n.table-schet-var1 tr td+td {\n width: 100px;\n}\n.table-schet,\n.table-schet tr td {\n border-top: 1px solid #d2d2d2;\n}\n.table-schet tbody tr td,\n.table-schet thead tr th {\n padding: 9px 4px 9px 4px;\n text-align: center;\n line-height: 12px;\n width: 90px;\n vertical-align: middle;\n}\n.table-schet thead tr th:first-child,\n.table-schet tbody tr td:first-child {\n padding: 10px 4px 10px 15px;\n text-align: center;\n}\n.table-schet thead tr th+th+th {\n width: 160px;\n padding-left: 0px;\n text-align: center;\n}\n.table-schet tbody tr td+td+td {\n width: 160px;\n padding-left: 0px;\n text-align: left;\n}\n.table-schet tbody tr td+td+td+td,\n.table-schet thead tr th+th+th+th {\n width: 120px;\n padding-left: 0px;\n text-align: center;\n}\n.table-schet thead tr th+th+th+th+th,\n.table-schet tbody tr td+td+td+td+td {\n border-left: none;\n max-width: 120px;\n padding: 10px 4px 10px 15px;\n word-wrap: break-word;\n text-align: center;\n}\n.table-schet thead tr th+th+th+th+th+th,\n.table-schet tbody tr td+td+td+td+td+td {\n width: 100px;\n max-width: 100px;\n padding: 10px 4px 10px 15px;\n text-align: center;\n}\n.table-schet tbody tr td+td+td+td+td+td+td,\n.table-schet thead tr th+th+th+th+th+th+th {\n width: 100px;\n max-width: 110px;\n text-align: right;\n}\n.table-schet tbody tr td+td+td+td+td+td+td {\n font-size: 12px;\n}\n.table-schet-var1 thead tr th {\n padding-top: 10px;\n font-size: 12px;\n text-transform: uppercase;\n text-align: right;\n padding-right: 85px;\n}\n.hide {display:none}\n</style>\n<div class="body-mini-vipiska corner">\n<div class="head">\n <h3>ОАО \'Статусбанк\'. Выписка по карточке</h3>\n <p>Карточка 521058******2883</p>\n <p></p>\n <p>Николаев Николай Николаевич</p>\n <p>Идентификационная карта гражданина РБ № BY0000000 выдана 06.09.2021</p>\n <p>&nbsp;</p>\n <p>За период с: <strong>14.06.2023</strong> по: <strong>29.06.2023</strong></p>\n <p>Сформировано: 30.06.2023 16:24:26</p>\n\n</div> <div class="head">\n <p>&nbsp;</p>\n <!--p align="right">Счёт: <strong>$ACCOUNT$</strong></p-->\n </div>\n <hr>\n <p>&nbsp;</p>\n <table class="table-schet">\n <thead>\n <tr>\n <th>Дата совершения операции</th>\n <th>Дата отражения операции по счёту</th>\n <th>Тип транзакции</th>\n <th>Валюта счёта</th>\n <th>Сумма операции в валюте счёта</th>\n <th>Сумма в валюте операции</th>\n <th>Место проведения</th><th>Код авторизации</th><th>MCC-код</th>\n </tr>\n </thead>\n <tbody>\n <tr><td>15.06.2023</td><td>16.06.2023</td><td>Покупка товара / получение услуг</td><!--td>Возврат</td><td>0,00</td--><td>BYN</td><td>-300,00</td><td>-300 BYN</td><td>DBO STATUSBANK</td><td>792433</td><td>6012</td></tr>\n </tbody>\n </table>\n <table class="table-schet-var1">\n <thead>\n <tr>\n <th colspan="2">Обороты за период</th>\n </tr>\n </thead>\n <tbody>\n <tr>\n <td>+ поступило:</td><td><b>0,00</b></td>\n </tr>\n <tr>\n <td>– списано:</td><td><b>300,00</b></td>\n </tr>\n </tbody>\n </table>\n <hr></div>]]>\n</Body>\n</Attachment>\n</MailAttachment>\n</BS_Response>',
      [
        {
          amount: -300,
          amountReal: -300,
          authCode: '792433',
          cardNum: '521058******2883',
          currency: 'BYN',
          currencyReal: 'BYN',
          date: '15.06.2023',
          description: null,
          mcc: '6012',
          place: 'DBO STATUSBANK',
          type: 'Покупка товара / получение услуг'
        }
      ]
    ],
    [
      '<?xml version="1.0" encoding="windows-1251" ?>\n<BS_Response>\n <ServerTime>20230530194124</ServerTime>\n <Session Expired="895"/>\n<MailAttachment>\n<Attachment>\n<Body Mimetype="text/html" xml:space="preserve"><![CDATA[<style>\n* {\n padding: 0;\n margin: 0;\n border:0;\n font-size:100%;\n font-weight: normal;\n vertical-align: baseline;\n font-family: Arial, Helvetica, sans-serif;\n}\ntable {\n border-collapse: collapse;\n border-spacing: 0;\n}\nh3 {\n font-family: \'MetaNormalLFC\', "Times New Roman", Times, serif;\n font-weight: normal;\n color: #333;\n font-size: 18px;\n margin-bottom: 15px;\n}\n.body-mini-vipiska{\n width: 735px;\n position: relative;\n min-height: 100px;\n clear: both;\n background: #fff;\n padding: 30px 0px 90px;\n border-left: 1px solid #dce0e6;\n border-right: 1px solid #dce0e6;\n border-bottom: 1px solid #c7cbd4;\n box-shadow: 0px 1px 1px -1px #c7cbd4;\n -webkit-border-radius: 6px;\n -moz-border-radius: 6px;\n border-radius: 6px;\n font-size: 13px;\n z-index: 100;\n}\n.body-mini-vipiska.corner:after {\n content: \';\n background: url("../img/bg-paper-corner.png") no-repeat;\n position: absolute;\n bottom: -1px;\n right: -4px;\n display: block;\n width: 67px;\n height: 94px;\n z-index: -1;\n}\n.body-mini-vipiska .head {\n margin: 0 15px;\n}\n.body-mini-vipiska .head p {\n color: #767676;\n}\n.body-mini-vipiska p strong {\n color: #000;\n}\n.table-schet-var1 {\n width: 100%;\n border-top: 1px solid #d2d2d2;\n font-size: 11px;\n color: #333;\n}\n.table-schet {\n font-size: 11px;\n color: #333;\n}\n.table-schet-var1 tr td {\n text-align: right;\n padding: 0px 18px 5px;\n font-size: 12px;\n vertical-align: middle;\n}\n.table-schet-var1 tr:first-child td {\n padding: 5px 18px 0;\n}\n.table-schet-var1 tr td+td {\n width: 100px;\n}\n.table-schet,\n.table-schet tr td {\n border-top: 1px solid #d2d2d2;\n}\n.table-schet tbody tr td,\n.table-schet thead tr th {\n padding: 9px 4px 9px 4px;\n text-align: center;\n line-height: 12px;\n width: 90px;\n vertical-align: middle;\n}\n.table-schet thead tr th:first-child,\n.table-schet tbody tr td:first-child {\n padding: 10px 4px 10px 15px;\n text-align: center;\n}\n.table-schet thead tr th+th+th {\n width: 160px;\n padding-left: 0px;\n text-align: center;\n}\n.table-schet tbody tr td+td+td {\n width: 160px;\n padding-left: 0px;\n text-align: left;\n}\n.table-schet tbody tr td+td+td+td,\n.table-schet thead tr th+th+th+th {\n width: 120px;\n padding-left: 0px;\n text-align: center;\n}\n.table-schet thead tr th+th+th+th+th,\n.table-schet tbody tr td+td+td+td+td {\n border-left: none;\n max-width: 120px;\n padding: 10px 4px 10px 15px;\n word-wrap: break-word;\n text-align: center;\n}\n.table-schet thead tr th+th+th+th+th+th,\n.table-schet tbody tr td+td+td+td+td+td {\n width: 100px;\n max-width: 100px;\n padding: 10px 4px 10px 15px;\n text-align: center;\n}\n.table-schet tbody tr td+td+td+td+td+td+td,\n.table-schet thead tr th+th+th+th+th+th+th {\n width: 100px;\n max-width: 110px;\n text-align: right;\n}\n.table-schet tbody tr td+td+td+td+td+td+td {\n font-size: 12px;\n}\n.table-schet-var1 thead tr th {\n padding-top: 10px;\n font-size: 12px;\n text-transform: uppercase;\n text-align: right;\n padding-right: 85px;\n}\n.hide {display:none}\n</style>\n<div class="body-mini-vipiska corner">\n<div class="head">\n <h3>ОАО \'Статусбанк\'. Выписка по карточке</h3>\n <p>Карточка 911239******7642</p>\n <p></p>\n <p>Николаев Николай Николаевич</p>\n <p>Паспорт иностранного гражданина № 0000000000 выдан 30.05.2018</p>\n <p>&nbsp;</p>\n <p>За период с: <strong>04.04.2023</strong> по: <strong>04.05.2023</strong></p>\n <p>Сформировано: 30.05.2023 19:41:22</p>\n\n</div> <div class="head">\n <p>&nbsp;</p>\n <!--p align="right">Счёт: <strong>$ACCOUNT$</strong></p-->\n </div>\n <hr>\n <p>&nbsp;</p>\n <table class="table-schet">\n <thead>\n <tr>\n <th>Дата совершения операции</th>\n <th>Дата отражения операции по счёту</th>\n <th>Тип транзакции</th>\n <th>Валюта счёта</th>\n <th>Сумма операции в валюте счёта</th>\n <th>Сумма в валюте операции</th>\n <th>Место проведения</th><th>Код авторизации</th><th>MCC-код</th>\n </tr>\n </thead>\n <tbody>\n <tr><td>21.04.2023</td><td>26.04.2023</td><td>Перевод/списание средств</td><!--td>Возврат</td><td>0,00</td--><td>BYN</td><td>-242,87</td><td>-81,5 USD</td><td>STBANK DBO P2P</td><td>234179</td><td>6012</td></tr><tr><td>21.04.2023</td><td>27.04.2023</td><td>Перевод/зачисление средств</td><!--td></td><td>0,00</td--><td>BYN</td><td>315,58</td><td>9000 RUB</td><td>Tinkoff Card2Card</td><td>219173</td><td>6537</td></tr>\n </tbody>\n </table>\n <table class="table-schet-var1">\n <thead>\n <tr>\n <th colspan="2">Обороты за период</th>\n </tr>\n </thead>\n <tbody>\n <tr>\n <td>+ поступило:</td><td><b>315,58</b></td>\n </tr>\n <tr>\n <td>– списано:</td><td><b>242,87</b></td>\n </tr>\n </tbody>\n </table>\n <hr></div>]]>\n</Body>\n</Attachment>\n</MailAttachment>\n</BS_Response>',
      [
        {
          amount: -242.87,
          amountReal: -81.5,
          authCode: '234179',
          cardNum: '911239******7642',
          currency: 'BYN',
          currencyReal: 'USD',
          date: '21.04.2023',
          description: null,
          mcc: '6012',
          place: 'STBANK DBO P2P',
          type: 'Перевод/списание средств'
        },
        {
          amount: 315.58,
          amountReal: 9000,
          authCode: '219173',
          cardNum: '911239******7642',
          currency: 'BYN',
          currencyReal: 'RUB',
          date: '21.04.2023',
          description: null,
          mcc: '6537',
          place: 'Tinkoff Card2Card',
          type: 'Перевод/зачисление средств'
        }
      ]
    ]
  ])('parses transactions xtml', (xtml, apiAccounts) => {
    expect(parseFullTransactionsMail(xtml)).toEqual(apiAccounts)
  })
})

describe('parseTransactionsDeposits', () => {
  it.each([
    [
      '<?xml version="1.0" encoding="windows-1251" ?>\n<BS_Response>\n <ServerTime>20230630162426</ServerTime>\n <Session Expired="895"/>\n<MailAttachment>\n<Attachment>\n<Body Mimetype="text/html" xml:space="preserve"><![CDATA[<html>\n<head>\n <meta http-equiv="Content-Type" content="text/html; charset=windows-1251">\n <title>Список операций</title>\n <style>\nbody{padding:5px;margin:0;font-family:Arial,sans-serif;font-size: 10pt;width:22cm;}\ntable{font-family:Arial,sans-serif;font-size: 8pt;border-collapse: collapse;}\nthead{background-color: #F1F5F9;}\ntbody{font-size: 11px;}\n.section_1{width: 100%;margin: 0;padding: 0;color: #333;font: 12px/16px Arial, Helvetica, sans-serif;font-size: 10px;line-height: 10pt;}\n.section_1 th{border-bottom: 1px solid #e4e4e4;height: 1cm;margin: 0 auto;}\n.section_1 td{margin: 0.1cm;padding: 0.1cm;}\n.section_1 td+td{border-left:1px solid #e4e4e4;}\n.section_1 tr{margin: 0;padding: 0;}\n.section_1 tr:last-of-type{border-bottom: 1px solid #e4e4e4;}\n.col2,.col5 {word-break: normal;}\n.col1,.col3, .col4 {width: 3cm;}\n.col2 {width:0.5cm;}\n.col5 {width: 1.4cm;}\n.right {float: right;}\n.summ {text-align: right;}\n.center {text-align: center;}\n.disable {color: lightgray}\n </style>\n</head>\n<body>\n <table style="font-size:10pt; width:100%;">\n <tr>\n <td><b>ОАО "СтатусБанк"</b></td>\n <td style="text-align: right;"><b>30.06.2023 16:24:26</b></td>\n </tr>\n </table>\n <p style="margin-right:auto;text-align:center;">\n <b>Список операций<br>по карточке 521058******2883</b><br>\n </p>\n<table class="section_1" cellspacing="0">\n<thead>\n <tr>\n<th class="col1">Дата <br>операции</th>\n<th class="col2">От-<br>мена</th>\n<th class="col3">Операция</th>\n<th class="col4 summ">Сумма <br>операции</th>\n<th class="col5">Код авто-<br>ризации</th>\n<th class="col6">RRN</th>\n<th class="col7">Место совершения</th>\n </tr>\n</thead><tbody><tr >\n<td class="col1">15.06.2023 08:39:11</td>\n<td class="col2 center"></td>\n<td class="col3">Оплата</td>\n<td class="col4 summ">-300,00 BYN</td>\n<td class="col5 center">792433</td>\n<td class="col6 center">001766790666</td>\n<td class="col7">760900, POS, DBO STATUSBANK</td>\n</tr></tbody><tbody><tr >\n<td class="col1">14.06.2023 20:01:38</td>\n<td class="col2 center"></td>\n<td class="col3">SPISANIE SO SCHETA</td>\n<td class="col4 summ">-700,00 BYN</td>\n<td class="col5 center">362942</td>\n<td class="col6 center">001766361175</td>\n<td class="col7">899997, EPOS, STATUSBANK ABS</td>\n</tr></tbody><tbody><tr >\n<td class="col1">14.06.2023 19:58:32</td>\n<td class="col2 center"></td>\n<td class="col3">ZACHISLENIE NA SCHET</td>\n<td class="col4 summ">1 000,00 BYN</td>\n<td class="col5 center">358497</td>\n<td class="col6 center">001766356730</td>\n<td class="col7">899997, EPOS, STATUSBANK ABS</td>\n</tr></tbody><tbody><tr >\n<td class="col1">03.06.2023 19:10:55</td>\n<td class="col2 center"></td>\n<td class="col3">Оплата</td>\n<td class="col4 summ">-20,00 BYN</td>\n<td class="col5 center">491258</td>\n<td class="col6 center">001751489506</td>\n<td class="col7">760900, POS, DBO STATUSBANK</td>\n</tr></tbody><tbody><tr >\n<td class="col1">01.06.2023 04:50:53</td>\n<td class="col2 center"></td>\n<td class="col3">ZACHISLENIE NA SCHET</td>\n<td class="col4 summ">20,00 BYN</td>\n<td class="col5 center">707450</td>\n<td class="col6 center">001747705702</td>\n<td class="col7">899997, EPOS, STATUSBANK ABS</td>\n</tr></tbody></table>\n <p style="margin-right:auto;text-align:center;">\n <b>По любым вопросам, касающимся операций по карточке,<br>просим обращаться в офис банка.<br>Для экстренной блокировки карточки звоните по телефону 375(17)360-00-44</b>\n</p></body></html>]]>\n</Body>\n</Attachment>\n</MailAttachment>\n</BS_Response>',
      [
        {
          amount: null,
          amountReal: -300,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '15.06.2023 08:39:11',
          description: null,
          mcc: null,
          place: '760900, POS, DBO STATUSBANK',
          type: 'Оплата'
        },
        {
          amount: null,
          amountReal: -700,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '14.06.2023 20:01:38',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'SPISANIE SO SCHETA'
        },
        {
          amount: null,
          amountReal: 1000,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '14.06.2023 19:58:32',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        },
        {
          amount: null,
          amountReal: -20,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '03.06.2023 19:10:55',
          description: null,
          mcc: null,
          place: '760900, POS, DBO STATUSBANK',
          type: 'Оплата'
        },
        {
          amount: null,
          amountReal: 20,
          authCode: null,
          cardNum: '521058******2883',
          currency: null,
          currencyReal: 'BYN',
          date: '01.06.2023 04:50:53',
          description: null,
          mcc: null,
          place: '899997, EPOS, STATUSBANK ABS',
          type: 'ZACHISLENIE NA SCHET'
        }
      ]
    ]
  ])('parses transactions deposits xtml', (xtml, apiAccounts) => {
    expect(parseDepositsMail(xtml)).toEqual(apiAccounts)
  })
})
