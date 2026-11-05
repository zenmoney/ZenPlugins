import { ExtendedTransaction } from '../../../../types/zenmoney'
// @ts-expect-error Legacy JavaScript parser.
import * as legacyApi from '../../api'
// @ts-expect-error Legacy JavaScript converter.
import * as legacyConverters from '../../converters'
const { parseAccountTransactionsHtml } = legacyApi as { parseAccountTransactionsHtml: (html: string) => unknown[] }
const { convertTransaction } = legacyConverters as {
  convertTransaction: (raw: unknown, account: { id: string, instrument: string }) => ExtendedTransaction
}
it('keeps the complete statement and refund purpose containing a comma', () => {
  // mail_inbound 197958, statusbank build 75, response 30: complete AccountStatment HTML.
  // Customer identity, address, document and account identifiers are replaced for master.
  const html = "<style>\n* {\n  padding: 0;\n  margin: 0;\n  border:0;\n  font-size:100%;\n  font-weight: normal;\n  vertical-align: baseline;\n  font-family: Arial, Helvetica, sans-serif;\n}\ntable {\n  border-collapse: collapse;\n  border-spacing: 0;\n}\nh3 {\n  font-family: 'MetaNormalLFC', \"Times New Roman\", Times, serif;\n  font-weight: normal;\n  color: #333;\n  font-size: 18px;\n  margin-bottom: 15px;\n}\n.body-mini-vipiska{\n  width: 735px;\n  position: relative;\n  min-height: 100px;\n  clear: both;\n  background: #fff;\n  padding: 30px 0px 90px;\n  border-left: 1px solid #dce0e6;\n  border-right: 1px solid #dce0e6;\n  border-bottom: 1px solid #c7cbd4;\n  box-shadow: 0px 1px 1px -1px #c7cbd4;\n  -webkit-border-radius: 6px;\n  -moz-border-radius: 6px;\n  border-radius: 6px;\n  font-size: 13px;\n  z-index: 100;\n}\n.body-mini-vipiska.corner:after {\n  content: '';\n  background: url(\"../img/bg-paper-corner.png\") no-repeat;\n  position: absolute;\n  bottom: -1px;\n  right: -4px;\n  display: block;\n  width: 67px;\n  height: 94px;\n  z-index: -1;\n}\n.body-mini-vipiska .head {\n  margin: 0 15px;\n}\n.body-mini-vipiska .head p {\n  color: #767676;\n}\n.body-mini-vipiska p strong {\n  color: #000;\n}\n.table-schet-var1 {\n  width: 35%;\n  border-top: 1px solid #d2d2d2;\n  font-size: 11px;\n  color: #767676;\n}\n.table-schet {\n  font-size: 11px;\n  color: #767676;\n}\n.table-schet-var1 tr td {\n  text-align: left;\n  padding: 0px 18px 5px;\n  font-size: 12px;\n  vertical-align: middle;\n}\n.table-schet-var1 tr:first-child td {\n  padding: 5px 18px 0;\n}\n.table-schet-var1 tr td+td {\n  width: 100px;\n}\n.table-schet,\n.table-schet tr td {\n  border-top: 1px solid #d2d2d2;\n}\n.table-schet tbody tr td,\n.table-schet thead tr th {\n  padding: 9px 4px 9px 4px;\n  text-align: center;\n  line-height: 12px;\n  width: 90px;\n  vertical-align: middle;\n}\n.table-schet thead tr th:first-child,\n.table-schet tbody tr td:first-child {\n  padding: 10px 4px 10px 15px;\n  text-align: center;\n}\n.table-schet thead tr th+th+th {\n  width: 160px;\n  padding-left: 0px;\n  text-align: center;\n}\n.table-schet tbody tr td+td+td {\n  width: 160px;\n  padding-left: 0px;\n  text-align: left;\n}\n.table-schet tbody tr td+td+td+td,\n.table-schet thead tr th+th+th+th {\n  width: 120px;\n  padding-left: 0px;\n  text-align: center;\n}\n.table-schet thead tr th+th+th+th+th,\n.table-schet tbody tr td+td+td+td+td {\n  border-left: none;\n  max-width: 120px;\n  padding: 10px 4px 10px 15px;\n  word-wrap: break-word;\n  text-align: center;\n}\n.table-schet thead tr th+th+th+th+th+th,\n.table-schet tbody tr td+td+td+td+td+td {\n  width: 100px;\n  max-width: 100px;\n  padding: 10px 4px 10px 15px;\n  text-align: center;\n}\n.table-schet tbody tr td+td+td+td+td+td+td,\n.table-schet thead tr th+th+th+th+th+th+th {\n  width: 100px;\n  max-width: 110px;\n  text-align: right;\n}\n.table-schet tbody tr td+td+td+td+td+td+td {\n  font-size: 12px;\n}\n.table-schet-var1 thead tr th {\n  padding-top: 10px;\n  font-size: 12px;\n  text-transform: uppercase;\n  text-align: left;\n  padding-left: 20px;\n}\n.hide {display:none}\n</style>\n<div class=\"body-mini-vipiska corner\">\n<div class=\"head\">\n  <header style=\"display: flex; justify-content: flex-end; width: 100%;\">\n    <div style=\"text-align: left; padding: 20px; color: #767676;\">\n      <div>ОТКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО «СТАТУСБАНК»</div>\n      <div>Республика Беларусь, 220006, г. Минск, ул. Денисовская, 8А</div>\n      <div>Контакт-центр: +375(25,29,44) 712-00-00</div>\n      <div>Электронный адрес: info@stbank.by</div>\n    </div>\n  </header>\n  <p><strong>Выписка по счёту</strong></p>\n  <p>Клиент: Иванов Иван Иванович</p>\n  <p>Паспорт гражданина РБ № MP0000001 выдан 27.03.2018 УПОЛНОМОЧЕННЫМ ОРГАНОМ</p>\n  <p>Адрес регистрации: г. Минск, ул. Примерная, д.1 кв.1</p>\n  <p>Договор 300000001 от 02.10.2024</p>\n  <p>Счёт BY00IRJS30140000000A001PB200</p>\n  <p>Входящий остаток на 03.11.2026: 486,68 BYN</p>\n  <p>Исходящий остаток на 04.11.2026: 366,42 BYN</p>\n  <p>&nbsp;</p>\n  <p>За период с: <strong>03.11.2026</strong> по: <strong>04.11.2026</strong></p>\n  <p>Сформировано: 05.11.2026 11:43:46</p>\n  <p></p>\n  <p></p>\n</div>  <div class=\"head\">\n    <p>&nbsp;</p>\n    <!--p align=\"right\">Счёт: <strong>$ACCOUNT$</strong></p-->\n  </div>\n  <hr>\n  <p>&nbsp;</p>\n  <table class=\"table-schet\">\n    <thead>\n      <tr>\n        <th>Дата отражения операции по счёту</th>\n        <th>Дата совершения операции</th>\n        <th>Назначение платежа</th>\n        <th>Валюта счёта</th>\n        <th>Сумма операции в валюте счёта</th>\n        <th>Остаток по счёту</th>\n        \n      </tr>\n    </thead>\n    <tbody>\n      <tr><td>03.11.2026 00:00:00</td><td>03.11.2026 00:00:00</td><td>Возврат части потраченной суммы на оплату товара (работы, услуги) согласно реестру за 03.11.2026</td><!--td>Погашение процентов, Возврат</td><td></td--><td>BYN</td><td>13,75</td><td>500,43</td></tr><tr><td>03.11.2026 00:00:00</td><td>01.11.2026 00:00:00</td><td>Списание согласно реестру карт-чеков №8213 от 03.11.2026</td><!--td>Выдача кредита, Погашение основного долга</td><td></td--><td>BYN</td><td>-26,63</td><td>473,80</td></tr><tr><td>03.11.2026 00:00:00</td><td>01.11.2026 00:00:00</td><td>Списание согласно реестру карт-чеков №8213 от 03.11.2026</td><!--td>Выдача кредита, Погашение основного долга</td><td></td--><td>BYN</td><td>-70,00</td><td>403,80</td></tr><tr><td>03.11.2026 00:00:00</td><td>01.11.2026 00:00:00</td><td>Списание согласно реестру карт-чеков №8213 от 03.11.2026</td><!--td>Выдача кредита, Погашение основного долга</td><td></td--><td>BYN</td><td>-6,38</td><td>397,42</td></tr><tr><td>03.11.2026 00:00:00</td><td>02.11.2026 00:00:00</td><td>Списание согласно реестру карт-чеков №8213 от 03.11.2026</td><!--td>Выдача кредита, Погашение основного долга</td><td></td--><td>BYN</td><td>-20,00</td><td>377,42</td></tr><tr><td>04.11.2026 00:00:00</td><td>02.11.2026 00:00:00</td><td>Списание согласно реестру карт-чеков №8258 от 04.11.2026</td><!--td>Выдача кредита, Погашение основного долга</td><td></td--><td>BYN</td><td>-11,00</td><td>366,42</td></tr>\n    </tbody>\n  </table>\n  <table class=\"table-schet-var1\">\n    <thead>\n      <tr>\n        <th colspan=\"2\">Обороты за период</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>+  поступило:</td><td><b>13,75</b></td>\n      </tr>\n      <tr>\n        <td>–  списано:</td><td><b>134,01</b></td>\n      </tr>\n    </tbody>\n  </table>\n  <hr></div>"
  const account = { id: '300000001', instrument: 'BYN' }
  expect(parseAccountTransactionsHtml(html).map(raw => convertTransaction(raw, account))).toEqual([
    {
      date: new Date('2026-11-03T00:00:00'),
      hold: false,
      movements: [{ id: null, account: { id: '300000001' }, invoice: null, sum: 13.75, fee: 0 }],
      merchant: null,
      comment: 'Возврат части потраченной суммы на оплату товара (работы, услуги) согласно реестру за 03.11.2026'
    },
    {
      date: new Date('2026-11-01T00:00:00'),
      hold: false,
      movements: [{ id: null, account: { id: '300000001' }, invoice: null, sum: -26.63, fee: 0 }],
      merchant: null,
      comment: 'Списание согласно реестру карт-чеков №8213 от 03.11.2026'
    },
    {
      date: new Date('2026-11-01T00:00:00'),
      hold: false,
      movements: [{ id: null, account: { id: '300000001' }, invoice: null, sum: -70, fee: 0 }],
      merchant: null,
      comment: 'Списание согласно реестру карт-чеков №8213 от 03.11.2026'
    },
    {
      date: new Date('2026-11-01T00:00:00'),
      hold: false,
      movements: [{ id: null, account: { id: '300000001' }, invoice: null, sum: -6.38, fee: 0 }],
      merchant: null,
      comment: 'Списание согласно реестру карт-чеков №8213 от 03.11.2026'
    },
    {
      date: new Date('2026-11-02T00:00:00'),
      hold: false,
      movements: [{ id: null, account: { id: '300000001' }, invoice: null, sum: -20, fee: 0 }],
      merchant: null,
      comment: 'Списание согласно реестру карт-чеков №8213 от 03.11.2026'
    },
    {
      date: new Date('2026-11-02T00:00:00'),
      hold: false,
      movements: [{ id: null, account: { id: '300000001' }, invoice: null, sum: -11, fee: 0 }],
      merchant: null,
      comment: 'Списание согласно реестру карт-чеков №8258 от 04.11.2026'
    }
  ])
})
