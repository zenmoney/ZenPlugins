// Source: 2026-11-26 Bootloader session log of the papara-tr development build (user/ledgers page 2).
// The record is complete and contains no personal data.
import { AccountType } from '../../../../../types/zenmoney'
import type { AccountOrCard } from '../../../../../types/zenmoney'
import { convertTransaction } from '../../../converters'

const accounts: AccountOrCard[] = [{
  id: 'TR000000000000000000000001',
  type: AccountType.checking,
  title: 'Papara TRY',
  instrument: 'TRY',
  syncIds: ['TR000000000000000000000001'],
  savings: false,
  balance: 2785.62
}]

describe('Papara card fee', () => {
  it('is an expense without a merchant, keeping the card product and fee name', () => {
    const item = {
      giftPreciousMetalInfo: null,
      mcCode: null,
      id: 4460698751,
      externalCardAcceptorId: null,
      isCancellation: false,
      amount: -299,
      fee: 0,
      currency: 0,
      currencyInfo: {
        currencyEnum: 0,
        symbol: '₺',
        code: 'TRY',
        number: 949,
        preferredDisplayCode: 'TL',
        name: 'Türk Lirası',
        isCryptocurrency: false,
        isInternationalMoneyTransferCurrency: false,
        precision: 2,
        iconUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/currencies/try.svg',
        flagUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/currencies/try_flag.png',
        currencyEnumIso: 949,
        isMetalCurrency: false
      },
      entryType: 29,
      entrySubType: null,
      moneySource: 2,
      resultingBalance: 5415.56,
      description: 'Card Fee',
      transactionId: '7e4bf25f-eaa5-4a48-b724-5da98e86d1cf',
      iconUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/ledger/blacksticker.png',
      descriptionTitle: 'Sticker Card',
      viaAtm: null,
      categoryId: 0,
      isCommercial: false,
      operatorUserId: null,
      isSplitted: false,
      isSplitCompleted: false,
      entryTypeTitle: 'Card Fee',
      surcharge: 0,
      conditionId: null,
      price: null,
      createdAt: '2026-11-24T07:43:35.780',
      isSplitAvailable: false,
      isCustomDescription: false,
      descriptionIconUrl: null,
      paparaCardTxType: null,
      childIconUrl: null,
      childAmount: null,
      ledgerGestureRelationship: null,
      isDisapprovalVisible: false,
      isDigitalSlipReceipt: false,
      moneyTransferType: null,
      subscriptionId: null,
      isAppStore: false,
      userId: null,
      user: null,
      otherUserId: null,
      secondaryResultingBalance: null,
      referenceCode: null,
      massPaymentId: null,
      merchantId: null,
      savedCardId: null,
      isDisapprovalVisibleForAtmDeposit: false,
      paymentId: null,
      paparaCardId: null,
      pgTranId: null
    }
    expect(convertTransaction(item, accounts)).toEqual({
      hold: null,
      date: new Date('2026-11-24T07:43:35.780+03:00'),
      movements: [{ id: '4460698751', account: { id: 'TR000000000000000000000001' }, invoice: null, sum: -299, fee: 0 }],
      merchant: null,
      comment: 'Sticker Card, Card Fee'
    })
  })
})
