import { convertTarget } from '../../../converters'

describe('convertTarget', () => {
  it('returns valid target accounts', () => {
    expect(convertTarget({
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
    }, {
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
    })).toEqual({
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
    })
  })
})
