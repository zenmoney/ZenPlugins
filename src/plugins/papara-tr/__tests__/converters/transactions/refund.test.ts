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

describe('Papara Card reversal', () => {
  it('keeps a posted reversal as income from the same merchant', () => {
    const item = {
      giftPreciousMetalInfo: null,
      mcCode: null,
      id: 4451737102,
      externalCardAcceptorId: 34,
      isCancellation: true,
      amount: 15,
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
      entryType: 2,
      entrySubType: null,
      moneySource: 2,
      resultingBalance: 678.65,
      description: 'Reverse (Spotify P4862B1FCB)',
      transactionId: '555865b7-fdac-4f0b-a725-5ca9e28ec94b',
      iconUrl: 'https://d23wms2coskb83.cloudfront.net/icons/externalcardacceptoricons/584b3abe-9a96-4bf3-8a37-73a7888634fa.png',
      descriptionTitle: 'Spotify',
      viaAtm: null,
      categoryId: 55,
      isCommercial: false,
      operatorUserId: null,
      isSplitted: false,
      isSplitCompleted: false,
      entryTypeTitle: 'Papara Card',
      surcharge: 0,
      conditionId: null,
      price: null,
      createdAt: '2026-10-24T18:52:36.193',
      isSplitAvailable: false,
      isCustomDescription: false,
      descriptionIconUrl: null,
      paparaCardTxType: 1,
      childIconUrl: null,
      childAmount: null,
      ledgerGestureRelationship: null,
      isDisapprovalVisible: false,
      isDigitalSlipReceipt: true,
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
      date: new Date('2026-10-24T18:52:36.193+03:00'),
      movements: [{ id: '4451737102', account: { id: 'TR000000000000000000000001' }, invoice: null, sum: 15, fee: 0 }],
      merchant: { title: 'Spotify', city: null, country: null, mcc: null, location: null },
      comment: null
    })
  })
})
