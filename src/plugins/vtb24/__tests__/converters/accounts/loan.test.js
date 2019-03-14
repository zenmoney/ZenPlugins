import { convertLoan } from '../../../converters'

describe('convertLoan', () => {
  it('converts loan', () => {
    expect(convertLoan({
      __type: 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto',
      number: '634/5010-0004540',
      id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
      name: 'Ипотека',
      displayName: 'Ипотека',
      showOnMainPage: true,
      archived: false,
      issueDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
      creditSum: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 1608000,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          name: 'Рубль России',
          displaySymbol: '₽'
        }
      },
      loan: null,
      account: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto',
        number: '634/5010-0004540',
        id: 'E7DCC89E89EC47DDA57EB2925D2ECCC1',
        name: 'Ипотека',
        displayName: 'Ипотека',
        showOnMainPage: true,
        archived: false,
        contract: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto',
          number: '634/5010-0004540',
          id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
          name: 'Ипотека',
          displayName: 'Ипотека',
          showOnMainPage: true,
          archived: false,
          issueDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
          creditSum: null,
          loan: null,
          account: null,
          status: {
            __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
            id: 'OPEN'
          },
          openDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
          endDate: new Date('Thu Oct 07 2032 00:00:00 GMT+0300'),
          closeDate: null,
          contractPeriod: {
            __type: 'ru.vtb24.mobilebanking.protocol.DurationMto',
            value: 182,
            unit: {
              __type: 'ru.vtb24.mobilebanking.protocol.DurationUnitMto',
              id: 'MONTH'
            }
          },
          details: null
        },
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
          id: 'OPEN'
        },
        openDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
        lastOperationDate: null,
        closeDate: null,
        amount: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 1556772.29,
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
      openDate: new Date('Mon Aug 07 2017 00:00:00 GMT+0300'),
      endDate: new Date('Thu Oct 07 2032 00:00:00 GMT+0300'),
      closeDate: null,
      contractPeriod: null,
      details: null
    })).toEqual({
      id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
      type: 'ru.vtb24.mobilebanking.protocol.product.LoanContractMto',
      zenAccount: {
        id: '5D1AB7F045F24C8F823CB785CFDC4ADE',
        type: 'loan',
        title: 'Ипотека',
        instrument: 'RUB',
        startDate: new Date('2017-08-07T00:00:00+03:00'),
        startBalance: 1608000,
        balance: -1556772.29,
        percent: 1,
        capitalization: true,
        endDateOffsetInterval: 'month',
        endDateOffset: 182,
        payoffInterval: 'month',
        payoffStep: 1,
        syncID: [
          '63450100004540'
        ]
      }
    })
  })
})
