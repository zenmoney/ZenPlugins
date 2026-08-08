import { convertTransaction, deduplicateTransactions } from '../../converters'
import { adjustTransactions } from '../../../../common/transactionGroupHandler'

describe('convertTransaction', () => {
  const account = {
    id: '11161311-117d11',
    transactionsAccId: null,
    type: 'card',
    title: 'Расчетная карточка*1111',
    currencyCode: '840',
    cardNumber: '529911******1111',
    instrument: 'USD',
    balance: 0,
    syncID: ['1111'],
    productType: 'MS'
  }

  const tt = [
    {
      name: 'add money internet',
      transaction: {
        amountReal: 1600.00,
        authCode: '264505',
        cardNum: '1111',
        currencyReal: 'USD',
        date: '18.01.2019',
        description: 'ZACHISLENIYE NA SCHET',
        mcc: '↵',
        place: 'STATE, PLACE, STATUSBANK',
        type: 'ZACHISLENIYE NA SCHET'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-01-18T00:00:00.000Z'),
        hold: false,
        merchant: {
          location: null,
          mcc: null,
          fullTitle: 'STATUSBANK'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: '264505',
              invoice: null,
              sum: 1600.00
            }
          ]
      }
    },
    {
      name: 'internet expense',
      transaction: {
        amount: -300.00,
        amountReal: -250.00,
        authCode: '357178',
        cardNum: '1111',
        currency: 'USD',
        currencyReal: 'EUR',
        date: '02.01.2019',
        description: 'OPLATA',
        mcc: '1200',
        place: 'GB SHOP, DOUGLAS',
        type: 'OPLATA'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2019-01-02T00:00:00.000Z'),
        hold: false,
        merchant: {
          city: 'DOUGLAS',
          country: 'GB',
          location: null,
          mcc: 1200,
          title: 'SHOP'
        },
        movements:
          [
            {
              account: {
                id: '11161311-117d11'
              },
              fee: 0,
              id: '357178',
              invoice: {
                instrument: 'EUR',
                sum: -250.00
              },
              sum: -300.00
            }
          ]
      }
    },
    {
      name: 'latest foreign currency payment with unknown account amount',
      transaction: {
        amount: null,
        amountReal: -123.45,
        authCode: '111111',
        cardNum: '400000******0002',
        currency: null,
        currencyReal: 'RSD',
        date: '30.05.2026 20:59:08',
        description: null,
        mcc: null,
        place: '100001, EPOS, Test merchant',
        type: 'Оплата в сети Интернет'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2026-05-30T00:00:00.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'Test merchant',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: '111111',
            invoice: {
              instrument: 'RSD',
              sum: -123.45
            },
            sum: null
          }
        ]
      }
    },
    {
      name: 'internet expense',
      transaction: {
        amount: null,
        amountReal: 0,
        authCode: null,
        cardNum: '521058******8691',
        currency: null,
        currencyReal: 'BYN',
        date: '21.05.2022 21:49:40',
        description: null,
        mcc: null,
        place: '899920, EPOS, Term from STATUS STB',
        type: 'SMENA STATUSA'
      },
      expectedTransaction:
        false
    },
    {
      name: 'external incoming transfer',
      transaction: {
        amount: null,
        amountReal: 60,
        authCode: '654321',
        cardNum: '400000******0002',
        currency: null,
        currencyReal: 'USD',
        date: '26.05.2026 19:35:22',
        description: null,
        mcc: null,
        place: '100003, EPOS, UNID*TEST PERSON',
        type: 'Перевод (зачисление)'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2026-05-26T00:00:00.000Z'),
        hold: false,
        merchant: {
          fullTitle: 'UNID*TEST PERSON',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: '654321',
            invoice: null,
            sum: 60
          }
        ]
      }
    },
    {
      name: 'transaction without a location',
      transaction: {
        amount: -10,
        amountReal: -10,
        authCode: '987654',
        cardNum: '400000******0002',
        currency: 'USD',
        currencyReal: 'USD',
        date: '25.05.2026 12:34:56',
        description: null,
        mcc: null,
        place: null,
        type: 'Оплата'
      },
      expectedTransaction: {
        comment: null,
        date: new Date('2026-05-25T00:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '11161311-117d11'
            },
            fee: 0,
            id: '987654',
            invoice: null,
            sum: -10
          }
        ]
      }
    }
  ]

  // run all tests
  for (const tc of tt) {
    it(tc.name, () => {
      const transaction = convertTransaction(tc.transaction, account)

      expect(transaction).toEqual(tc.expectedTransaction)
    })
  }

  it('merges matching Statusbank P2P movements between accounts', () => {
    const outcome = convertTransaction({
      amount: null,
      amountReal: -20,
      authCode: '111111',
      currency: null,
      currencyReal: 'USD',
      date: '30.05.2026 20:45:43',
      place: '100001, EPOS, STATUSBANK SDBO P2P',
      type: 'Перевод (списание)'
    }, account)
    const income = convertTransaction({
      amount: null,
      amountReal: 20,
      authCode: '222222',
      currency: null,
      currencyReal: 'USD',
      date: '30.05.2026 20:45:43',
      place: '100001, EPOS, STATUSBANK SDBO P2P',
      type: 'Перевод (зачисление)'
    }, { ...account, id: '22222222-222d22' })

    expect(adjustTransactions({ transactions: [outcome, income] })).toEqual([
      expect.objectContaining({
        merchant: null,
        movements: [
          expect.objectContaining({ id: '111111', sum: -20 }),
          expect.objectContaining({ id: '222222', sum: 20 })
        ]
      })
    ])
  })

  it.each([
    ['outgoing', -10, '444441', 'PEREVOD NA 400000******0011', 'Перевод/списание средств'],
    ['incoming', 10, '444442', 'PEREVOD S 400000******0012', 'Перевод/зачисление средств']
  ])('assigns groupKeys to statement %s P2P transfers', (direction, amount, authCode, place, type) => {
    const transaction = convertTransaction({
      amount,
      amountReal: amount,
      authCode,
      currency: 'USD',
      currencyReal: 'USD',
      date: '15.06.2026 12:00:00',
      place,
      type
    }, account)

    expect(transaction).toEqual(expect.objectContaining({
      groupKeys: ['statusbank-p2p|15.06.2026 12:00:00|10|USD'],
      merchant: null
    }))
  })

  it('merges statement P2P transfers after deduplication with latest-ops', () => {
    const accountA = { ...account, id: 'aaaaaaaa-aaaaaa' }
    const accountB = { ...account, id: 'bbbbbbbb-bbbbbb' }

    const statementOutcome = convertTransaction({
      amount: -10,
      amountReal: -10,
      authCode: '444441',
      currency: 'USD',
      currencyReal: 'USD',
      date: '15.06.2026 12:00:00',
      place: 'PEREVOD NA 400000******0011',
      type: 'Перевод/списание средств'
    }, accountA)

    const latestOutcome = convertTransaction({
      amount: null,
      amountReal: -10,
      authCode: '444441',
      currency: null,
      currencyReal: 'USD',
      date: '15.06.2026 12:00:00',
      place: '100001, EPOS, STATUSBANK SDBO P2P',
      type: 'Перевод (списание)'
    }, accountA)

    const statementIncome = convertTransaction({
      amount: 10,
      amountReal: 10,
      authCode: '444442',
      currency: 'USD',
      currencyReal: 'USD',
      date: '15.06.2026 12:00:00',
      place: 'PEREVOD S 400000******0012',
      type: 'Перевод/зачисление средств'
    }, accountB)

    const latestIncome = convertTransaction({
      amount: null,
      amountReal: 10,
      authCode: '444442',
      currency: null,
      currencyReal: 'USD',
      date: '15.06.2026 12:00:00',
      place: '100001, EPOS, STATUSBANK SDBO P2P',
      type: 'Перевод (зачисление)'
    }, accountB)

    const deduplicated = deduplicateTransactions(
      [statementOutcome, latestOutcome, statementIncome, latestIncome],
      [accountA, accountB]
    )

    const adjusted = adjustTransactions({ transactions: deduplicated })

    expect(adjusted).toEqual([
      expect.objectContaining({
        merchant: null,
        movements: [
          expect.objectContaining({ account: { id: accountA.id }, id: '444441', sum: -10 }),
          expect.objectContaining({ account: { id: accountB.id }, id: '444442', sum: 10 })
        ]
      })
    ])
  })

  it('reconciles statement and latest cash withdrawal in the operation currency', () => {
    const statement = convertTransaction({
      amount: -60,
      amountReal: -100,
      authCode: '444444',
      currency: 'USD',
      currencyReal: 'BAM',
      date: '10.06.2026 12:05:00',
      mcc: '6011',
      place: 'TEST ATM',
      type: 'Получение наличных денег'
    }, account)
    const latest = convertTransaction({
      amount: null,
      amountReal: -100,
      authCode: '444444',
      currency: null,
      currencyReal: 'BAM',
      date: '10.06.2026 12:05:00',
      mcc: null,
      place: '100001, ATM, TEST LOCATION',
      type: 'Снятие наличных'
    }, account)

    const transactions = deduplicateTransactions([statement, latest], [account])

    expect(transactions).toEqual([{
      date: new Date('2026-06-10T00:00:00.000Z'),
      movements: [
        {
          id: '444444',
          account: { id: account.id },
          invoice: { sum: -100, instrument: 'BAM' },
          sum: -60,
          fee: 0
        },
        {
          id: null,
          account: {
            company: null,
            type: 'cash',
            instrument: 'BAM',
            syncIds: null
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'TEST ATM',
      hold: false
    }])
  })

  describe('deduplicateTransactions', () => {
    const makeTransaction = ({
      accountId = account.id,
      id = '444443',
      date = '2026-05-30T00:00:00.000Z',
      sum = -12.34,
      invoice = { sum: -1234, instrument: 'RSD' },
      mcc = 4121,
      fullTitle = 'Test merchant'
    } = {}) => ({
      date: new Date(date),
      movements: [{
        id,
        account: { id: accountId },
        invoice,
        sum,
        fee: 0
      }],
      merchant: fullTitle === null
        ? null
        : { mcc, location: null, fullTitle },
      comment: null,
      hold: false
    })

    it('keeps one rich statement transaction over identical and latest duplicates', () => {
      const statement = makeTransaction()
      const duplicateStatement = makeTransaction()
      const latest = makeTransaction({ sum: null, mcc: null })

      expect(deduplicateTransactions(
        [statement, duplicateStatement, latest],
        [account]
      )).toEqual([statement])
    })

    it('does not merge reused authorization codes on another date or account', () => {
      const original = makeTransaction()
      const anotherDate = makeTransaction({ date: '2026-06-01T00:00:00.000Z' })
      const anotherAccount = makeTransaction({ accountId: 'another-account' })

      expect(deduplicateTransactions(
        [original, anotherDate, anotherAccount],
        [account, { id: 'another-account', instrument: 'USD' }]
      )).toEqual([original, anotherDate, anotherAccount])
    })

    it('does not merge transactions without authorization codes', () => {
      const first = makeTransaction({ id: null })
      const second = makeTransaction({ id: null })

      expect(deduplicateTransactions([first, second], [account])).toEqual([first, second])
    })
  })
})
