import { convertAccounts } from '../../../converters'

const minimalApiAccount = {
  clientObject: {
    id: 1,
    cardContractNumber: '1234',
    cardMaskedNumber: 'XXXX1234',
    currIso: 'BYN',
    customSynonym: 'My card',
    defaultSynonym: 'My card'
  },
  balance: { available: 100 }
}

describe('convertAccounts guard — non-array apiAccountDetails', () => {
  it('returns empty array when apiAccountDetails is null', () => {
    expect(convertAccounts([minimalApiAccount], null)).toEqual([])
  })

  it('returns empty array when apiAccountDetails is undefined', () => {
    expect(convertAccounts([minimalApiAccount], undefined)).toEqual([])
  })

  it('returns empty array when apiAccountDetails is an object (not an array)', () => {
    expect(convertAccounts([minimalApiAccount], {})).toEqual([])
  })
})
