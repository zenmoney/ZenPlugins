import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        paymentId: '4409131777',
        iconUrl: 'https://alfabank.ua/upload/sense_ico/outcome.svg',
        iconBg: '#FFFFFF',
        createDate: '2021-10-25',
        executionTime: '2021-10-25T13:12:16',
        paymentName: 'ІВАНОВИЧ І.В.',
        paymentPurpose: 'Перерахування чистого підприємницького доходу, без ПДВ',
        amount: -916500,
        amountNational: -916500,
        currency: 'UAH',
        type: 'out',
        state: 'Executed'
      },
      {
        comment: 'Перерахування чистого підприємницького доходу, без ПДВ',
        date: new Date('2021-10-25T13:12:16+03:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'ІВАНОВИЧ І.В.'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '4409131777',
            invoice: null,
            sum: -9165
          }
        ]
      }
    ],
    [
      {
        paymentId: '4409015800',
        iconUrl: 'https://alfabank.ua/upload/sense_ico/income.svg',
        iconBg: '#FFFFFF',
        createDate: '2021-10-25',
        executionTime: '2021-10-25T11:25:40',
        paymentName: 'АТ "АЛЬФА-БАНК"',
        paymentPurpose: 'Зарахування коштiв вiд вільного продажу 300 EUR по курсу 30.55, (зг. заявки SENSE1256779 вiд 25.10.2021). Комiсiя банку становить 0 грн.',
        amount: 916500,
        amountNational: 916500,
        currency: 'UAH',
        type: 'in',
        state: 'Executed'
      },
      {
        comment: 'Зарахування коштiв вiд вільного продажу 300 EUR по курсу 30.55, (зг. заявки SENSE1256779 вiд 25.10.2021). Комiсiя банку становить 0 грн.',
        date: new Date('2021-10-25T11:25:40+03:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'АТ "АЛЬФА-БАНК"'
        },
        movements: [
          {
            account: {
              id: '1337'
            },
            fee: 0,
            id: '4409015800',
            invoice: null,
            sum: 9165
          }
        ]
      }
    ]
  ])('converts sme transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '1337' })).toEqual(transaction)
  })
})
