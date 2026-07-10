import moment from 'moment'
import { parseAccountInfo, parseCards, parseCardTurnover, parseEnvironment, parseReservedFunds, parseTransactions } from '../../parsers'

describe('parseEnvironment', () => {
  it('extracts request token and authentication state after login', () => {
    const body = {
      d: {
        User: {
          PrincipalID: 100001,
          RequestToken: '6a7786b0638f41a68cbdfa54f266a0a1',
          IsAuthenticated: true,
          AuthenticationType: 'UsernameOTP'
        }
      }
    }

    expect(parseEnvironment(body)).toEqual({
      requestToken: '6a7786b0638f41a68cbdfa54f266a0a1',
      isAuthenticated: true,
      authenticationType: 'UsernameOTP',
      principalId: 100001
    })
  })

  it('tolerates null fields before login', () => {
    const body = {
      d: {
        User: {
          PrincipalID: 0,
          RequestToken: '1fb97f8368614581b1690987eebbaf7d',
          IsAuthenticated: true,
          AuthenticationType: null
        }
      }
    }

    expect(parseEnvironment(body)).toEqual({
      requestToken: '1fb97f8368614581b1690987eebbaf7d',
      isAuthenticated: true,
      authenticationType: '',
      principalId: 0
    })
  })
})

describe('parseAccountInfo', () => {
  it('parses the account balance grid', () => {
    const body = [
      ['', 'Tekući račun bez red. priliva', 'PUB-RT-8', '191957.92', '0', 'effective', '190000100000000001', '191958.92', 'RSD', '', '0', '', '', '', '0', 'RS35190000100000000001', 'Tekući račun bez red. priliva', '-3919', '23.06.2026 00:00:00', '01.01.0001 00:00:00', ''],
      ['', 'Devizni račun rezidenti', 'PUB-RT-301', '0', '0', 'effective', '190003100000000002', '0.00', 'USD', '', '0', '', '', '', '0', 'RS35190003100000000002', 'Devizni račun rezidenti', '10700', '15.12.2025 00:00:00', '01.01.0001 00:00:00', ''],
      ['', 'Devizni račun rezidenti', 'PUB-RT-301', '0', '0', 'effective', '190003100000000002', '0.00', 'EUR', '', '0', '', '', '', '0', 'RS35190003100000000002', 'Devizni račun rezidenti', '-205.6', '24.02.2026 00:00:00', '01.01.0001 00:00:00', '']
    ]

    expect(parseAccountInfo(body)).toEqual([
      {
        id: '190000100000000001',
        cardNumber: '',
        accountNumber: '190000100000000001',
        productCoreID: 'PUB-RT-8',
        name: 'Tekući račun bez red. priliva',
        currency: 'RSD',
        balance: 191957.92
      },
      {
        id: '190003100000000002USD',
        cardNumber: '',
        accountNumber: '190003100000000002',
        productCoreID: 'PUB-RT-301',
        name: 'Devizni račun rezidenti',
        currency: 'USD',
        balance: 0
      },
      {
        id: '190003100000000002EUR',
        cardNumber: '',
        accountNumber: '190003100000000002',
        productCoreID: 'PUB-RT-301',
        name: 'Devizni račun rezidenti',
        currency: 'EUR',
        balance: 0
      }
    ])
  })
})

describe('parseTransactions', () => {
  const fromDate = new Date('2026-05-23T00:00:00')

  function txRow (fields: {
    dc: string
    date: string
    id: string
    text: string
    amount: string
    currency: string
    type: string
  }): string[] {
    const row = new Array<string>(65).fill('')
    row[5] = fields.dc
    row[7] = fields.date
    row[10] = fields.id
    row[15] = fields.text
    row[27] = fields.amount
    row[30] = fields.currency
    row[64] = fields.type
    return row
  }

  it('returns empty array for empty turnover', () => {
    expect(parseTransactions([[['', '', ''], []]], fromDate)).toEqual([])
    expect(parseTransactions([], fromDate)).toEqual([])
  })

  it('parses non-card account operations and skips card (crd) rows', () => {
    const body = [[
      ['', '', ''],
      [
        txRow({ dc: 'c', date: '15.06.2026 12:35:36', id: '77700000000001', text: 'Uplata sa racuna PR BEOGRAD', amount: '150000.00', currency: 'RSD', type: 'pmt' }),
        txRow({ dc: 'd', date: '15.06.2026 12:45:11', id: '77700000000002', text: 'Uplata po računu za el. energiju', amount: '3674.01', currency: 'RSD', type: 'pmt' }),
        txRow({ dc: 'd', date: '31.05.2026 10:28:26', id: '77700000000003', text: 'Mesecni obracun naknada za TR', amount: '330.00', currency: 'RSD', type: 'brn' }),
        // Card row must be skipped (fetched from card turnover instead).
        txRow({ dc: 'd', date: '22.06.2026 15:39:37', id: '77718092174001', text: 'Kartica: GLOBALTEL                   BE', amount: '335.00', currency: 'RSD', type: 'crd' })
      ]
    ]]

    expect(parseTransactions(body, fromDate)).toEqual([
      {
        id: 'id_77700000000001',
        date: moment('15.06.2026 12:35:36', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'Uplata sa racuna PR BEOGRAD',
        amount: 150000,
        currency: 'RSD',
        description: ''
      },
      {
        id: 'id_77700000000002',
        date: moment('15.06.2026 12:45:11', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'Uplata po računu za el. energiju',
        amount: -3674.01,
        currency: 'RSD',
        description: ''
      },
      {
        id: 'id_77700000000003',
        date: moment('31.05.2026 10:28:26', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'Mesecni obracun naknada za TR',
        amount: -330,
        currency: 'RSD',
        description: ''
      }
    ])
  })
})

describe('parseCards', () => {
  it('parses the card list with domestic and linked foreign currencies', () => {
    const body = [
      // VISA: domestic RSD + linked deviza EUR (index 22).
      ['', '4242********0001', 'NAME SURNAME', '94130', '0x1111111111111111111111111111AAAA', 'VISA', 'debit-card', 'True', '', '31.01.2029 00:00:00', '0060100341657', '190000100000000003', 'RSD', '0', '601', '77289.36', '', '', '', '0.00', 'RS35190003100000000003', '0', 'EUR', 'Tekući račun', 'Devizni račun'],
      // DINA: domestic RSD only (index 22 empty).
      ['', '9891********0002', 'NAME SURNAME', '94130', '0x2222222222222222222222222222BBBB', 'DINA CARD', 'debit-card', 'True', 'valid', '31.01.2029 00:00:00', '0061100410183', '190000100000000003', 'RSD', '0', '611', '77289.36', '', '', '', '', '', '', '', 'Tekući račun', '']
    ]

    expect(parseCards(body)).toEqual([
      { primaryCardID: '0x1111111111111111111111111111AAAA', accountNumber: '190000100000000003', currency: 'RSD', turnoverCurrencies: ['RSD', 'EUR'] },
      { primaryCardID: '0x2222222222222222222222222222BBBB', accountNumber: '190000100000000003', currency: 'RSD', turnoverCurrencies: ['RSD'] }
    ])
  })
})

describe('parseCardTurnover', () => {
  const fromDate = new Date('2026-05-18T00:00:00')

  function cardRow (fields: {
    debit: string
    credit: string
    originalCurrency: string
    reference: string
    description: string
    transactionDate: string
    domesticAmount: string
    accountCurrency: string
  }): string[] {
    const row = new Array<string>(29).fill('0')
    row[9] = fields.debit
    row[10] = fields.credit
    row[11] = fields.originalCurrency
    row[14] = fields.reference
    row[17] = fields.description
    row[24] = fields.transactionDate
    row[25] = fields.domesticAmount
    row[28] = fields.accountCurrency
    return row
  }

  it('parses domestic spend, refund and foreign purchase with real date', () => {
    const body = [[
      ['', '', ''],
      [
        cardRow({ debit: '2380.00', credit: '0', originalCurrency: 'RSD', reference: 'CC-10000001E', description: 'Visa Electron potrošnja - POS druge banke u zemlji Wallet: STUDIO3 - B6                BEOGRAD', transactionDate: '18.06.2026 00:00:00', domesticAmount: '2380.00', accountCurrency: 'RSD' }),
        cardRow({ debit: '0', credit: '208.99', originalCurrency: 'RSD', reference: 'CC-10000002E', description: 'Dina POS druge banke tax free: DELHAIZE SERBIA DOO BE      BEOGRAD', transactionDate: '20.06.2026 00:00:00', domesticAmount: '208.99', accountCurrency: 'RSD' }),
        cardRow({ debit: '42.47', credit: '0', originalCurrency: 'EUR', reference: 'CC-10000003E', description: 'Visa Electron potrošnja - POS druge banke INO Wallet: Shell Yverdon               Yverdon-les-B', transactionDate: '03.06.2026 00:00:00', domesticAmount: '4985.39', accountCurrency: 'RSD' })
      ]
    ]]

    expect(parseCardTurnover(body, fromDate)).toEqual([
      {
        id: 'id_CC-10000001E',
        date: moment('18.06.2026 00:00:00', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'STUDIO3 - B6 BEOGRAD',
        amount: -2380,
        currency: 'RSD',
        description: ''
      },
      {
        id: 'id_CC-10000002E',
        date: moment('20.06.2026 00:00:00', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'DELHAIZE SERBIA DOO BE BEOGRAD',
        amount: 208.99,
        currency: 'RSD',
        description: ''
      },
      {
        id: 'id_CC-10000003E',
        date: moment('03.06.2026 00:00:00', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'Shell Yverdon Yverdon-les-B',
        amount: -4985.39,
        currency: 'RSD',
        description: '',
        invoice: { sum: -42.47, instrument: 'EUR' }
      }
    ])
  })

  it('does not build a foreign invoice for a zero original amount (foreign refund edge case)', () => {
    const body = [[
      ['', '', ''],
      [
        cardRow({ debit: '0', credit: '500.00', originalCurrency: 'EUR', reference: 'CC-10000004E', description: 'Visa Electron INO Wallet: REFUND MERCHANT             PARIS', transactionDate: '10.06.2026 00:00:00', domesticAmount: '500.00', accountCurrency: 'RSD' })
      ]
    ]]

    expect(parseCardTurnover(body, fromDate)).toEqual([
      {
        id: 'id_CC-10000004E',
        date: moment('10.06.2026 00:00:00', 'DD.MM.YYYY HH:mm:ss').toDate(),
        address: 'REFUND MERCHANT PARIS',
        amount: 500,
        currency: 'RSD',
        description: ''
      }
    ])
  })

  it('returns empty array when the response is an error object instead of an array', () => {
    expect(parseCardTurnover({ ErrorCode: 'Err_0', Message: 'error' }, fromDate)).toEqual([])
  })
})

describe('parseReservedFunds', () => {
  const fromDate = new Date('2026-06-01T00:00:00')

  it('parses pending debit/credit authorizations', () => {
    const body = [
      {
        Status: 'p',
        Category: 'd',
        AmountTotal: 340.97,
        DebitAmountDomestic: 340.97,
        CreditAmountDomestic: null,
        CurrencyCode: 'RSD',
        Description: 'KRALJA MILANA 28>BEOGRAD              RS',
        Reference: '10000001R',
        ValueDate: '2026-06-23T00:00:00'
      },
      {
        Status: 'p',
        Category: 'c',
        AmountTotal: 1500,
        DebitAmountDomestic: null,
        CreditAmountDomestic: 1500,
        CurrencyCode: 'RSD',
        Description: 'Povracaj>BEOGRAD RS',
        Reference: '10000002R',
        ValueDate: '2026-06-24T00:00:00'
      }
    ]

    expect(parseReservedFunds(body, fromDate)).toEqual([
      {
        id: 'id_10000001R',
        date: new Date('2026-06-23T00:00:00'),
        address: 'KRALJA MILANA 28>BEOGRAD RS',
        amount: -340.97,
        currency: 'RSD',
        description: ''
      },
      {
        id: 'id_10000002R',
        date: new Date('2026-06-24T00:00:00'),
        address: 'Povracaj>BEOGRAD RS',
        amount: 1500,
        currency: 'RSD',
        description: ''
      }
    ])
  })

  it('keeps zero-amount released holds for the converter to drop', () => {
    const body = [
      {
        Status: 'p',
        Category: 'd',
        AmountTotal: 0,
        CurrencyCode: 'RSD',
        Description: 'AIRBNB>SAN FRANCISC US',
        Reference: '17284535R',
        ValueDate: '2026-04-27T00:00:00'
      }
    ]

    expect(parseReservedFunds(body, fromDate)).toEqual([
      {
        id: 'id_17284535R',
        date: new Date('2026-04-27T00:00:00'),
        address: 'AIRBNB>SAN FRANCISC US',
        amount: -0,
        currency: 'RSD',
        description: ''
      }
    ])
  })
})
