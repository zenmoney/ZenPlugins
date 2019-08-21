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
  // зачисление на счёт (card2card)
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
  ],

  // снятие наличных
  [
    {
      ostingDate: null,
      valueDate: 1558357796000,
      amount: 10000,
      payCurrency: null,
      description: 'Снятие денежных средств, OKI BINBANK, 000000000143222',
      creditDebitIndicator: false,
      mcc: 'ATM CASH WITHDRAWAL',
      merchant: ' 000000000143222',
      shortDescription: 'Снятие денежных средств',
      hashtagList: [ ],
      movementNumber: '943168929',
      transactionTypeIBS: 2,
      paymentType: null,
      destinationProductType: null,
      productName: null,
      operationName: 'Снятие наличных в Банкомате',
      address: 'OKI BINBANK',
      country: 'РОССИЯ',
      city: 'EKATERINBURG',
      merchantName: '000000000143222',
      partnercardnumber: null,
      partnerAccountNumber: null,
      partnerAccountName: null,
      sendername: null,
      senderaccount: null,
      senderbic: null,
      referenceid: null,
      toacct: null,
      toacct2: null,
      templateId: null,
      picUrl: 'https://ib.homecredit.ru/hcfbib.server.portal.app/pics/577450.jpg',
      payAmount: 10000,
      installmentInfo: null
    },
    {
      'date': new Date('2019-05-20T16:09:56+03:00'),
      'hold': false,
      'id': '943168929',
      'income': 10000,
      'incomeAccount': 'cash',
      'outcome': 10000,
      'outcomeAccount': '7005001234',
      'payee': '000000000143222'
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

xdescribe('[MyCredit] convertOneTransaction', () => {
  const i = 1
  it('should convert transaction #' + i, () => {
    expect(
      convertTransaction(debetCardData, transactions[i][0])
    ).toEqual(
      transactions[i][1]
    )
  })
})
