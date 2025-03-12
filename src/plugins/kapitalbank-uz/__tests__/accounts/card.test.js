import {
  convertCard
} from '../../converters'

describe('converCard', () => {
  it('converts VISA card without cardName', () => {
    expect(convertCard({
      guid: 'CP-2ab15c0d-0000-0000-0000-863c1c2a06a3',
      bankId: '09049',
      isMain: false,
      coverId: 'VISA_09049_002',
      cardName: null,
      productId: '002',
      maskedPan: '427832******0001',
      cardType: 'PHYSICAL',
      productCode: 'VSUSKBMPXX',
      isInternal: true,
      isFavourite: true,
      currency: {
        name: 'USD',
        scale: 2
      },
      cardOwnerName: 'FIRSTNAME LASTNAME',
      orderFavourite: 1,
      processingType: 'VISA',
      isNewRegistered: false
    })).toEqual({
      id: 'CP-2ab15c0d-0000-0000-0000-863c1c2a06a3',
      type: 'ccard',
      title: 'VISA *0001',
      instrument: 'USD',
      syncIds: [
        '427832******0001'
      ]
    })
  })

  it('converts HUMO card with cardName', () => {
    expect(convertCard({
      guid: 'CP-42e7c669-0000-0000-0000-ef3445e40682',
      bankId: '09049',
      isMain: false,
      coverId: 'HUMO_09049_8888',
      cardName: 'KS Humo',
      productId: '8888',
      maskedPan: '986010******9424',
      cardType: 'PHYSICAL',
      productCode: 'HMUZKBMPXX',
      isInternal: true,
      isFavourite: true,
      currency: {
        name: 'UZS',
        scale: 2
      },
      cardOwnerName: 'FIRSTNAME LASTNAME',
      orderFavourite: 1,
      processingType: 'HUMO',
      isNewRegistered: false
    })).toEqual({
      id: 'CP-42e7c669-0000-0000-0000-ef3445e40682',
      type: 'ccard',
      title: 'KS Humo',
      instrument: 'UZS',
      syncIds: [
        '986010******9424'
      ]
    })
  })
})
