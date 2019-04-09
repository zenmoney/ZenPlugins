import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('should convert checking account', () => {
    const account = convertAccount({
      balance: '99.90',
      blocking: '',
      blockingCode: '',
      blockingText: '',
      cardClass: 'type-logo_belcaed-maestro',
      cardClassColor: '_type_blue',
      cardHolder: 'IVAN PUPKIN',
      cardImage: '/core/assets/redesign3/images/cardsLogo/belcard_mini2.svg',
      cardName: '',
      cardsKey: 30848200,
      commonId: 'ownBankCards_30848200',
      corporative: 0,
      currency: 'BYN',
      expdate: 1711832400,
      finalName: 'Безымянная',
      fixedBalance: 0,
      id: '30848200',
      international: 0,
      internet: 1,
      isBelcard: 0,
      isCredit: 0,
      isCurrent: true,
      isDBO: 0,
      isGroupPackage: '0',
      isProlongable: 0,
      isReplaceable: 1,
      isSendPinAllowed: 1,
      isVirtual: '0',
      num: '**** 1111',
      packageName: '',
      pimpText: '',
      status3D: 0,
      statusLimits: 0,
      statusPimp: 0,
      subTitle: '',
      type: 'БЕЛКАРТ-Maestro'
    })

    expect(account).toEqual({
      id: '30848200',
      type: 'card',
      title: 'Безымянная*1111',
      instrument: 'BYN',
      balance: 99.9,
      syncID: ['1111']
    })
  })
})
