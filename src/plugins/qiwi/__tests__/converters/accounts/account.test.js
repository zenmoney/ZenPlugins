import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('returns valid accoutns', () => {
    expect(convertAccounts([
      {
        alias: 'qw_wallet_rub',
        balance: { amount: 100, currency: 643 },
        bankAlias: 'QIWI',
        currency: 643,
        defaultAccount: true,
        fsAlias: 'qb_wallet',
        hasBalance: true,
        title: 'WALLET',
        type: { id: 'WALLET', title: 'Visa QIWI Wallet' }
      },
      {

        alias: 'mc_mts_rub',
        balance: null,
        bankAlias: 'QIWI',
        currency: 643,
        defaultAccount: false,
        fsAlias: 'qb_mc_mts',
        hasBalance: false,
        title: 'MC',
        type: { id: 'MC', title: 'Mobile Wallet' }
      },
      {
        alias: 'qw_wallet_eur',
        balance: { amount: 2.98, currency: 978 },
        bankAlias: 'QIWI',
        currency: 978,
        defaultAccount: false,
        fsAlias: 'qb_wallet',
        hasBalance: true,
        title: 'WALLET',
        type: { id: 'WALLET', title: 'Visa QIWI Wallet' }
      }
    ], '79881234567')).toEqual([
      {
        id: '79881234567_643',
        type: 'checking',
        title: 'QIWI (RUB)',
        instrument: 'RUB',
        syncID: ['4567'],
        balance: 100
      },
      {
        id: '79881234567_978',
        type: 'checking',
        title: 'QIWI (EUR)',
        instrument: 'EUR',
        syncID: ['4567'],
        balance: 2.98
      }
    ])
  })
})
