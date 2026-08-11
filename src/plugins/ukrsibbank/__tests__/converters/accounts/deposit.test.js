import { convertDeposit } from '../../../converters'

describe('convertDeposit', () => {
  it('converts deposit', () => {
    expect(convertDeposit({
      __type: 'com.ukrsibbank.client.protocol.product.deposit.DepositMto',
      number: '26300710910204',
      period: 91,
      rate: 7,
      rateIncrease: 0,
      replenishmentPossible: false,
      prolongationPossible: true,
      daysBeforeCloseDate: null,
      chargingText: 'Interest on your deposit is paid to the account ЗП AI Ultra карточный *9823',
      withdrawalText: 'Deposit will be paid to the account ЗП AI Ultra карточный *9823',
      openedOnline: true,
      id: '1794111383',
      name: 'Надежный доход',
      alias: 'Надежный доход',
      reminder: null,
      warning: null,
      status:
        {
          __type: 'com.ukrsibbank.client.protocol.product.deposit.DepositStatusMto',
          name: 'ACTIVE'
        },
      openDate: new Date('Tue Jan 15 2019 00:00:00 GMT+0200 (EET)'),
      closeDate: new Date('Tue Apr 16 2019 00:00:00 GMT+0300 (EEST)'),
      rateIncreaseStartDate: null,
      rateIncreaseEndDate: null,
      balance:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 18079,
          currency:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
              name: 'UAH'
            }
        },
      interestAmount:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 534.92,
          currency:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
              name: 'UAH'
            }
        },
      nextReplenishDate: null,
      requiredMonthlyReplenishment: null,
      category:
        {
          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
          name: 'DEPOSIT'
        }
    })).toEqual({
      product: {
        id: '1794111383',
        category: {
          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
          name: 'DEPOSIT'
        }
      },
      account: {
        id: '1794111383',
        type: 'deposit',
        title: 'Надежный доход',
        instrument: 'UAH',
        syncID: ['26300710910204'],
        balance: 18079,
        startBalance: 0,
        startDate: new Date('2019-01-15T00:00:00+02:00'),
        capitalization: true,
        percent: 7,
        payoffStep: 1,
        payoffInterval: 'month',
        endDateOffset: 91,
        endDateOffsetInterval: 'day'
      }
    })
  })

  it('converts deposit without closing date', () => {
    expect(convertDeposit({
      __type: 'com.ukrsibbank.client.protocol.product.deposit.DepositMto',
      number: '26208556574201',
      period: null,
      rate: 0.01,
      rateIncrease: null,
      replenishmentPossible: true,
      prolongationPossible: false,
      daysBeforeCloseDate: null,
      chargingText: 'Interest on your deposit is added to it',
      withdrawalText: 'You can pick up your deposit at the box office UkrSibbank',
      openedOnline: false,
      id: '68878428',
      name: 'Активні гроші',
      alias: 'Активні гроші',
      reminder: null,
      warning: null,
      status:
        {
          __type: 'com.ukrsibbank.client.protocol.product.deposit.DepositStatusMto',
          name: 'ACTIVE'
        },
      openDate: new Date('Tue May 05 2015 00:00:00 GMT+0300 (EEST)'),
      closeDate: null,
      rateIncreaseStartDate: null,
      rateIncreaseEndDate: null,
      balance:
        {
          __type: 'com.ukrsibbank.client.protocol.amount.AmountMto',
          sum: 302.71,
          currency:
            {
              __type: 'com.ukrsibbank.client.protocol.amount.CurrencyMto',
              name: 'UAH'
            }
        },
      interestAmount: null,
      nextReplenishDate: null,
      requiredMonthlyReplenishment: null,
      category:
        {
          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
          name: 'DEPOSIT'
        }
    })).toEqual({
      product: {
        id: '68878428',
        category: {
          __type: 'com.ukrsibbank.client.protocol.product.ProductCategoryMto',
          name: 'DEPOSIT'
        }
      },
      account: {
        id: '68878428',
        type: 'deposit',
        title: 'Активні гроші',
        instrument: 'UAH',
        syncID: ['26208556574201'],
        balance: 302.71,
        startBalance: 0,
        startDate: new Date('2015-05-05T00:00:00+03:00'),
        capitalization: true,
        percent: 0.01,
        payoffStep: 1,
        payoffInterval: 'month',
        endDateOffset: 30,
        endDateOffsetInterval: 'day'
      }
    })
  })
})
