import { toZenmoneyAccount } from '../../../converters'

describe('toZenmoneyAccount', () => {
  it.each([
    [
      {
        'number': '98765432109876543210',
        'description': 'Счёт кредитной карты',
        'amount': '15 294.21',
        'currencyCode': 'RUR',
        'creditInfo': {
          'description': 'Кредитная карта',
          'amountDebt': '1 705.79',
          'installmentCard': false,
          'nextPaymentAmount': '',
          'nextPaymentDate': ''
        },
        'accountDetailsCreditInfo': {
          'Доступный лимит': '15 294.21 RUR',
          'Установленный лимит': '17 000.00 RUR'
        }
      },
      {
        'type': 'ccard',
        'title': 'Счёт кредитной карты',
        'id': '98765432109876543210',
        'syncID': [
          '98765432109876543210'
        ],
        'instrument': 'RUR',
        'available': 15294.21,
        'creditLimit': 17000
      }
    ],
    [
      {
        number: '40817810408410021794',
        description: 'Счёт кредитной карты',
        amount: '473.51',
        currencyCode: 'RUR',
        creditInfo: {
          description: 'Кредитная карта',
          amountDebt: '48 967.27',
          installmentCard: false,
          nextPaymentAmount: '2 100.00',
          nextPaymentDate: '26.02.2020',
          tariffIsEnabled: true
        },
        accountDetailsCreditInfo: {
          'Номер счета': '40817810408410021794',
          'Кредитный продукт и валюта': 'Кредитная карта - RUR',
          'Доступный лимит': '473.51 RUR',
          'Общая задолженность': '48 967.27 RUR',
          'Сумма к оплате': '2 100.00 RUR',
          'Минимальный платеж': '2 100.00 RUR',
          'Оплатить до': '26.02.2020',
          'Штрафы': '0.00 RUR',
          'Просроченная задолженность': '0.00 RUR',
          'Несанкционированный перерасход': '0.00 RUR',
          'Установленный лимит': '48 500.00 RUR',
          'Сумма собственных средств': '0.00 RUR',
          'Сумма начисленных процентов': '940.78 RUR',
          'Неподтвержденные операции': '0.00 RUR',
          'Дата окончания льготного периода': '11.01.2017'
        }
      },
      {
        id: '40817810408410021794',
        type: 'ccard',
        title: 'Счёт кредитной карты',
        instrument: 'RUR',
        syncID: [
          '40817810408410021794'
        ],
        available: 473.51,
        creditLimit: 48500,
        totalAmountDue: 48967.27,
        gracePeriodEndDate: new Date(`2017-01-11T00:00:00+03:00`)
      }
    ],
    [
      {
        number: '40817810808270078924',
        description: 'Счёт кредитной карты',
        amount: '112 145.29',
        currencyCode: 'RUR',
        creditInfo: {
          description: 'Кредитная карта',
          amountDebt: '33 854.71',
          installmentCard: false,
          nextPaymentAmount: '0.00',
          nextPaymentDate: '',
          tariffIsEnabled: true
        },
        accountDetailsCreditInfo: {
          'Номер счета': '40817810808270078924',
          'Кредитный продукт и валюта': 'Кредитная карта - RUR',
          'Доступный лимит': '112 145.29 RUR',
          'Общая задолженность': '33 854.71 RUR',
          'Сумма к оплате': '0.00 RUR',
          'Минимальный платеж': '0.00 RUR',
          'Оплатить до': '',
          'Штрафы': '0.00 RUR',
          'Просроченная задолженность': '0.00 RUR',
          'Несанкционированный перерасход': '0.00 RUR',
          'Установленный лимит': '146 000.00 RUR',
          'Сумма собственных средств': '0.00 RUR',
          'Сумма начисленных процентов': '0.00 RUR',
          'Неподтвержденные операции': '10 145.26 RUR',
          'Дата окончания льготного периода': '13.04.2020'
        }
      },
      {
        id: '40817810808270078924',
        type: 'ccard',
        title: 'Счёт кредитной карты',
        instrument: 'RUR',
        syncID: [
          '40817810808270078924'
        ],
        available: 112145.29,
        creditLimit: 146000,
        totalAmountDue: 33854.71,
        gracePeriodEndDate: new Date('2020-04-13T00:00:00+03:00')
      }
    ]
  ])('converts credit card', (apiAccount, account) => {
    expect(toZenmoneyAccount(apiAccount)).toEqual(account)
  })
})
