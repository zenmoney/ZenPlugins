import { convertCards } from '../../../converters'
import * as data from './_data'

describe('convertCards', () => {
  it('convert cards', () => {
    expect(convertCards(data.apiCards)).toEqual([{
      id: '1234xxxxxxxx5678',
      title: 'Карта USD',
      type: 'ccard',
      instrument: 'USD',
      balance: 50,
      startBalance: 0,
      creditLimit: 0,
      savings: false,
      syncID: ['5678']
    }])
  })
})
