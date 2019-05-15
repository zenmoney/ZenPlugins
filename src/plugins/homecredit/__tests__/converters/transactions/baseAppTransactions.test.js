import { convertTransaction } from '../../../converters'

const debetCardData = {
  account: {
    balance: 36050,
    id: '7005001234',
    instrument: 'RUR',
    syncID: '1234',
    title: 'Visa Classic – зарплатный сотрудникам',
    type: 'ccard' },
  details: {
    accountNumber: '40817810690010001234',
    cardNumber: '4454334500181234',
    contractNumber: '7005001234',
    title: 'Visa Classic – зарплатный сотрудникам',
    type: 'debitCards'
  }
}
const transactions = [
  [
    {
      address: null,
      amount: 1050,
      city: null,
      country: null,
      creditDebitIndicator: true,
      description: 'Поступление денежных средств на счет ',
      destinationProductType: null,
      hashtagList: null,
      installment: null,
      javaClass: 'cz.bsc.g6.components.product.json.services.api.mo.ProductAccountMovementMo',
      mcc: null,
      merchant: 'Банк Хоум Кредит',
      merchantName: 'ИВАНОВ ИВАН ИВАНОВИЧ',
      movementNumber: '1732073919',
      operationName: 'Поступивший перевод',
      partnerAccountName: null,
      partnerAccountNumber: '40817810690010001234',
      partnercardnumber: null,
      payAmount: null,
      payCurrency: 'RUR',
      paymentType: 2,
      picUrl: 'https://ib.homecredit.ru/hcfbib.server.portal.app-theme-main/pictures/products/beautiful-transactions/inbank.png',
      postingDate:
        {
          time: 1555275600000,
          javaClass: 'java.util.Date'
        },
      productName: null,
      referenceid: '4.29.01.01_260281678',
      senderaccount: '40817810590010001234',
      senderbic: '044525245',
      sendername: 'Иванов Иван Иванович',
      shortDescription: 'Поступление денежных средств на счет ',
      templateId: null,
      toacct: null,
      toacct2: null,
      tokenPayment: 0,
      transactionTypeIBS: 5,
      valueDate:
        {
          time: 1555349210000,
          javaClass: 'java.util.Date'
        }
    },
    {
      'comment': 'Поступление денежных средств на счет ',
      'date': new Date('2019-04-15T17:26:50.000Z'),
      'hold': false,
      'id': '1732073919',
      'income': 1050,
      'incomeAccount': '7005001234',
      'outcome': 0,
      'outcomeAccount': '7005001234',
      'payee': 'ИВАНОВ ИВАН ИВАНОВИЧ'
    }
  ],
  [
    {
      address: null,
      amount: 20000,
      city: null,
      country: null,
      creditDebitIndicator: false,
      description: 'Перечисление платежей по поручениям  ',
      destinationProductType: 1,
      hashtagList: null,
      installment: null,
      javaClass: 'cz.bsc.g6.components.product.json.services.api.mo.ProductAccountMovementMo',
      mcc: null,
      merchant: 'Банк Хоум Кредит',
      merchantName: null,
      movementNumber: '1731975603',
      operationName: 'Перевод на карту',
      partnerAccountName: 'ПЕТРОВ ПЕТР ПЕТРОВИЧ',
      partnerAccountNumber: '40817810690640081234',
      partnercardnumber: null,
      payAmount: null,
      payCurrency: 'RUR',
      paymentType: 1,
      picUrl: 'https://ib.homecredit.ru/hcfbib.server.portal.app-theme-main/pictures/products/beautiful-transactions/debit-card.png',
      postingDate: { time: 1555275600000, javaClass: 'java.util.Date' },
      productName: null,
      referenceid: null,
      senderaccount: null,
      senderbic: null,
      sendername: null,
      shortDescription: 'Перечисление платежей по поручениям  ',
      templateId: null,
      toacct: null,
      toacct2: null,
      tokenPayment: 0,
      transactionTypeIBS: 6,
      valueDate: { time: 1555329507000, javaClass: 'java.util.Date' }
    },
    {
      'date': new Date('2019-04-15T11:58:27.000Z'),
      'hold': false,
      'id': '1731975603',
      'income': 0,
      'incomeAccount': '7005001234',
      'outcome': 20000,
      'outcomeAccount': '7005001234',
      'payee': 'Банк Хоум Кредит'
    }
  ],
  [
    {
      address: null,
      amount: 55000,
      city: null,
      country: null,
      creditDebitIndicator: true,
      description: 'Пополнение счета ',
      destinationProductType: null,
      hashtagList: null,
      installment: null,
      javaClass: 'cz.bsc.g6.components.product.json.services.api.mo.ProductAccountMovementMo',
      mcc: null,
      merchant: 'Банк Хоум Кредит',
      merchantName: 'Банк Хоум Кредит',
      movementNumber: '1731862301',
      operationName: 'Пополнение счета',
      partnerAccountName: null,
      partnerAccountNumber: null,
      partnercardnumber: null,
      payAmount: null,
      payCurrency: 'RUR',
      paymentType: null,
      picUrl: 'https://ib.homecredit.ru/hcfbib.server.portal.app-theme-main/pictures/plus_40.png',
      postingDate: { time: 1555275600000, javaClass: 'java.util.Date' },
      productName: null,
      referenceid: null,
      senderaccount: null,
      senderbic: null,
      sendername: null,
      shortDescription: 'Пополнение счета ',
      templateId: null,
      toacct: null,
      toacct2: null,
      tokenPayment: 0,
      transactionTypeIBS: 0,
      valueDate: { time: 1555312995000, javaClass: 'java.util.Date' }
    },
    {
      'comment': 'Пополнение счета ',
      'date': new Date('2019-04-15T07:23:15.000Z'),
      'hold': false,
      'id': '1731862301',
      'income': 55000,
      'incomeAccount': '7005001234',
      'outcome': 0,
      'outcomeAccount': '7005001234',
      'payee': 'Банк Хоум Кредит'
    }
  ]
]

describe('[BaseApp] convertTransaction', () => {
  for (let i = 0; i < transactions.length; i++) {
    it('should convert transaction #' + i, () => {
      expect(
        convertTransaction(debetCardData, transactions[i][0])
      ).toEqual(
        transactions[i][1]
      )
    })
  }
})
