import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('converts account', () => {
    expect(convertAccount({
      account: '41001141885312',
      balance: 2522.08,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 2522.08, available: 2522.08 }
    })).toEqual({
      id: '41001141885312',
      type: 'checking',
      title: 'Яндекс.Деньги (RUB)',
      instrument: 'RUB',
      syncID: [
        '5312'
      ],
      balance: 2522.08
    })
  })
  it('converts account with holds', () => {
    expect(convertAccount({
      account: '41001141885312',
      balance: 769.02,
      currency: '643',
      account_type: 'personal',
      identified: true,
      account_status: 'identified',
      balance_details: { total: 769.02, available: 769.02, hold: 3500 }
    })).toEqual({
      id: '41001141885312',
      type: 'checking',
      title: 'Яндекс.Деньги (RUB)',
      instrument: 'RUB',
      syncID: [
        '5312'
      ],
      balance: 4269.02
    })
  })
})
