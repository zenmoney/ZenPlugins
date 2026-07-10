import { AccountOrCard, AccountType, NonParsedMerchant } from '../../../../../types/zenmoney'
import { AltynTransaction } from '../../../models'
import { convertTransaction } from '../../../converters'

const account: AccountOrCard = {
  id: 'A-100000000001',
  type: AccountType.checking,
  title: 'Altyn A-100000000001',
  instrument: 'RUB',
  balance: 12345.67,
  syncIds: ['A-100000000001']
}

describe('convertTransaction', () => {
  it('should convert withdraw (расход)', () => {
    const apiTx: AltynTransaction = {
      token: 'aaaa1111-bb22-cc33-dd44-eeeeeeeeeeee',
      amount: '500.25',
      currency: 'RUB',
      created_at: '2026-07-05T10:30:33.000000Z',
      type: 'withdraw',
      status: 2,
      label: 'Магазин',
      details: 'Карта'
    }
    expect(convertTransaction(apiTx, account)).toEqual({
      hold: null,
      date: new Date('2026-07-05T10:30:33.000000Z'),
      movements: [{
        id: 'aaaa1111-bb22-cc33-dd44-eeeeeeeeeeee',
        account: { id: 'A-100000000001' },
        invoice: null,
        sum: -500.25,
        fee: 0
      }],
      merchant: { fullTitle: 'Магазин', mcc: null, location: null },
      comment: null
    })
  })

  it('should convert deposit (приход)', () => {
    const apiTx: AltynTransaction = {
      token: 'bbbb2222-cc33-dd44-ee55-ffffffffffff',
      amount: '1000',
      currency: 'RUB',
      created_at: '2026-07-04T14:40:34.000000Z',
      type: 'deposit',
      status: 2,
      label: 'Перевод',
      details: 'Пополнение'
    }
    const result = convertTransaction(apiTx, account)
    expect(result?.movements[0].sum).toBe(1000)
    expect((result?.merchant as NonParsedMerchant)?.fullTitle).toBe('Перевод')
  })

  it('should use label as merchant title (приоритет над details)', () => {
    const apiTx: AltynTransaction = {
      token: 'cccc3333-dd44-ee55-ff66-000000000001',
      amount: '534.02',
      currency: 'RUB',
      created_at: '2026-07-04T12:55:38.000000Z',
      type: 'deposit',
      status: 2,
      label: 'Бонус',
      details: 'программа лояльности'
    }
    const result = convertTransaction(apiTx, account)
    expect((result?.merchant as NonParsedMerchant)?.fullTitle).toBe('Бонус')
  })

  it('should fall back to details when label is null', () => {
    const apiTx: AltynTransaction = {
      token: 'dddd4444-ee55-ff66-0077-000000000002',
      amount: '50',
      currency: 'RUB',
      created_at: '2026-07-01T06:00:04.000000Z',
      type: 'withdraw',
      status: 2,
      label: null,
      details: 'Карта'
    }
    const result = convertTransaction(apiTx, account)
    expect((result?.merchant as NonParsedMerchant)?.fullTitle).toBe('Карта')
  })

  it('should return null merchant when both label and details are null', () => {
    const apiTx: AltynTransaction = {
      token: 'eeee5555-ff66-0077-1188-000000000003',
      amount: '100',
      currency: 'RUB',
      created_at: '2026-07-01T06:00:04.000000Z',
      type: 'withdraw',
      status: 2,
      label: null,
      details: null
    }
    const result = convertTransaction(apiTx, account)
    expect(result?.merchant).toBeNull()
  })

  it('should skip transactions with status !== 2', () => {
    const apiTx: AltynTransaction = {
      token: 'ffff6666-0077-1188-2299-000000000004',
      amount: '1838',
      currency: 'RUB',
      created_at: '2026-04-03T09:13:36.000000Z',
      type: 'withdraw',
      status: 6,
      label: 'Отменённый платёж',
      details: 'Карта'
    }
    expect(convertTransaction(apiTx, account)).toBeNull()
  })

  it('should handle integer amount', () => {
    const apiTx: AltynTransaction = {
      token: '1111aaaa-2222-bbbb-3333-cccccccccccc',
      amount: '999',
      currency: 'RUB',
      created_at: '2026-07-04T12:57:28.000000Z',
      type: 'withdraw',
      status: 2,
      label: 'Услуга',
      details: 'Карта'
    }
    const result = convertTransaction(apiTx, account)
    expect(result?.movements[0].sum).toBe(-999)
  })

  it('should set correct movement id and account ref', () => {
    const apiTx: AltynTransaction = {
      token: '2222bbbb-3333-cccc-4444-dddddddddddd',
      amount: '50',
      currency: 'RUB',
      created_at: '2026-07-01T06:00:04.000000Z',
      type: 'withdraw',
      status: 2,
      label: 'Подписка',
      details: 'Карта'
    }
    const result = convertTransaction(apiTx, account)
    expect(result?.movements[0].id).toBe('2222bbbb-3333-cccc-4444-dddddddddddd')
    expect(result?.movements[0].account).toEqual({ id: 'A-100000000001' })
  })
})
