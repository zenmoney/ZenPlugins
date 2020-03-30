import { convertTarget } from '../../../converters'

describe('convertTarget', () => {
  it.each([
    [
      {
        type: 'RESERVE',
        id: '500603794',
        name: 'Финансовый резерв',
        comment: 'Подушка',
        date: '16.04.2018',
        amount: { amount: '500000.00', currency: { code: 'RUB', name: 'руб.' } },
        status: 'accountEnabled',
        account: {
          id: '560357253',
          rate: '1.00',
          value: { amount: '700.29', currency: { code: 'RUB', name: 'руб.' } },
          availcash: { amount: '700,29', currency: { code: 'RUB', name: 'руб.' } },
          arrested: 'false',
          showarrestdetail: 'false'
        },
        statusDescription: 'Информация о вкладе недоступна. Возможны две причины: задержка получения данных или вклад Вами был закрыт.'
      },
      {
        description: 'Сберегательный счет',
        open: '16.04.2017T00:00:00',
        close: '01.01.2099T00:00:00',
        interestRate: '1.00',
        maxSumWrite: { amount: '700,29', currency: { code: 'RUB', name: 'руб.' } },
        passbook: 'false',
        crossAgency: 'true',
        prolongation: 'false',
        irreducibleAmt: { amount: '0,00', currency: { code: 'RUB', name: 'руб.' } },
        name: 'Сберегательный счет',
        target: {
          name: 'Финансовый резерв',
          comment: 'Подушка',
          date: '16.04.2018',
          amount: { amount: '500000.00', currency: { code: 'RUB', name: 'руб.' } }
        },
        canChangePercentDestination: 'false',
        moneyBoxAvailable: 'true',
        moneyBoxes: { box: { id: '27543068356', sumType: 'FIXED_SUMMA', amount: '700,00' } }
      },
      {
        products: [
          {
            id: '560357253',
            type: 'account',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'account:560357253',
          type: 'checking',
          title: 'Подушка',
          instrument: 'RUB',
          balance: 700.29,
          savings: true,
          syncID: [
            '500603794'
          ]
        }
      }
    ],
    [
      {
        type: 'VACATION',
        id: '123456',
        name: 'Отдых',
        date: '31.01.2020',
        amount: { amount: '40000.00', currency: { code: 'RUB', name: 'руб.' } },
        status: 'accountEnabled',
        account:
          {
            id: '2266',
            rate: '1.00',
            value: { amount: '0.56', currency: { code: 'RUB', name: 'руб.' } },
            availcash: { amount: '0.56', currency: { code: 'RUB', name: 'руб.' } },
            arrested: 'false',
            showarrestdetail: 'true',
            openDate: '07.08.2018'
          },
        statusDescription: 'Информация о вкладе недоступна. Возможны две причины: задержка получения данных или вклад Вами был закрыт.'
      },
      null,
      {
        products: [
          {
            id: '2266',
            type: 'account',
            instrument: 'RUB'
          }
        ],
        zenAccount: {
          id: 'account:2266',
          type: 'checking',
          title: 'Отдых',
          instrument: 'RUB',
          balance: 0.56,
          savings: true,
          syncID: [
            '123456'
          ]
        }
      }
    ]
  ])('returns valid target accounts', (apiAccount, apiDetails, account) => {
    expect(convertTarget(apiAccount, apiDetails)).toEqual(account)
  })
})
