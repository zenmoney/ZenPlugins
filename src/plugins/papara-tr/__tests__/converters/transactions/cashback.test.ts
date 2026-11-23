// Source: 2026-11-24 Bootloader log of the papara-tr development build (user/ledgers, balance).
// Records are complete; the account IBAN and counterparty IBAN are replaced with public-safe values.
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
  balance: 5714.56
}]

describe('Papara cashback', () => {
  it('is separate income with the reward text, sharing transactionId with the purchase', () => {
    const item = {
      giftPreciousMetalInfo: null,
      mcCode: null,
      id: 4459780203,
      externalCardAcceptorId: null,
      isCancellation: false,
      amount: 1.99,
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
      entryType: 15,
      entrySubType: null,
      moneySource: 0,
      resultingBalance: 5714.56,
      description: 'You earned 1% cashback.',
      transactionId: '6a07656f-8353-456f-893d-317415c948fc',
      iconUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/ledger/cashback.png',
      descriptionTitle: 'Surprise Cashback',
      viaAtm: null,
      categoryId: 0,
      isCommercial: false,
      operatorUserId: null,
      isSplitted: false,
      isSplitCompleted: false,
      entryTypeTitle: 'Papara Cashback',
      surcharge: 0,
      conditionId: null,
      price: null,
      createdAt: '2026-11-21T16:33:32.263',
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
      date: new Date('2026-11-21T16:33:32.263+03:00'),
      movements: [{ id: '4459780203', account: { id: 'TR000000000000000000000001' }, invoice: null, sum: 1.99, fee: 0 }],
      merchant: null,
      comment: 'You earned 1% cashback.'
    })
  })
})
