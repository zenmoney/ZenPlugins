import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        contragentBik: 'CASPKZKA',
        contragentBin: '200840000951',
        contragentIban: 'KZ86722S000004987101',
        contragentName: 'ТОО Kaspi Pay',
        isCredit: false,
        knp: '851',
        purpose: 'Оплата за информационно-технологические услуги. Без НДС за 14/11/2022',
        showContragentBin: true,
        showContragentDetails: true,
        status: 'OK',
        tranAmount: '- 253,37 ₸',
        tranDate: '14.11.22 23:59:59',
        tranId: '99410165343',
        tranNumber: '958635794',
        tranSign: 'D',
        tranType: 'Платежное поручение'
      },
      {
        comment: 'Оплата за информационно-технологические услуги. Без НДС за 14/11/2022',
        date: new Date('2022-11-14T17:59:59.000Z'),
        hold: false,
        merchant: {
          category: 851,
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'ТОО Kaspi Pay'
        },
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '99410165343',
            invoice: null,
            sum: -253.37
          }
        ]
      }
    ],
    [
      {
        contragentBik: '',
        contragentBin: '971240001315',
        contragentIban: 'KZ98722S000009969581',
        contragentName: 'АО "KASPI BANK"',
        isCredit: true,
        knp: '190',
        purpose: 'Продажи с Kaspi.kz за 14/11/2022',
        showContragentBin: true,
        showContragentDetails: true,
        status: 'OK',
        tranAmount: '+ 26 670 ₸',
        tranDate: '14.11.22 23:59:59',
        tranId: '99410164607',
        tranNumber: '958635769',
        tranSign: 'C',
        tranType: 'Платежный ордер'
      },
      {
        comment: 'Продажи с Kaspi.kz за 14/11/2022',
        date: new Date('2022-11-14T17:59:59.000Z'),
        hold: false,
        merchant: {
          category: 190,
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'АО "KASPI BANK"'
        },
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '99410164607',
            invoice: null,
            sum: 26670
          }
        ]
      }
    ],
    [
      {
        contragentBik: 'IRTYKZKA',
        contragentBin: '890622301965',
        contragentIban: 'KZ3696503F0009544240',
        contragentName: 'Иванов Иван Иванович',
        isCredit: false,
        knp: '343',
        purpose: 'Перевод собственных средств на свой счет в другом Банке.',
        showContragentBin: true,
        showContragentDetails: true,
        status: 'OK',
        tranAmount: '- 700 000 ₸',
        tranDate: '10.11.22 11:34:52',
        tranId: '98910253446',
        tranNumber: '15',
        tranSign: 'D',
        tranType: 'Платежное поручение'
      },
      {
        comment: 'Перевод собственных средств на свой счет в другом Банке.',
        date: new Date('2022-11-10T05:34:52.000Z'),
        hold: false,
        merchant: {
          category: 343,
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Иванов Иван Иванович'
        },
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '98910253446',
            invoice: null,
            sum: -700000
          }
        ]
      }
    ]
  ])('converts transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, {
      id: 'account',
      instrument: 'KZT'
    })).toEqual(transaction)
  })
})
