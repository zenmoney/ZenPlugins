import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts common transaction', () => {
    expect(convertTransaction({
      __type: 'ru.vtb24.mobilebanking.protocol.statement.AccountTransactionMto',
      debet: {
        amount: { __type: 'ru.vtb24.mobilebanking.protocol.AmountMto', sum: 10000.97, currency: {} },
        archived: false,
        cards: [],
        closeDate: null,
        contract: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.ComplexServiceContractMto',
          commissionInterval: null,
          number: null,
          id: '127c2a7e-4e04-4c5e-96c8-2faab1556ba3',
          name: 'Привилегия'
        },
        details: [],
        displayName: 'Мастер счет в рублях',
        id: 'F71710FBFC614CC29030ACF227509AA1',
        isDefault: true,
        lastOperationDate: null,
        mainCard: null,
        masterAccountCards: [],
        name: 'Мастер счет в рублях',
        number: '40235280003523002672',
        openDate: new Date('Sat Dec 12 2015 00:00:00 GMT+0300'),
        overdraft: null,
        showOnMainPage: true,
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
        __type: 'ru.vtb24.mobilebanking.protocol.product.MasterAccountMto'
      },
      details: 'Карта *3536 MOTEL KIROVSKIE DACHI',
      feeAmount: null,
      id: '53989a75-7138-484b-aaa7-e9ea1d12f30a',
      isHold: false,
      order: null,
      processedDate: new Date('Fri Jun 22 2018 10:53:38 GMT+0300'),
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
        id: 'SUCCESS'
      },
      statusName: null,
      transactionAmount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: -5400,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          displaySymbol: '₽',
          name: 'Рубль России'
        }
      },
      transactionDate: new Date('Mon Jun 18 2018 19:16:42 GMT+0300')
    }, {
      zenAccount: {
        id: 'account'
      }
    })).toEqual({
      date: new Date('2018-06-18T19:16:42+03:00'),
      hold: false,
      income: 0,
      incomeAccount: 'account',
      outcome: 5400,
      outcomeAccount: 'account',
      payee: 'MOTEL KIROVSKIE DACHI'
    })
  })

  it('skips transaction from additional card', () => {
    expect(convertTransaction({
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
    }, {
      id: '1334A5E71E3249AB9E8ECCE8C6627144'
    })).toBeNull()
  })
})
