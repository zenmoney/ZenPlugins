import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        cardId: 'f954ebce-f20f-478b-a033-aa8f02ec6690',
        id: 'd353b808-0d37-4f08-a10f-33c6e173441f',
        companyId: '5b3ee23f-071d-4da4-b31e-a7d10408df59',
        status: 'Executed',
        category: 'Credit',
        contragentName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentInn: '2204000595',
        contragentKpp: '771543001',
        contragentBankAccountNumber: '30232810670000000146',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankBic: '044525092',
        currency: 'RUR',
        amount: 1000,
        bankAccountNumber: '40802810470014241168',
        paymentPurpose: 'Получение наличных в банкоматах сторонних банков. 00000790 643 KAZAN',
        executed: '2019-09-01T00:00:00',
        created: '2019-09-01T00:00:00',
        docNumber: '907030',
        absId: '24895758386',
        ibsoId: '24895758436',
        kbk: '',
        oktmo: '',
        paymentBasis: '',
        taxCode: '',
        taxDocNum: '',
        taxDocDate: '',
        payerStatus: '',
        uin: '0'
      },
      {
        hold: false,
        date: new Date('2019-09-01T00:00:00+03:00'),
        movements: [
          {
            id: 'd353b808-0d37-4f08-a10f-33c6e173441f',
            account: { id: 'account' },
            invoice: null,
            sum: -1000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 1000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
