import { convertAccounts } from '../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accounts:
          [
            {
              id: 25596,
              number: '42301810800159560435',
              title: 'Вклад 9560435 (RUB)',
              displayTitle: 'Вклад 9560435 (RUB)',
              currencyId: 16,
              currencyIsoCode: 'rur',
              reservedBalance: '0.0',
              arestedBalance: '0.0',
              closeDate: null,
              hidden: false,
              withdraw: true,
              refund: true,
              productType: 'Products::Deposit',
              dogovType: null,
              cashback: false,
              closed: false,
              balance: '9.9',
              ownAmount: '9.9',
              creditAmount: 0,
              totalAmount: '9.9',
              creditAvail: '-0.0',
              loanAmount: '-0.0',
              cards: []
            },
            {
              id: 206329,
              number: '40817810200880004220',
              title: 'Картсчет 0004220 (RUB)',
              displayTitle: 'Картсчет 0004220 (RUB)',
              currencyId: 16,
              currencyIsoCode: 'rur',
              reservedBalance: '0.0',
              arestedBalance: '0.0',
              closeDate: null,
              hidden: false,
              withdraw: true,
              refund: true,
              productType: null,
              dogovType: 5,
              cashback: false,
              closed: false,
              balance: '21626.86',
              ownAmount: '21626.86',
              creditAmount: 0,
              totalAmount: '21626.86',
              creditAvail: '-0.0',
              loanAmount: '-0.0',
              cards:
                [
                  {
                    id: 313253,
                    accountId: 206329,
                    balance: '21626.86',
                    minimalBalance: '0.0',
                    currencyId: 16,
                    currencyIsoCode: 'rur',
                    cardholder: 'EXPRESS CARD',
                    number: '546844******2612',
                    authLimit: '78000000000000232318',
                    title: 'MasterCard Virtual 3 RUR',
                    displayTitle: 'MasterCard Virtual 3 RUR',
                    state: 'active',
                    issueAt: '2019-10-03',
                    expirationAt: '2022-10-31',
                    expiresIn: 488,
                    unaffordable: false,
                    lastOperationDate: '2021-06-25T04:28:24Z',
                    firstOperationDate: '2019-10-24T05:58:05Z',
                    blockedByDate: false,
                    hidden: false,
                    blankImageUrl: '/assets/cardblanks/mc_virtual.jpg',
                    imageUrl: '/assets/cardtypes/MC_VIRTUAL.png',
                    iconUrl: '/assets/cardicons/MC_VIRTUAL.png',
                    keychain: null,
                    svId: 636368,
                    isIbs: true,
                    cardType: { keyword: 'MC_VIRTUAL' },
                    canReissue: true,
                    canBlock: true,
                    isExpiring: false,
                    canTokenized: true,
                    canP2p: true
                  },
                  {
                    id: 313254,
                    accountId: 206329,
                    balance: '0.0',
                    minimalBalance: '0.0',
                    currencyId: 16,
                    currencyIsoCode: 'rur',
                    cardholder: null,
                    number: '40817***4220',
                    authLimit: null,
                    title: 'Свободные средства',
                    displayTitle: 'Средства не на карте',
                    state: 'pseudo',
                    issueAt: '2019-10-24',
                    expirationAt: null,
                    expiresIn: null,
                    unaffordable: false,
                    lastOperationDate: '2021-06-25T04:28:24Z',
                    firstOperationDate: '2019-10-24T05:58:05Z',
                    blockedByDate: false,
                    hidden: false,
                    blankImageUrl: '/assets/cardtypesblanks/X_AVAILABLE_FUNDS.jpg',
                    imageUrl: '/assets/cardtypes/X_AVAILABLE_FUNDS.png',
                    iconUrl: '/assets/cardicons/X_AVAILABLE_FUNDS.png',
                    keychain: null,
                    isIbs: false,
                    cardType: { keyword: 'X_AVAILABLE_FUNDS' },
                    canReissue: false,
                    canBlock: false,
                    isExpiring: true,
                    canTokenized: false,
                    canP2p: false
                  }
                ]
            }
          ],
        deposits:
          [
            {
              id: 12079,
              interestRate: '0.1',
              openingDate: '2015-05-07',
              tradeMark: '"ДО ВОСТРЕБОВАНИЯ"',
              partWithdraw: true,
              closeDate: null,
              relatedAccount: null,
              openingAmount: '10.0',
              replenishDate: null,
              prolongation: false,
              isTermDeposit: false,
              requestId: false,
              account:
                {
                  id: 25596,
                  number: '42301810800159560435',
                  title: 'Вклад 9560435 (RUB)',
                  displayTitle: 'Вклад 9560435 (RUB)',
                  currencyId: 16,
                  currencyIsoCode: 'rur',
                  reservedBalance: '0.0',
                  arestedBalance: '0.0',
                  closeDate: null,
                  hidden: false,
                  withdraw: true,
                  refund: true,
                  productType: 'Products::Deposit',
                  dogovType: null,
                  cashback: false,
                  closed: false,
                  balance: '9.9',
                  ownAmount: '9.9',
                  creditAmount: 0,
                  totalAmount: '9.9',
                  creditAvail: '-0.0',
                  loanAmount: '-0.0',
                  cards: [],
                  product: { imageUrl: '/assets/products/deposit.png' }
                },
              closingDate: null,
              closed: false,
              balanceWithInterest: '9.9'
            }
          ],
        revolverCredits: [],
        singleCredits: []
      },
      [
        {
          id: '25596',
          type: 'deposit',
          title: 'Вклад 9560435 (RUB)',
          balance: 9.9,
          capitalization: true,
          creditLimit: 0,
          endDateOffset: 36500,
          endDateOffsetInterval: 'day',
          instrument: 'RUB',
          payoffInterval: 'month',
          payoffStep: 1,
          percent: 0.1,
          startDate: new Date('2015-05-07T00:00:00+00:00'),
          syncIds: [
            '42301810800159560435'
          ]
        },
        {
          id: '206329',
          type: 'ccard',
          title: 'Картсчет 0004220 (RUB)',
          balance: 21626.86,
          creditLimit: 0,
          instrument: 'RUB',
          syncIds: [
            '40817810200880004220',
            '546844******2612'
          ]
        }
      ]
    ]
  ])('converts current account', (apiAccount, accounts) => {
    expect(convertAccounts(apiAccount)).toEqual(accounts)
  })
})
