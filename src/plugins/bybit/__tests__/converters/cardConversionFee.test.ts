import { convertTransaction, parseCardConversionFeePercent } from '../../converters'
import { InvalidPreferencesError } from '../../../../errors'
import { AccountOrCard, AccountType } from '../../../../types/zenmoney'
import { CardTransaction } from '../../models'

const fundingAccount: AccountOrCard = {
  id: 'bybit_funding',
  type: AccountType.checking,
  title: 'Bybit Funding',
  instrument: 'USD',
  balance: 100,
  syncIds: ['bybit_funding']
}

// A real cleared purchase: 51.10 CNY at a Chinese taxi service. Bybit reported
// basicAmount 7.77 USD including totalFees 0.15, while the app's "Crypto used"
// record shows the Funding wallet actually paid 7.8797 USDT at rate 0.9861.
const taxiPurchase: CardTransaction = {
  txnId: '2000000000000104',
  orderNo: '2026210079521153310720050580_100000000',
  side: '1',
  tradeStatus: '0',
  txnCreate: '1789818780000',
  basicAmount: 7.77,
  basicCurrency: 'USD',
  baseAmount: 0,
  paidAmount: 51.1,
  paidCurrency: 'CNY',
  transactionAmount: 7.62,
  transactionCurrency: 'USD',
  transactionCurrencyAmount: 7.77,
  merchName: 'Alipay*Taxi',
  merchCity: 'Shanghai',
  merchCountry: 'CHN',
  mccCode: 4121,
  merchCategoryDesc: '4121',
  pan4: '1234',
  declinedReason: '0',
  totalFees: 0.15
}

describe('parseCardConversionFeePercent', () => {
  it('treats an unset or blank preference as no markup', () => {
    expect(parseCardConversionFeePercent(undefined)).toBe(0)
    expect(parseCardConversionFeePercent('')).toBe(0)
    expect(parseCardConversionFeePercent('  ')).toBe(0)
  })

  it('accepts a plain decimal, with either separator', () => {
    expect(parseCardConversionFeePercent('1.41')).toBe(1.41)
    expect(parseCardConversionFeePercent('1,41')).toBe(1.41)
    expect(parseCardConversionFeePercent('0')).toBe(0)
  })

  it('rejects numeric syntax that no one types as a percentage', () => {
    // Number() would silently read these as 16 % and 10 %.
    expect(() => parseCardConversionFeePercent('0x10')).toThrow(InvalidPreferencesError)
    expect(() => parseCardConversionFeePercent('1e1')).toThrow(InvalidPreferencesError)
  })

  it('reads a separator as a decimal one, never as thousands', () => {
    // '1,000' is one percent written in a European locale, not one thousand.
    expect(parseCardConversionFeePercent('1,000')).toBe(1)
  })

  it('rejects values that cannot be a percentage', () => {
    expect(() => parseCardConversionFeePercent('-1')).toThrow(InvalidPreferencesError)
    expect(() => parseCardConversionFeePercent('100')).toThrow(InvalidPreferencesError)
    expect(() => parseCardConversionFeePercent('half')).toThrow(InvalidPreferencesError)
  })
})

describe('convertTransaction conversion markup', () => {
  it('imports only the fees Bybit reports when no markup is configured', () => {
    const movement = convertTransaction(taxiPurchase, fundingAccount)?.movements[0]
    expect(movement).toMatchObject({ sum: -7.62, fee: -0.15 })
    expect((movement?.sum ?? 0) + (movement?.fee ?? 0)).toBeCloseTo(-7.77, 10)
  })

  it('charges the wallet what it really paid once the markup is known', () => {
    const movement = convertTransaction(taxiPurchase, fundingAccount, 1.41)?.movements[0]
    // 0.15 reported by Bybit plus 7.77 * 1.41% of undisclosed conversion markup.
    expect(movement).toMatchObject({ sum: -7.62, fee: -0.26 })
    // ZenMoney books sum + fee, which must match the 7.8797 USDT actually spent.
    expect((movement?.sum ?? 0) + (movement?.fee ?? 0)).toBeCloseTo(-7.88, 2)
  })

  it('keeps the merchant invoice in the currency the merchant charged', () => {
    const movement = convertTransaction(taxiPurchase, fundingAccount, 1.41)?.movements[0]
    expect(movement?.invoice).toEqual({ sum: -51.1, instrument: 'CNY' })
  })

  it('charges only the markup when Bybit reports no fee of its own', () => {
    const free: CardTransaction = { ...taxiPurchase, totalFees: 0 }
    const movement = convertTransaction(free, fundingAccount, 1.41)?.movements[0]
    expect(movement).toMatchObject({ sum: -7.77, fee: -0.11 })
  })

  it('values a hold and its cleared record identically, which is what lets ZenMoney merge them', () => {
    // Bybit issues the clearing record under a different txnId and orderNo, so
    // ZenMoney pairs them by amount. Differing sums would leave a stale hold.
    const cleared: CardTransaction = { ...taxiPurchase, txnId: '2000000000000106', side: '3', tradeStatus: '1' }
    const hold = convertTransaction(taxiPurchase, fundingAccount, 1.41)
    const settled = convertTransaction(cleared, fundingAccount, 1.41)

    expect(hold?.hold).toBe(true)
    expect(settled?.hold).toBe(false)
    expect(settled?.movements[0].sum).toBe(hold?.movements[0].sum)
    expect(settled?.movements[0].fee).toBe(hold?.movements[0].fee)
  })

  it('does not invent a markup on refunds, whose rate Bybit does not disclose either', () => {
    const refund: CardTransaction = { ...taxiPurchase, txnId: 'REFUND-1', side: '5', tradeStatus: '1', totalFees: 0 }
    const movement = convertTransaction(refund, fundingAccount, 1.41)?.movements[0]
    expect(movement).toMatchObject({ sum: 7.77, fee: 0 })
  })
})
