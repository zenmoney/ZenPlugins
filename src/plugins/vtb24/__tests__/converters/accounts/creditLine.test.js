import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts adjusted credit line', () => {
    const apiAccount = {
      __type: 'ru.vtb24.mobilebanking.protocol.product.LoanAccountMto',
      amount: {
        __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
        sum: 0,
        currency: {
          __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
          currencyCode: 'RUR',
          displaySymbol: '₽',
          name: 'Рубль России'
        }
      },
      archived: false,
      closeDate: new Date('Wed Feb 28 2046 00:00:00 GMT+0300'),
      contract: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto',
        account: null,
        archived: false,
        closeDate: null,
        contractPeriod: null,
        creditSum: {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 0,
          currency: {
            __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
            currencyCode: 'RUR',
            displaySymbol: '₽',
            name: 'Рубль России'
          }
        },
        details: null,
        displayName: 'Кредитная линия',
        endDate: new Date('Wed Feb 28 2046 00:00:00 GMT+0300'),
        id: '92B38AA965C84BB7A53C00F28F9AD9D5',
        issueDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
        loan: null,
        name: 'Кредитная линия',
        number: 'Кредитная линия №492321XXXXXX3634',
        openDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
        showOnMainPage: true,
        status: {
          __type: 'ru.vtb24.mobilebanking.protocol.product.ContractStatusMto',
          id: 'OPEN'
        }
      },
      details: null,
      displayName: 'Кредитная линия',
      id: '5EB0EB482E6D4CF78EF60A5D4425545F',
      lastOperationDate: null,
      name: 'Кредитная линия',
      number: '4923213012683634',
      openDate: new Date('Fri Feb 12 2016 00:00:00 GMT+0300'),
      showOnMainPage: true,
      status: {
        __type: 'ru.vtb24.mobilebanking.protocol.product.AccountStatusMto',
        id: 'OPEN'
      }
    }
    expect(convertAccount(apiAccount)).toEqual({
      products: [
        {
          id: '92B38AA965C84BB7A53C00F28F9AD9D5',
          type: 'ru.vtb24.mobilebanking.protocol.product.RevolvingCreditLineMto'
        }
      ],
      zenAccount: {
        id: '92B38AA965C84BB7A53C00F28F9AD9D5',
        type: 'checking',
        title: 'Кредитная линия',
        instrument: 'RUB',
        balance: 0,
        syncID: [
          '4923213012683634'
        ]
      }
    })
  })
})
