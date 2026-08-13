import { convertAccount } from '../../../converters'

const apiAccount = {
  __type: 'com.ukrsibbank.client.protocol.product.account.AccountMto',
  number: '00001234569876',
  balanceInterestRate: null,
  tariffPlanId: null,
  id: '9876543210',
  name: 'Шоппинг карта',
  alias: 'Шоппинг карта',
  reminder: null,
  warning: null,
  type:
    { __type: 'com.ukrsibbank.client.protocol.product.account.AccountTypeMto', name: 'REVOLVING_ACCOUNT' },
  balance:
    {
      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
      sum: 10250,
      currency:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
          name: 'UAH'
        }
    },
  interestRates: [],
  minimalBalance: null,
  totalAvailableAmount:
    {
      __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
      sum: 10250,
      currency:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
          name: 'UAH'
        }
    },
  overdraft:
    {
      __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftDetailsMto',
      overdraftUsageRate: null,
      overdraftCashUsageRate: 55,
      overdraftCashlessUsageRate: 55,
      overdueOverdraftRate: 0,
      availableOverdraft:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 10250,
          currency:
            { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
        },
      overdraftLimit:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 10250,
          currency:
            { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
        },
      overdraftEndDate: 'Sun Jan 10 2021 01:00:00 GMT+0300 (MSK)',
      overdueDebtCommission:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 100,
          currency:
            { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
        },
      minimalOverdraftPayment: null,
      overdraftDebt: null,
      feeDebt: null,
      overdueOverdraftDebt: null,
      totalDebt: null,
      totalDebtDetails: [],
      paymentDebtDate: null,
      repaymentDetails:
        {
          __type: 'com.ukrsibbank.client.protocol.product.account.OverdraftRepaymentDetailsMto',
          totalAmount:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
              sum: 0,
              currency:
                { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
            },
          plannedPaymentDate: null,
          plannedPaymentAmount:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
              sum: 0,
              currency:
                { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
            },
          plannedPaymentAmountDetails: [],
          overdueDebtAmount:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
              sum: 0,
              currency:
                { __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto', name: 'UAH' }
            },
          overdueDebtAmountDetails: []
        }
    },
  paymentAmountToEnableGracePeriod: null,
  paymentDateToEnableGracePeriod: null,
  tariffPlanResource:
    {
      __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
      id: 'a2debd72-da16-4e0f-8b05-1d76af364bc5',
      contentTimestamp: 'Wed Jul 18 2018 09:02:19 GMT+0300 (MSK)'
    },
  category:
    { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
}

const apiCards = [
  {
    __type: 'com.ukrsibbank.client.protocol.product.card.CardMto',
    accountId: '9876543210',
    number: '5236 00** **** 6543',
    holderName: 'MR CARDHOLDER',
    statusText: 'Your card is in the manufacturing process',
    lightImage: true,
    canTransferFrom: false,
    canTransferTo: false,
    canBlock: false,
    canUnblock: false,
    canUpdateSmsService: false,
    cardLimitsAvailable: false,
    canAddToGooglePay: false,
    id: '1234567890',
    name: 'MasterCard Standard Credit Shopping Сard',
    alias: 'MC Standard Credit',
    reminder: null,
    warning: null,
    status:
      {
        __type: 'com.ukrsibbank.client.protocol.product.card.CardStatusMto',
        name: 'ISSUING'
      },
    expirationDate: 'Thu Nov 30 2023 01:00:00 GMT+0300 (MSK)',
    smallImage:
      {
        __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
        id: '6ccfe2cf-5d9f-46c2-a4d5-19e6ec6a619d',
        contentTimestamp: 'Wed Aug 03 2016 04:09:44 GMT+0300 (MSK)'
      },
    largeImage:
      {
        __type: 'com.ukrsibbank.client.protocol.resource.ResourceReferenceMto',
        id: '55f5ae3c-4794-4560-a6a2-37fd86c54af9',
        contentTimestamp: 'Wed Aug 15 2018 15:31:32 GMT+0300 (MSK)'
      },
    googlePayTokens: [],
    category:
      {
        __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
        name: 'CARD'
      }
  }
]

describe('convertAccount', () => {
  it('converts revolving account', () => {
    expect(convertAccount(apiAccount, apiCards)).toEqual({
      product: {
        id: '9876543210',
        category: { __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto', name: 'ACCOUNT' }
      },
      account: {
        id: '9876543210',
        type: 'ccard',
        title: 'Шоппинг карта',
        instrument: 'UAH',
        syncID: [
          '523600******6543',
          '00001234569876'
        ],
        balance: 0,
        creditLimit: 10250
      }
    })
  })
})
