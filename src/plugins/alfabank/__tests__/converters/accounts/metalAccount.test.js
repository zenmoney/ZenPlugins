import { toZenmoneyAccount, GRAMS_IN_OZ } from '../../../converters'

describe('toZenmoneyAccount', () => {
  it.each([
    [
      {
        number: '20309A98008850000010',
        description: 'Счёт в драг. металлах',
        amount: '5.00',
        currencyCode: 'A98',
        actions: {
          isAvailableForRename: true,
          isAvailableForWithdrowal: true,
          isMoneyBoxEdit: false
        },
        filters: [{
          operation: 'accounts',
          title: 'Счета',
          color: '#F03226',
          filterList: [{
            name: 'Счёт в дра.. A98 ··0010',
            value: '20309A98008850000010'
          }]
        }]
      },
      {
        'type': 'checking',
        'title': 'Счёт в драг. металлах',
        'id': 'ima:20309A98008850000010',
        'syncID': [
          '203093698008850000010'
        ],
        'instrument': 'XAU',
        'balance': 5 / GRAMS_IN_OZ
      }
    ]
  ])('converts metal account', (apiAccount, account) => {
    expect(toZenmoneyAccount(apiAccount)).toEqual(account)
  })
})
