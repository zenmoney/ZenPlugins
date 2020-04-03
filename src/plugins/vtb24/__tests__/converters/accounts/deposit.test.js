import { convertDeposit } from '../../../converters'

describe('convertDeposit', () => {
  it('converts deposit', () => {
    expect(convertDeposit({
      __type: 'ru.vtb24.mobilebanking.protocol.product.DepositContractMto',
      number: null,
      id: '28F4CC3688744C4EBC12218F07F4B87E',
      name: 'Максимум Онлайн',
      displayName: 'Максимум Онлайн',
      showOnMainPage: false,
      archived: false,
      currency: {
        __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
        currencyCode: 'RUR',
        name: 'Рубль России',
        displaySymbol: '₽'
      },
      info: null,
      __id: 136,
      account: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.DepositAccountMto',
        interestRate: 7.06,
        number: '42306810716080000747',
        id: '8B79C035D7844F5EBC5C6B67BCA87C9C',
        name: 'Вклад',
        displayName: 'Вклад',
        showOnMainPage: true,
        archived: false,
        contract: '<ref[136]>',
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
        openDate: new Date('Fri Oct 26 2018 00:00:00 GMT+0300 (MSK)'),
        lastOperationDate: null,
        closeDate: null,
        amount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 103572.36,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            name: 'Рубль России',
            displaySymbol: '₽'
          }
        },
        details: null
      },
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
        id: 'OPEN'
      },
      openDate: new Date('Fri Oct 26 2018 00:00:00 GMT+0300 (MSK)'),
      endDate: new Date('Sun Nov 10 2019 00:00:00 GMT+0300 (MSK)'),
      closeDate: null,
      contractPeriod: {
        __type: 'ru.vtb24.mobilebanking.protocol.DurationMto',
        value: 380,
        unit: {
          __type: 'ru.vtb24.mobilebanking.protocol.DurationUnitMto',
          id: 'DAY'
        }
      },
      details: null
    })).toEqual({
      mainProduct: {
        id: '28F4CC3688744C4EBC12218F07F4B87E',
        type: 'ru.vtb24.mobilebanking.protocol.product.DepositContractMto'
      },
      products: [],
      zenAccount: {
        balance: 103572.36,
        capitalization: true,
        endDateOffset: 380,
        endDateOffsetInterval: 'day',
        id: '28F4CC3688744C4EBC12218F07F4B87E',
        instrument: 'RUB',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 7.06,
        startBalance: 0,
        startDate: new Date('2018-10-25T21:00:00.000Z'),
        syncID: [
          '42306810716080000747'
        ],
        title: 'Максимум Онлайн',
        type: 'deposit'
      }
    })
  })

  it('converts deposit without contract period', () => {
    expect(convertDeposit({
      __type: 'ru.vtb24.mobilebanking.protocol.product.DepositContractMto',
      number: '02001100506',
      id: '425BFE3BC7344CF2992DEEAED667B379',
      name: '"До востребования"',
      displayName: '"До востребования"',
      showOnMainPage: true,
      archived: false,
      currency: {
        __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
        currencyCode: 'USD',
        name: 'Доллар США',
        displaySymbol: '$'
      },
      info: null,
      __id: 43,
      account: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.DepositAccountMto',
        interestRate: 0.01,
        number: '42301840400110100320',
        id: '83791D8355D44B62A7A880E80744B1DD',
        name: 'Вклад',
        displayName: 'Вклад',
        showOnMainPage: true,
        archived: false,
        contract: '<ref[43]>',
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
        openDate: new Date('Mon Oct 17 2005 01:00:00 GMT+0400 (MSD)'),
        lastOperationDate: null,
        closeDate: null,
        amount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 84.06,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'USD',
            name: 'Доллар США',
            displaySymbol: '$'
          }
        },
        details: null
      },
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
        id: 'OPEN'
      },
      openDate: new Date('Mon Oct 17 2005 01:00:00 GMT+0400 (MSD)'),
      endDate: null,
      closeDate: null,
      contractPeriod: null,
      details: null
    })).toEqual({
      mainProduct: {
        id: '425BFE3BC7344CF2992DEEAED667B379',
        type: 'ru.vtb24.mobilebanking.protocol.product.DepositContractMto'
      },
      products: [],
      zenAccount: {
        balance: 84.06,
        capitalization: true,
        endDateOffset: 1,
        endDateOffsetInterval: 'year',
        id: '425BFE3BC7344CF2992DEEAED667B379',
        instrument: 'USD',
        payoffInterval: 'month',
        payoffStep: 1,
        percent: 0.01,
        startBalance: 0,
        startDate: new Date('2005-10-16T21:00:00.000Z'),
        syncID: [
          '42301840400110100320'
        ],
        title: '"До востребования"',
        type: 'deposit'
      }
    })
  })
})
