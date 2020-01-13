import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        'accountNumber': '40817810190640141234',
        'availableBalance': 2315.25,
        'cardMBR': 0,
        'cardRole': 'PRIMARY',
        'cardStatusDisplayed': 'ACTIVE',
        'contractBillingDay': '2018-12-01',
        'contractNumber': '7307250278',
        'contractStatus': 'Active',
        'currency': 'RUR',
        'displayOrder': 1,
        'expiration': '2023-12-31',
        'isArrestedAccount': false,
        'isPinGenerated': true,
        'isPlasticActivationAvailable': false,
        'isResident': true,
        'isRestrictedBalance': false,
        'isSalaryCard': false,
        'loyaltyHash': 'bca43653222771e9c492d1602e233b9423b2d0af',
        'maskCardNumber': '559654XXXXXX4567',
        'paymentSystem': 'MASTERCARD',
        'productId': 1124,
        'productName': 'Карта Польза',
        'productType': 'DebitCard'
      },
      {
        account: {
          'balance': 2315.25,
          'id': '7307250278',
          'instrument': 'RUB',
          'syncID': ['1234', '4567'],
          'title': 'Карта Польза',
          'type': 'ccard'
        },
        details: {
          'accountNumber': '40817810190640141234',
          'cardNumber': '559654XXXXXX4567',
          'contractNumber': '7307250278',
          'title': 'Карта Польза',
          'type': 'debitCards'
        }
      }
    ]
  ])('converts debitCards #1 account', (apiAccounts, accounts) => {
    expect(convertAccount(apiAccounts, 'debitCards')).toEqual(accounts) // v2 MyCredit
  })
})
