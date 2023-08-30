import { convertTransactions } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'USD'
  }
  const accountsByNumber = {
    KZ94948USD00607001ZA: {
      id: 'account',
      instrument: 'USD'
    },
    KZ88948KZT00607005VS: {
      id: '07005VS',
      instrument: 'KZT'
    }
  }
  it.each([
    [
      [
        {
          id: 'MOVEMENT_8835065432',
          type: 'MOVEMENT',
          executionDate: 1583994900000,
          status: 'DONE',
          transactionDate: 1583994900000,
          dateCreated: 1583994900000,
          amount: 2493.77,
          amountCurrency: 'USD',
          fee: 0,
          feeCurrency: 'USD',
          accountSource: 'KZ94948USD00607001ZA',
          totalAmount: 2493.77,
          totalAmountCurrency: 'USD',
          purpose: 'КНП_213 SM.BANK ПЕР. СО СЧЕТА KZ88948KZT00607005VS НА СЧЕТ KZ94948USD00607001ZA С КОНВ. (ПОКУПКА) <<1000001.77 KZT / 401.00(КУРС ПРОД. БАНКА KZT->USD) = 2493.77 USD>> (SB зачисл. c конв.)'
        }
      ],
      [
        {
          hold: false,
          date: new Date(1583994900000),
          movements: [
            {
              id: 'MOVEMENT_8835065432',
              account: { id: 'account' },
              invoice: null,
              sum: 2493.77,
              fee: 0
            }
          ],
          groupKeys: [null, 'KZ88948KZT00607005VS_KZ94948USD00607001ZA_15839_2493.77', '15839949_2493.77'],
          merchant: null,
          comment: 'ПЕР. СО СЧЕТА KZ88948KZT00607005VS НА СЧЕТ KZ94948USD00607001ZA С КОНВ. (ПОКУПКА) <<1000001.77 KZT / 401.00(КУРС ПРОД. БАНКА KZT->USD) = 2493.77 USD>> (SB зачисл. c конв.)'
        }
      ]
    ]
  ])('converts inner transfer', (apiTransaction, transaction) => {
    expect(convertTransactions(apiTransaction, account, accountsByNumber)).toEqual(transaction)
  })
})
