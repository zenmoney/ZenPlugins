import { convertCard, convertDeposit, convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('card account', () => {
    const account = convertCard({
      accountNumber: 'BY41BLNB30000000000000000933',
      accountStatus: 'OPEN',
      accountType: '1',
      agreementDate: 1458853200000,
      availableAmount: 108.84,
      bankCode: '288',
      canClose: false,
      canCloseOtherCurrency: false,
      canCloseSameCurrency: false,
      canRefill: false,
      canRefillOtherCurrency: false,
      canRefillSameCurrency: false,
      canSell: false,
      cardAccountNumber: '765754000000',
      cards: [
        {
          additionalCardType: 2,
          balance: 7.4,
          canChange3D: true,
          cardDepartmentAddress: 'г. Минск;пр. Дзержинского 104',
          cardHash: '4feuL_a5l1A0nOffbenDdrrv14VyBN2YY1PeYsU8d2c5ZSpRKcZoj-fdk473d-TVBvIYmbwzA2l7Dv6aT1eSg6',
          cardNumberMasked: '4*** **** **** 0000',
          cardStatus: 'OPEN',
          cardType: {},
          currency: '933',
          expireDate: 1585602000000,
          numberDaysBeforeCardExpiry: 367,
          owner: 'Vasia Pupkin',
          payment: '0',
          retailCardId: 19221000,
          status: { code: '00' },
          tariffName: '754 Visa Gold (EMV)'
        }],
      contractId: '1860000',
      currency: '933',
      ibanNum: 'BY92BLNB30142007549330000248',
      interestRate: 2.5,
      internalAccountId: '2007549330000000',
      openDate: 1458853200000,
      percentsLeft: '2.5',
      productCode: '200000',
      productName: 'Личные, BYN - "Maxima Plus"',
      rkcCode: '004',
      rkcName: 'ЦБУ №4 г.Минск',
      url: 'https://alseda.by/media/public/orange_dream.jpg'
    })

    expect(account).toEqual({
      id: '2007549330000000',
      type: 'card',
      title: 'Личные, BYN - "Maxima Plus"',
      instrument: 'BYN',
      balance: 7.4,
      currencyCode: '933',
      rkcCode: '004',
      syncID: [
        '2007549330000000',
        '0000'
      ],
      cardHash: '4feuL_a5l1A0nOffbenDdrrv14VyBN2YY1PeYsU8d2c5ZSpRKcZoj-fdk473d-TVBvIYmbwzA2l7Dv6aT1eSg6'
    })
  })

  it('card deposit', () => {
    const account = convertDeposit({
      accountNumber: 'BY89BLNB30000000000000000840',
      accountStatus: 'OPEN',
      accountType: '0',
      balanceAmount: 865.23,
      bankCode: '288',
      bare: false,
      canClose: true,
      canCloseOtherCurrency: false,
      canCloseSameCurrency: true,
      canRefill: true,
      canRefillOtherCurrency: true,
      canRefillSameCurrency: false,
      canSell: false,
      contractId: '22092000',
      currency: '840',
      endDate: 1560459600000,
      ibanNum: 'BY37BLNB34141100000000000043',
      interestRate: 2.25,
      internalAccountId: '1100600000000000',
      openDate: 1544734800000,
      plannedEndDate: 1560459600000,
      productCode: '10062',
      productName: 'Верное решение',
      rkcCode: '765',
      rkcName: 'Белорусский народный банк',
      url: 'https://alseda.by/media/public/deposit_vernoe_reshenie.png'
    })

    expect(account).toEqual({
      id: '1100600000000000',
      type: 'deposit',
      title: 'Депозит Верное решение',
      instrument: 'USD',
      balance: 865.23,
      capitalization: true,
      currencyCode: '840',
      endDateOffset: 1560459600,
      endDateOffsetInterval: 'month',
      payoffInterval: 'month',
      payoffStep: 1,
      percent: 2.25,
      rkcCode: '765',
      startDate: new Date('2018-12-13T21:00:00.000Z'),
      syncID: ['1100600000000000']
    })
  })

  it('unknown account', () => {
    const account = convertAccount({})

    expect(account).toEqual(null)
  })

  it('card without cards', () => {
    const account = convertCard({})

    expect(account).toEqual(null)
  })
})
