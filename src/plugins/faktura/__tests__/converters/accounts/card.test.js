/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import { converter } from '../../../converters/card'
import { entity } from '../../../zenmoney_entity/account'

describe('card converter', () => {
  it('should return zenmoney account object', () => {
    const accountData = {
      id: 12345,
      name: 'Super card',
      contractId: 1,
      equities: [
        {
          type: 'OTHER',
          currencyCode: 'USD',
          amount: 456
        },
        {
          type: 'FUNDS',
          currencyCode: 'RUR',
          amount: '123.66'
        }
      ],
      ean: 12345678,
      panTail: '0987'
    }

    const creditData = [
      {
        contractId: 1,
        grantedAmount: 200
      }
    ]

    expect(converter(accountData, [])).toEqual(Object.assign({}, entity(), {
      id: 'c-12345',
      title: 'Super card',
      type: 'ccard',
      instrument: 'RUB',
      balance: 123.66,
      syncID: [
        '12345678',
        '0987'
      ]
    }))
    expect(converter(accountData, creditData)).toEqual(Object.assign({}, entity(), {
      id: 'c-12345',
      title: 'Super card',
      type: 'ccard',
      instrument: 'RUB',
      balance: -76.34,
      creditLimit: 200,
      syncID: [
        '12345678',
        '0987'
      ]
    }))
  })

  it('should return zenmoney account object when funds equity is missing', () => {
    const accountData = {
      id: 236465,
      ean: '2960021593517',
      contractId: 141083,
      isRechargeable: true,
      equities:
        [
          { amount: '0', currencyCode: 'BNS', type: 'BNS' },
          { amount: '0', currencyCode: 'BNS', type: 'BNS_AVAILABLE' },
          { amount: '0', currencyCode: 'BNS', type: 'BNS_DELAY' },
          {
            amount: '0',
            currencyCode: 'RUR',
            type: 'CREDIT_LIMIT_AMOUNT_REMAINING'
          },
          {
            amount: '0',
            currencyCode: 'RUR',
            type: 'OWN_AMOUNT_REMAINING'
          },
          { amount: '0', currencyCode: 'BNS', type: 'BNS_DEBT' },
          {
            amount: '92.7',
            currencyCode: 'RUR',
            type: 'UNPROCESSED_AMOUNT'
          }
        ],
      bankInfo:
        {
          bic: '<string[9]>',
          corrAccNum: '<string[20]>',
          accNum: '<string[20]>',
          ownerName: '<string[44]>',
          inn: '<string[10]>',
          kpp: '<string[9]>',
          payee: '<string[28]>',
          purpose: '<string[135]>'
        },
      panTail: '5190',
      cardType: 'DEFAULT',
      plasticType: 'MU04',
      phone: '<string[11]>',
      isBlocked: false,
      isExpired: true,
      expirationDate: '09/13',
      name: 'Карта Standard',
      paypassOrderStatus: 'NOT_ISSUED',
      hasBoundedFunctional: false,
      isHidden: false,
      isDefault: false,
      pyramidStatus: 'FORBIDDEN',
      isPyramidPilot: true
    }

    expect(converter(accountData, [])).toEqual(Object.assign({}, entity(), {
      id: 'c-236465',
      type: 'ccard',
      title: 'Карта Standard',
      instrument: 'RUB',
      syncID: ['2960021593517', '5190'],
      balance: 0,
      creditLimit: 0
    }))
  })
})
