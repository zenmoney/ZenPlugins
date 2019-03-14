import { convertTransaction } from '../../../converters'
const convertToReadableTransactionForAccount = apiAccount => apiTransaction => convertTransaction(apiTransaction, apiAccount)

describe('convertTransaction', () => {
  it('skips transaction from additional card', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: '39debc46-36e0-4ac9-9aba-edcfaf6de06c',
        details: 'Карта *2289 MAGNOLIYA',
        isHold: true,
        statusName: 'В обработке',
        transactionAmountInAccountCurrency: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: -239.7,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          }
        },
        debet: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.CreditCardMto',
          number: '432250XXXXXX2289',
          brandName: 'Visa',
          embossed: null,
          cardHolder: 'Николаева Н.Н.',
          isAuthenticationalCard: false,
          coBrandName: null,
          isEmitedForOwner: false,
          shortNumber: '427230XXXXXX4688',
          icon: 'Muylticard-VTB',
          cardHolderLastName: 'Николаева',
          cardHolderFirstName: 'Нина',
          cardHolderPatronymic: 'Наумовна',
          nameOnCard: null,
          statusDisplayName: 'Активна',
          isMain: false,
          hasDependantCards: false,
          id: '3041EB1B9E47400E9833D2171B640EC1',
          name: 'Gold',
          displayName: 'ru_pip',
          showOnMainPage: false,
          archived: false,
          issueDate: new Date('Sat Jun 23 2017 00:00:00 GMT+0300'),
          expireDate: new Date('Wed Jun 30 2022 00:00:00 GMT+0300'),
          baseCurrency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽' },
          limits: null,
          balance: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardBalanceMto',
            amountSum: -31180.35,
            allowedSum: 268819.65,
            authorizedSum: 2129.7,
            balanceDate: null },
          lockedDate: null,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.CardStatusMto',
            id: 'ACTIVE'
          },
          cardAccount: null,
          logistics: null,
          details: null
        },
        transactionDate: new Date('Tue Jul 10 2018 18:22:32 GMT+0300'),
        processedDate: null,
        transactionAmount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: -239.7,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          }
        },
        feeAmount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 0,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          }
        },
        order: null,
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
          id: 'IN_PROGRESS'
        }
      }
    ]

    const apiAccount = {
      id: '1334A5E71E3249AB9E8ECCE8C6627144'
    }

    const expectedReadableTransactions = [
      null
    ]

    const readableTransactionConverter = convertToReadableTransactionForAccount(apiAccount)
    const readableTransactions = apiTransactions.map(readableTransactionConverter)
    expect(readableTransactions).toEqual(expectedReadableTransactions)
  })
})
