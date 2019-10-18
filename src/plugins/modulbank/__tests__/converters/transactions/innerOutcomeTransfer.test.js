import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'b87d9c63-7918-4fe7-9216-aabc02fcb5c7',
        companyId: '5b3ee23f-071d-4da4-b31e-a7d10408df59',
        status: 'Executed',
        category: 'Credit',
        contragentName: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        contragentInn: '165117672519',
        contragentKpp: '',
        contragentBankAccountNumber: '40802810470210002392',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankBic: '044525092',
        currency: 'RUR',
        amount: 49.12,
        bankAccountNumber: '40802810470014241168',
        paymentPurpose: 'Перевод между счетами. Без НДС',
        executed: '2019-09-02T00:00:00',
        created: '2019-09-02T13:55:16.017',
        docNumber: '568307',
        absId: '24933438241',
        ibsoId: '24933455895',
        kbk: '',
        oktmo: '',
        paymentBasis: '',
        taxCode: '',
        taxDocNum: '',
        taxDocDate: '',
        payerStatus: '',
        uin: ''
      },
      {
        hold: false,
        date: new Date('2019-09-02T00:00:00+03:00'),
        movements: [
          {
            id: 'b87d9c63-7918-4fe7-9216-aabc02fcb5c7',
            account: { id: 'account' },
            invoice: null,
            sum: -49.12,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '568307'
        ]
      }
    ],
    [
      {
        id: 'b2352eb2-5099-40e2-a9d7-aa5e026f4da2',
        companyId: '88ad2195-b18b-4c1d-a444-a77c02853a2e',
        status: 'Executed',
        category: 'Credit',
        contragentName: 'Индивидуальный предприниматель Пугачев Сергей Викторович',
        contragentInn: '550700300630',
        contragentKpp: '',
        contragentBankAccountNumber: '42109810770010037764',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankBic: '044525092',
        currency: 'RUR',
        amount: 150000,
        bankAccountNumber: '40802810870010028545',
        paymentPurpose: 'Взнос во вклад ДЮ0070000000076741 Индивидуальный предприниматель Николаев Николай Николаевич ',
        executed: '2019-05-31T00:00:00',
        created: '2019-05-31T00:00:00',
        docNumber: '4035',
        absId: '21716922908',
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
        date: new Date('2019-05-31T00:00:00+03:00'),
        movements: [
          {
            id: 'b2352eb2-5099-40e2-a9d7-aa5e026f4da2',
            account: { id: 'account' },
            invoice: null,
            sum: -150000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '4035'
        ]
      }
    ]
  ])('converts inner outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
