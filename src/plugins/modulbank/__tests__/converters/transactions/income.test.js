import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '724fb8c2-2c35-4a82-a983-e48c9847f692',
        companyId: '750f0748-fd02-4b98-ac59-30b87d3f591a',
        status: 'Received',
        category: 'Debet',
        contragentInn: '2204000595',
        contragentKpp: '771543001',
        contragentName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankAccountNumber: '70606810670013121284',
        contragentBankBic: '044525092',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        currency: 'RUR',
        amount: 9.65,
        bankAccountNumber: '408029745770013357312',
        paymentPurpose: '{VO80150} Уплачены проценты за Июль     2018 г  Индивидуальный предприниматель Николаев Николай Николаевич',
        executed: '2018-07-31T00:00:00',
        created: '2018-01-01T16:49:56.145',
        docNumber: '430612',
        absId: '10368387323',
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
        date: new Date('2018-07-31T00:00:00+03:00'),
        movements: [
          {
            id: '724fb8c2-2c35-4a82-a983-e48c9847f692',
            account: { id: 'account' },
            invoice: null,
            sum: 9.65,
            fee: 0
          }
        ],
        merchant: null,
        comment: '{VO80150} Уплачены проценты за Июль     2018 г  Индивидуальный предприниматель Николаев Николай Николаевич'
      }
    ],
    [
      {
        id: '6049427f-461a-4f1e-a3ab-aa5e000d8833',
        companyId: '88ad2195-b18b-4c1d-a444-a77c02853a2e',
        status: 'Received',
        category: 'Debet',
        contragentName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentInn: '2204000595',
        contragentKpp: '771543001',
        contragentBankAccountNumber: '47426810470010083013',
        contragentBankName: 'МОСКОВСКИЙ ФИЛИАЛ АО КБ "МОДУЛЬБАНК"',
        contragentBankBic: '044525092',
        currency: 'RUR',
        amount: 1068.49,
        bankAccountNumber: '40802810870010028545',
        paymentPurpose: 'Выплата процентов по вкладу ДЮ0070000000072515 Индивидуальный предприниматель Николаев Николай Николаевич ',
        executed: '2019-05-31T00:00:00',
        created: '2019-05-31T00:00:00',
        docNumber: '777889',
        absId: '21698816455',
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
            id: '6049427f-461a-4f1e-a3ab-aa5e000d8833',
            account: { id: 'account' },
            invoice: null,
            sum: 1068.49,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Выплата процентов по вкладу ДЮ0070000000072515 Индивидуальный предприниматель Николаев Николай Николаевич '
      }
    ],
    [
      {
        id: '282015b4-8e48-4608-80fd-aa4f02d5cb72',
        companyId: '2ab62271-88e4-4d9c-88e1-a71d02a3847b',
        status: 'Received',
        category: 'Debet',
        contragentName: 'ООО "АВС Рус"',
        contragentInn: '5032265778',
        contragentKpp: '503201001',
        contragentBankAccountNumber: '40702810702051004214',
        contragentBankName: 'ПАО "БАНК УРАЛСИБ"',
        contragentBankBic: '044525787',
        currency: 'RUR',
        amount: 12000,
        bankAccountNumber: '40802810470010020260',
        paymentPurpose: 'Оплата по счету № 130 от 14.05.2019 за услуги  НДС не облагается',
        executed: '2019-05-16T00:00:00',
        created: '2019-05-16T00:00:00',
        docNumber: '669',
        absId: '21203209297',
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
        date: new Date('2019-05-16T00:00:00+03:00'),
        movements: [
          {
            id: '282015b4-8e48-4608-80fd-aa4f02d5cb72',
            account: { id: 'account' },
            invoice: null,
            sum: 12000,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: null,
          title: 'ООО "АВС Рус"',
          mcc: null,
          location: null
        },
        comment: 'Оплата по счету № 130 от 14.05.2019 за услуги  НДС не облагается'
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
