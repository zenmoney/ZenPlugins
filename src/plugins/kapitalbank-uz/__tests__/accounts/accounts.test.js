import {
  convertAccount
} from '../../converters'

describe('convertAccount', () => {
  it('converts account RUB', () => {
    expect(convertAccount({
      guid: 'AP-362f9635-0000-0000-0000-e38081bc901c',
      accountNumber: '20200000000000002001',
      maskedNumber: '**** 2001',
      accountName: null,
      accountHolderName: 'LASTNAME FIRSTNAME MIDDLENAME',
      accountType: 'CHECKING',
      productCode: 'ACRUKBMPXX',
      currency: {
        name: 'RUB',
        scale: 2
      },
      isFavourite: false,
      orderFavourite: null,
      balance: 252208
    })).toEqual({
      id: 'AP-362f9635-0000-0000-0000-e38081bc901c',
      type: 'checking',
      title: 'Счёт RUB *901c',
      instrument: 'RUB',
      syncIds: [
        '20200000000000002001'
      ],
      balance: 2522.08
    })
  })
})
