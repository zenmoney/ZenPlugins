import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('should convert checking account', () => {
    const account = convertAccount({
      accountNumber: 'BY11RSHN10111010100110000000',
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
      cardAccountNumber: '00750933012345',
      cards: [
        {
          canChange3D: true,
          canChangeSmsNotification: true,
          cardDepartmentAddress: 'г. Минск;ул. Сторожевская 8',
          cardHash: 'h5jaI5li6snrBC2lkrLIEnCzS§l0aNIj5PaRLx6C0OGaBofDbE6_v1KfVbK4iNxT1W2RkcRrrEcLVmhDGd3jew',
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
      ibanNum: 'BY11RSHN10111010100110000000',
      interestRate: 1e-06,
      internalAccountId: '00750933012345',
      openDate: 1589811000000,
      percentsLeft: '0.0000010',
      productCode: '300750',
      productName: 'Visa Virtual',
      rkcCode: '701',
      rkcName: 'ЦБУ 07/01 г.Минск, ЗАО "Банк "Решение"',
      balance: 10.0
    })

    expect(account).toEqual({
      id: '00750933012345',
      title: 'Visa Virtual*1111',
      type: 'card',
      instrument: 'BYN',
      instrumentCode: '933',
      balance: 10.0,
      syncID: ['1111'],
      productType: 'Visa Virtual',
      cardHash: 'h5jaI5li6snrBC2lkrLIEnCzS§l0aNIj5PaRLx6C0OGaBofDbE6_v1KfVbK4iNxT1W2RkcRrrEcLVmhDGd3jew',
      bankCode: '288',
      accountType: '1',
      rkcCode: '701'
    })
  })
})
