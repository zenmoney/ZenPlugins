import { convertCard, convertTransactions, convertWallets, isOpenCard } from '../converters'
import { Account, AccountType } from '../../../types/zenmoney'

describe('Q-Pay account conversion', () => {
  it('keeps each opened network and asset as a separate wallet account', () => {
    expect(convertWallets([
      {
        address: '0x-example',
        network: 'evm:1',
        balances: [
          { asset: 'USDT', value: '12.34' },
          { asset: 'USDC', value: '0' }
        ]
      },
      {
        address: 'T-example',
        network: 'tron:mainnet',
        balances: [{ asset: 'USDT', value: 5 }]
      }
    ])).toEqual([
      {
        id: 'q-pay:wallet:evm:1:0x-example:USDT',
        type: 'checking',
        title: 'Q-Pay USDT · Ethereum',
        instrument: 'USD',
        balance: 12.34,
        syncIds: ['q-pay:wallet:evm:1:0x-example:USDT'],
        savings: false
      },
      {
        id: 'q-pay:wallet:evm:1:0x-example:USDC',
        type: 'checking',
        title: 'Q-Pay USDC · Ethereum',
        instrument: 'USD',
        balance: 0,
        syncIds: ['q-pay:wallet:evm:1:0x-example:USDC'],
        savings: false
      },
      {
        id: 'q-pay:wallet:tron:mainnet:T-example:USDT',
        type: 'checking',
        title: 'Q-Pay USDT · TRON',
        instrument: 'USD',
        balance: 5,
        syncIds: ['q-pay:wallet:tron:mainnet:T-example:USDT'],
        savings: false
      }
    ])
  })

  it('does not invent a zero balance for malformed data', () => {
    expect(convertWallets([
      { address: '0x-example', network: 'evm:56', balances: [{ asset: 'USDT', value: 'not-a-number' }] },
      { network: null, balances: [{ asset: 'USDT', value: '1' }] },
      { address: '0x-other', network: 'evm:1', balances: [{ asset: null, value: '1' }] }
    ])).toEqual([{
      id: 'q-pay:wallet:evm:56:0x-example:USDT',
      type: 'checking',
      title: 'Q-Pay USDT · BNB Smart Chain',
      instrument: 'USD',
      balance: null,
      syncIds: ['q-pay:wallet:evm:56:0x-example:USDT'],
      savings: false
    }])
  })

  it('accepts only active, non-revoked cards', () => {
    expect(isOpenCard({ id: '1', status: 'ACTIVE', is_revoked: false })).toBe(true)
    expect(isOpenCard({ id: '2', status: 'active', is_revoked: false })).toBe(true)
    expect(isOpenCard({ id: '3', status: 'ACTIVE', is_revoked: true })).toBe(false)
    expect(isOpenCard({ id: '4', status: 'CLOSED', is_revoked: false })).toBe(false)
    expect(isOpenCard({ status: 'ACTIVE', is_revoked: false })).toBe(false)
  })

  it('converts an active card balance without importing card details', () => {
    expect(convertCard({
      card: { id: 'card-id', status: 'ACTIVE', is_revoked: false },
      balance: { available_balance: '159.25', card_currency: 'USD' }
    })).toEqual({
      id: 'q-pay:card:card-id',
      type: 'ccard',
      title: 'Q-Pay Card',
      instrument: 'USD',
      balance: 159.25,
      available: 159.25,
      creditLimit: 0,
      syncIds: ['q-pay:card:card-id', 'card-id'],
      savings: false
    })
  })
})

describe('Q-Pay transaction conversion', () => {
  const wallets = [{
    address: '0x-wallet',
    network: 'evm:56',
    balances: [{ asset: 'USDT', value: '100' }]
  }]
  const cardAccounts: Account[] = [{
    id: 'q-pay:card:card-id',
    type: AccountType.ccard,
    title: 'Q-Pay Card',
    instrument: 'USD',
    balance: 50,
    available: 50,
    creditLimit: 0,
    syncIds: ['q-pay:card:card-id', 'card-id']
  }]

  it('converts confirmed wallet income and outcome with the API direction and fee', () => {
    expect(convertTransactions([
      {
        id: 'deposit-id',
        amount: '100',
        system_fee: '0',
        asset: 'USDT',
        network: 'evm:56',
        status: 'CONFIRMED',
        type: 'PAYMENT_GATEWAY_DEPOSIT',
        created_at: 1767225600
      },
      {
        id: 'purchase-id',
        amount: '45',
        system_fee: '2',
        asset: 'USDT',
        network: 'evm:56',
        status: 'CONFIRMED',
        type: 'CARD_PURCHASE',
        created_at: 1767225660,
        in_wallet_address: '0x-wallet'
      },
      {
        id: 'pending-id',
        amount: '5',
        asset: 'USDT',
        network: 'evm:56',
        status: 'PENDING',
        type: 'WITHDRAW',
        created_at: 1767225720
      }
    ], [], wallets, cardAccounts)).toEqual([
      {
        hold: false,
        date: new Date('2026-01-01T00:00:00.000Z'),
        movements: [{
          id: 'q-pay:wallet-tx:deposit-id',
          account: { id: 'q-pay:wallet:evm:56:0x-wallet:USDT' },
          sum: 100,
          fee: 0,
          invoice: null
        }],
        merchant: null,
        comment: 'Пополнение Q-Pay'
      },
      {
        hold: false,
        date: new Date('2026-01-01T00:01:00.000Z'),
        movements: [{
          id: 'q-pay:wallet-tx:purchase-id',
          account: { id: 'q-pay:wallet:evm:56:0x-wallet:USDT' },
          sum: -45,
          fee: -2,
          invoice: null
        }],
        merchant: null,
        comment: 'Покупка карты Q-Pay'
      }
    ])
  })

  it('merges wallet card deposit and card top-up into one transfer', () => {
    const result = convertTransactions([{
      id: 'wallet-top-up',
      amount: '260.01',
      full_amount: '270',
      system_fee: '9.99',
      asset: 'USDT',
      network: 'evm:56',
      status: 'CONFIRMED',
      type: 'CARD_DEPOSIT',
      created_at: 1767225600,
      in_wallet_address: '0x-wallet'
    }], [{
      cardId: 'card-id',
      transactions: [{
        id: 'card-top-up',
        amount: '260.01',
        fee: '9.99',
        currency: 'USD',
        status: 'POSTED',
        type: 'TOP_UP',
        created_at: 1767225682
      }]
    }], wallets, cardAccounts)

    expect(result).toEqual([{
      hold: false,
      date: new Date('2026-01-01T00:00:00.000Z'),
      movements: [
        {
          id: 'q-pay:wallet-tx:wallet-top-up',
          account: { id: 'q-pay:wallet:evm:56:0x-wallet:USDT' },
          sum: -260.01,
          fee: -9.99,
          invoice: null
        },
        {
          id: 'q-pay:card-tx:card-top-up',
          account: { id: 'q-pay:card:card-id' },
          sum: 260.01,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Пополнение карты Q-Pay'
    }])
  })

  it('converts a card authorization with merchant and foreign-currency invoice', () => {
    const result = convertTransactions([], [{
      cardId: 'card-id',
      transactions: [{
        id: 'record-id',
        x_id: 'canonical-id',
        amount: '23.23',
        fee: '0',
        currency: 'USD',
        original_amount: '7078.74',
        original_currency: 'HUF',
        status: 'SUCCESS',
        type: 'CHARGE',
        lifecycle_stage: 'AUTHORIZATION',
        created_at: 1767225600,
        merchant: { name: 'Example Shop', mcc: '5411', city: 'Budapest', country: 'HU' }
      }]
    }], wallets, cardAccounts)

    expect(result).toEqual([{
      hold: true,
      date: new Date('2026-01-01T00:00:00.000Z'),
      movements: [{
        id: 'q-pay:card-tx:canonical-id',
        account: { id: 'q-pay:card:card-id' },
        sum: -23.23,
        fee: -0,
        invoice: { sum: -7078.74, instrument: 'HUF' }
      }],
      merchant: {
        title: 'Example Shop',
        mcc: 5411,
        city: 'Budapest',
        country: 'HU',
        location: null
      },
      comment: null
    }])
  })

  it('merges a purchased card initial balance and records the issue cost as a fee', () => {
    const result = convertTransactions([{
      id: 'card-id',
      amount: '45',
      full_amount: '45',
      system_fee: '0',
      asset: 'USDT',
      network: 'evm:56',
      status: 'CONFIRMED',
      type: 'CARD_PURCHASE',
      created_at: 1767225600,
      in_wallet_address: '0x-wallet'
    }], [{
      cardId: 'card-id',
      transactions: [{
        id: 'initial-balance',
        amount: '10',
        currency: 'USD',
        status: 'POSTED',
        type: 'TOP_UP',
        created_at: 1767225678
      }]
    }], wallets, cardAccounts)

    expect(result).toEqual([{
      hold: false,
      date: new Date('2026-01-01T00:00:00.000Z'),
      movements: [
        {
          id: 'q-pay:wallet-tx:card-id',
          account: { id: 'q-pay:wallet:evm:56:0x-wallet:USDT' },
          sum: -10,
          fee: -35,
          invoice: null
        },
        {
          id: 'q-pay:card-tx:initial-balance',
          account: { id: 'q-pay:card:card-id' },
          sum: 10,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Покупка карты Q-Pay'
    }])
  })

  it('keeps an unmatched posted card top-up as card income', () => {
    const result = convertTransactions([], [{
      cardId: 'card-id',
      transactions: [{
        id: 'external-top-up',
        amount: '10',
        currency: 'USD',
        status: 'POSTED',
        type: 'TOP_UP',
        created_at: 1767225600
      }]
    }], wallets, cardAccounts)

    expect(result[0].movements[0]).toMatchObject({
      account: { id: 'q-pay:card:card-id' },
      sum: 10,
      fee: 0,
      invoice: null
    })
  })
})
