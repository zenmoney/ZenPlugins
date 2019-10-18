import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 'd2574522-df05-4a5d-a88a-aabc02fd4291',
        companyId: '5b3ee23f-071d-4da4-b31e-a7d10408df59',
        status: 'Received',
        category: 'Debet',
        contragentName: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        contragentInn: '165117672519',
        contragentKpp: '',
        contragentBankAccountNumber: '40802810470014241168',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankBic: '044525092',
        currency: 'RUR',
        amount: 49.12,
        bankAccountNumber: '40802810470210002392',
        paymentPurpose: 'Перевод между счетами. Без НДС',
        executed: '2019-09-02T00:00:00',
        created: '2019-09-02T00:00:00',
        docNumber: '568307',
        absId: '24933438241',
        ibsoId: '24933455903',
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
        date: new Date('2019-09-02T00:00:00+03:00'),
        movements: [
          {
            id: 'd2574522-df05-4a5d-a88a-aabc02fd4291',
            account: { id: 'account' },
            invoice: null,
            sum: 49.12,
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
        id: 'a8ecbb6d-b329-4118-8a3f-aa5e000dc2e7',
        companyId: '88ad2195-b18b-4c1d-a444-a77c02853a2e',
        status: 'Received',
        category: 'Debet',
        contragentName: 'Индивидуальный предприниматель Николаев Николай Николаевич',
        contragentInn: '550700300630',
        contragentKpp: '',
        contragentBankAccountNumber: '42109810770010035410',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankBic: '044525092',
        currency: 'RUR',
        amount: 200000,
        bankAccountNumber: '40802810870010028545',
        paymentPurpose: 'Возврат депозита. Договор № ДЮ0070000000072515 от 01.05.2019г.  ',
        executed: '2019-05-31T00:00:00',
        created: '2019-05-31T00:00:00',
        docNumber: '2959',
        absId: '21698816648',
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
            id: 'a8ecbb6d-b329-4118-8a3f-aa5e000dc2e7',
            account: { id: 'account' },
            invoice: null,
            sum: 200000,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '2959'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
