// Source: 2026-11-24 Bootloader log of the papara-tr development build (user/ledgers, balance).
// Records are complete; the account IBAN and counterparty IBAN are replaced with public-safe values.
import { AccountType } from '../../../../../types/zenmoney'
import { convertAccounts } from '../../../converters'

describe('balance accounts', () => {
  it('converts each currency balance to a checking account identified by its IBAN', () => {
    const data = {
      balances: [
        {
          currency: 0,
          currencyInfo: {
            currencyEnum: 0,
            symbol: '₺',
            code: 'TRY',
            number: 949,
            preferredDisplayCode: 'TL',
            name: 'Turkish Lira',
            isCryptocurrency: false,
            isInternationalMoneyTransferCurrency: false,
            precision: 2,
            iconUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/currencies/try.svg',
            flagUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/currencies/try_flag.png',
            currencyEnumIso: 949,
            isMetalCurrency: false
          },
          totalBalance: 5714.56,
          lockedBalance: 0,
          iban: 'TR000000000000000000000001',
          availableBalance: 5714.56,
          availableCashBalance: 5714.56,
          actions: {
            isVisibleForCurrencyPicker: true,
            isBalanceCreateEnabled: true,
            isExchangeEnabled: false,
            isExchangeBuyEnabled: false,
            isExchangeSellEnabled: false,
            isVisibleForMoneyTransferCurrencyPicker: true,
            isVisibleForMetalTransferCurrencyPicker: false,
            isMoneyTransferViaPhoneNumberEnabled: true,
            isMoneyTransferViaPhoneNumberForInviteUnregisteredUserEnabled: true,
            isMoneyTransferViaIbanEnabled: true,
            isMoneyTransferViaAccountNumberEnabled: true,
            isFastTransferViaIbanEnabled: true,
            isMoneyTransferViaQrEnabled: true,
            isRecurringMoneyTransferEnabled: true,
            isRecurringExchangeEnabled: false,
            isSendMoneyTransferBackEnabled: true,
            isMoneyRequestEnabled: true,
            isPocketMoneyInstructionEnabled: true,
            isEligibleToSendMoney: true,
            isEligibleToGetMoney: true,
            isEligibleToWithdraw: true
          }
        }
      ],
      savingBalancesSum: {
        iconUrl: 'https://dkto9gpxgolik.cloudfront.net/icons/birikim.svg',
        balances: []
      }
    }
    expect(convertAccounts(data)).toEqual([{
      id: 'TR000000000000000000000001',
      type: AccountType.checking,
      title: 'Papara TRY',
      instrument: 'TRY',
      syncIds: ['TR000000000000000000000001'],
      savings: false,
      balance: 5714.56
    }])
  })
})
