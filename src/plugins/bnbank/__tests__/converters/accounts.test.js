import { convertAccount, convertCard, convertDeposit } from '../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
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
      },
      {
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
      }
    ],
    [
      {
        internalAccountId: '3001779330085555',
        currency: '933',
        agreementDate: 1654549200000,
        openDate: 1654549200000,
        accountNumber: 'BY07BLNB30140000009100005933',
        cardAccountNumber: 'BY13BLNB30143001779330085555',
        productCode: '300177',
        productName: 'Цифровая карта 1-2-3, BYN',
        availableAmount: 183.36,
        contractId: '53343871',
        interestRate: 0.000001,
        accountStatus: 'OPEN',
        cards:
          [
            {
              cardNumberMasked: '5*** **** **** 6789',
              cardHash: 'aqnytX6wrixe76-CvJlnpPWOtilM4UryO-MmvcsMykxrQaMH46Yvt1dE0FixgRu9AFGAI4j_GstJa1bZGwMOGw',
              cardType:
              {
                value: 1722,
                name: 'DigitalCard MC 1-2-3 BYN 300177',
                imageUri: 'https://mb.bnb.by/images/products/3009008169304766.png',
                paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                textColor: 'ffffffff',
                paySystemName: 'MasterCard'
              },
              cardStatus: 'OPEN',
              expireDate: 1748638800000,
              owner: 'IVAN IVANOV',
              tariffName: 'DigitalCard MC 1-2-3 BYN 300177',
              canActivateSmsNotification: true,
              processing: '2',
              balance: 952.93,
              payment: '1',
              currency: '933',
              status: { code: '00' },
              numberDaysBeforeCardExpiry: 1058,
              canChange3D: true,
              cardDepartmentName: 'Картцентр OAO"БНБ-БАНК"',
              cardDepartmentAddress: 'г. Минск;пр. Независимости 87А',
              retailCardId: 52856081,
              virtual: true
            },
            {
              cardNumberMasked: '5*** **** **** 1234',
              cardHash: '5DpgvhmrpBnW0imrsS3vljrQgcl9HBzFA67N3e498wooiciUTrBwF7Fgb97uwjbIigIm-i5-oNT8djMaUx1uRQ',
              cardType:
                {
                  value: 2241,
                  name: 'MasterCard 1-2-3 BYN',
                  imageUri: 'https://mb.bnb.by/images/products/9113363778490967.jpg',
                  paySysImageUri: 'https://alseda.by/media/public/credit_card_str_mastercard.png',
                  textColor: 'ffffffff',
                  paySystemName: 'MasterCard'
                },
              cardStatus: 'OPEN',
              expireDate: 1751230800000,
              owner: 'IVAN IVANOV',
              tariffName: 'MasterCard 1-2-3 BYN',
              canActivateSmsNotification: true,
              processing: '2',
              balance: 952.93,
              currency: '933',
              status: { code: '00' },
              numberDaysBeforeCardExpiry: 1088,
              additionalCardType: 2,
              canChange3D: true,
              cardDepartmentName: 'УРМ Грин Сити',
              cardDepartmentAddress: 'г. Минск;ул. Притыцкого 156',
              retailCardId: 53343990,
              virtual: false
            }
          ],
        bankCode: '288',
        rkcCode: '5761',
        rkcName: 'Картцентр OAO"БНБ-БАНК"',
        percentsLeft: '0.0000010',
        accountType: '1',
        ibanNum: 'BY13BLNB30143001779330085555',
        url: 'https://mb.bnb.by/images/products/1045118114341777.png',
        canCloseSameCurrency: false,
        canCloseOtherCurrency: false,
        canClose: false,
        canRefillSameCurrency: false,
        canRefillOtherCurrency: false,
        canRefill: false,
        affiliateSoftClub: false
      },
      {
        balance: 952.93,
        cardHash: 'aqnytX6wrixe76-CvJlnpPWOtilM4UryO-MmvcsMykxrQaMH46Yvt1dE0FixgRu9AFGAI4j_GstJa1bZGwMOGw',
        currencyCode: '933',
        id: '3001779330085555',
        instrument: 'BYN',
        rkcCode: '5761',
        syncID: [
          '3001779330085555',
          '6789',
          '1234'
        ],
        title: 'Цифровая карта 1-2-3, BYN',
        type: 'card'
      }
    ]
  ])('card accounts', (apiAccount, account) => {
    expect(convertCard(apiAccount)).toEqual(account)
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
      endDateOffset: 182,
      endDateOffsetInterval: 'day',
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
