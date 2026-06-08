import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('should convert checking account', () => {
    const account = convertAccount({
      accountNumber: 'mock-iban-001',
      accountStatus: 'OPEN',
      accountType: '1',
      agreementDate: 1589811000000,
      availableAmount: 10.0,
      bankCode: '288',
      canClose: false,
      canCloseOtherCurrency: false,
      canCloseSameCurrency: false,
      canRefill: false,
      canRefillOtherCurrency: false,
      canRefillSameCurrency: false,
      canSell: false,
      cardAccountNumber: 'mock-account-001',
      cards: [
        {
          canChange3D: true,
          canChangeSmsNotification: true,
          cardDepartmentAddress: 'г. Тестовый город;ул. Тестовая 1',
          cardHash: 'mock-card-hash-001',
          cardNumberMasked: '4*** **** **** 1111',
          cardStatus: 'OPEN',
          cardType: {
            imageUri: 'https://alseda.by/media/public/Rbank_visa_classic_virtual.png',
            name: 'VISA Virtual',
            paySysImageUri: 'https://alseda.by/media/public/icVisa.png',
            paySystemName: 'VISA',
            textColor: 'ffffffff',
            value: 14
          },
          currency: '933',
          expireDate: 1622405500000,
          numberDaysBeforeCardExpiry: 372,
          owner: 'PUPKIN VASILY',
          payment: '0',
          retailCardId: 88990011,
          tariffName: 'Visa Virtual',
          virtual: true
        }
      ],
      contractId: '88990011',
      currency: '933',
      ibanNum: 'mock-iban-001',
      interestRate: 1e-06,
      internalAccountId: 'mock-account-001',
      openDate: 1589811000000,
      percentsLeft: '0.0000010',
      productCode: '300750',
      productName: 'Visa Virtual',
      rkcCode: '701',
      rkcName: 'Тестовое отделение',
      balance: '10,1'
    })

    expect(account).toEqual({
      id: 'mock-account-001-88990011',
      title: 'Visa Virtual*1111',
      type: 'card',
      instrument: 'BYN',
      instrumentCode: '933',
      balance: 10.1,
      syncID: ['88990011', '1111'],
      productType: 'Visa Virtual',
      cardHash: 'mock-card-hash-001',
      cardLast4: '1111',
      internalAccountId: 'mock-account-001',
      cardAccountNumber: 'mock-account-001',
      bankCode: '288',
      accountType: '1',
      rkcCode: '701'
    })
  })
})
