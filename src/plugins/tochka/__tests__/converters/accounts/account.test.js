import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('converts account', () => {
    expect(convertAccount({
      code: '40702810101280000000',
      bank_code: '044525999'
    })).toEqual({
      id: '40702810101280000000',
      type: 'checking',
      title: '40702810101280000000',
      instrument: 'RUB',
      syncID: ['40702810101280000000']
    })
  })
})
