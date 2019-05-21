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
      postingDate: 1557781200000,
      valueDate: 1557818725000,
      amount: 3500,
      payCurrency: 'RUR',
      description: 'Зачисление на счет (перевод) HCFB,Moskva,Pravdi,8,G MOSKVA,RU',
      creditDebitIndicator: true,
      mcc: null,
      merchant: 'Банк Хоум Кредит',
      shortDescription: 'Зачисление на счет (перевод) HCFB',
      hashtagList: [],
      movementNumber: '1757185120',
      transactionTypeIBS: 7,
      paymentType: null,
      destinationProductType: null,
      productName: null,
      operationName: 'P2P перевод',
      address: null,
      country: null,
      city: null,
      merchantName: 'HCFB',
      partnercardnumber: null,
      partnerAccountNumber: null,
      partnerAccountName: null,
      sendername: null,
      senderaccount: null,
      senderbic: null,
      referenceid: 'b206d82d-b771-4eb1-b7c0-ec47b8e7e99d',
      toacct: null,
      toacct2: null,
      templateId: null,
      picUrl: 'https://ib.homecredit.ru/hcfbib.server.portal.app-theme-main/pictures/products/beautiful-transactions/p2p.png',
      payAmount: null,
      installmentInfo: null
    },
    {
      'id': '1757185120',
      'hold': false,
      'date': new Date('2019-05-14T10:25:25+03:00'),
      'payee': 'HCFB',
      'income': 3500,
      'incomeAccount': '7005001234',
      'outcome': 0,
      'outcomeAccount': '7005001234',
      'comment': 'Зачисление на счет (перевод) HCFB'
    }
  ]
]

describe('[MyCredit] convertTransaction', () => {
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
