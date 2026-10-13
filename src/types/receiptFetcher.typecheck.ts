import type { FetchReceipt, ParseReceiptCode, ReceiptFetcherManifest, ReceiptFetcherDescriptor, Receipt, ReceiptItem, ReceiptPaymentMethod, ReceiptMerchantIdentifier, ReceiptAdjustment, Matcher } from './receiptFetcher'

const matcher: Matcher = { all: ['t=', /fn=\d+/i, { not: 'unsupported' }] }
const manifest: ReceiptFetcherManifest = { id: 'example-ru', countryCodes: ['RU', 'BY'], capabilities: { fetchReceipt: { matcher } } }
const descriptor: ReceiptFetcherDescriptor = {
  id: 'example-ru',
  countryCodes: ['RU'],
  capabilities: { fetchReceipt: { matcher: 't=' } },
  files: { js: ['index.js'] }
}
const fetchReceipt: FetchReceipt = async () => ({ status: 'notApplicable' })
// Both receipt operations settle through promises.
const parseReceiptCode: ParseReceiptCode = async () => ({ status: 'notApplicable' })
const parseReceiptCodePreview: ParseReceiptCode = async () => ({ status: 'parsed', preview: { completeness: 'preview', totalAmount: '10' } })
// @ts-expect-error Preview returns a promise even when parsing completes immediately.
const synchronousPreview: ParseReceiptCode = () => ({ status: 'notApplicable' })
const merchantId: ReceiptMerchantIdentifier = { value: '123456789A', countryCode: 'SG', scheme: 'UEN' }
const adjustment: ReceiptAdjustment = { kind: 'discount', amount: '-1', percent: '10', baseAmount: '10' }
const receipt: Receipt = {
  completeness: 'full',
  issuedAt: { date: '2026-09-17' },
  currency: 'EUR',
  totalAmount: '10',
  merchant: { identifiers: [merchantId] },
  payments: [{ method: 'card', amount: '3' }, { method: 'deferred', amount: '7' }],
  items: [{
    name: 'Item',
    quantity: '1',
    originalTotalAmount: '8.33',
    totalAmount: '10',
    adjustments: [{ kind: 'tax', name: 'VAT', amount: '1.67', percent: '20', baseAmount: '8.33' }]
  }],
  operation: 'unknown'
}

const documentTaxReceipt: Receipt = {
  ...receipt,
  originalTotalAmount: '10',
  totalAmount: '12',
  items: [{ name: 'Item', quantity: '1', totalAmount: '10' }],
  adjustments: [{ kind: 'tax', name: 'VAT', amount: '2', percent: '20', baseAmount: '10' }],
  payments: [{ method: 'card', amount: '12' }]
}

// @ts-expect-error Taxes are adjustments, not a separate receipt collection.
const removedReceiptTaxes: Receipt = { ...receipt, taxes: [{ amount: '1.67' }] }
// @ts-expect-error Included item taxes also use adjustments.
const removedItemTaxes: ReceiptItem = { ...receipt.items[0], taxes: [{ amount: '1.67' }] }

// @ts-expect-error Tax details belong to adjustments; there is no item-wide tax mode.
const removedPriceTaxMode: ReceiptItem = { ...receipt.items[0], priceTaxMode: 'inclusive' }

// @ts-expect-error Receipt money crosses the runtime boundary as decimal strings.
const wrongAmount: Receipt = { ...receipt, totalAmount: 10 }
// @ts-expect-error Capabilities describe operations, not bank scraping.
const wrongManifest: ReceiptFetcherManifest = { ...manifest, capabilities: { scrape: {} } }
// @ts-expect-error A receipt has no lookup code field.
const wrongReceipt: Receipt = { ...receipt, code: { format: 'qr', value: 'test' } }
// @ts-expect-error Matchers cannot contain executable callbacks.
const wrongMatcher: Matcher = () => true

const methods: ReceiptPaymentMethod[] = ['prepayment', 'cash', 'card', 'cashless', 'loyaltyPoints', 'giftCard', 'deferred', 'other']
// @ts-expect-error The receipt uses a deferred payment entry instead of amountDue.
const removedBalance: Receipt = { ...receipt, amountDue: '7' }
// @ts-expect-error Payments are supported only at receipt level.
const itemPayments: ReceiptItem = { name: 'Item', quantity: '1', totalAmount: '10', payments: [{ method: 'deferred', amount: '10' }] }
// @ts-expect-error Transfers use the cashless method.
const removedMethod: ReceiptPaymentMethod = 'bankTransfer'

void [manifest, descriptor, fetchReceipt, parseReceiptCode, parseReceiptCodePreview, synchronousPreview, receipt, documentTaxReceipt, removedReceiptTaxes, removedItemTaxes, removedPriceTaxMode, adjustment, wrongAmount, wrongManifest, wrongReceipt, wrongMatcher, methods, removedBalance, itemPayments, removedMethod]
