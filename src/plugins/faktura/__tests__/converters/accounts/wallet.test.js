/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/wallet'
import { entity } from '../../../zenmoney_entity/account'

describe('wallet converter', () => {
  it('should return zenmoney account object', () => {
    const account = converter({
      id: 12345,
      name: 'Super wallet',
      currencyCode: 'RUR',
      amount: '123',
      ean: 12345678
    })

    expect(account).toEqual(Object.assign({}, entity(), {
      id: 'w-12345',
      title: 'Super wallet',
      type: 'checking',
      instrument: 'RUB',
      balance: 123,
      syncID: [
        '12345678'
      ]
    }))
  })
})
