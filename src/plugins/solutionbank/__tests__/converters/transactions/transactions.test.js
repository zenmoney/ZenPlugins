import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: '00750933012345',
    type: 'card',
    title: 'Visa Virtual*111',
    instrument: 'BYN',
    balance: 99.9,
    syncID: [
      '1111'
    ]
  }

  it('easy transaction', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BANK RESHENIE- OPLATA USLUG; MINSK;BY',
      operationName: 'Оплата товаров и услуг',
      sum: -1
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -1,
          invoice: null,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('zero sum', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BANK RESHENIE- OPLATA USLUG; MINSK;BY',
      operationName: 'Оплата товаров и услуг',
      sum: 0
    })

    expect(transaction).toEqual(null)
  })

  it('merchant parsing with country', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BELPOST.BY; MINSK; BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'MINSK',
        country: 'BY',
        location: null,
        mcc: null,
        title: 'BELPOST.BY'
      },
      comment: null
    })
  })

  it('merchant parsing WWW.WILDBERRIES.BY', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'INT-SH.&quot;WWW.WILDBERRIES.BY&quot;; MOGILEV;BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'MOGILEV',
        country: 'BY',
        location: null,
        mcc: null,
        title: 'INT-SH."WWW.WILDBERRIES.BY"'
      },
      comment: null
    })
  })

  it('merchant parsing Visa Provisioning Service', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'Visa Provisioning Service; ; BY',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: '',
        country: 'BY',
        location: null,
        mcc: null,
        title: 'Visa Provisioning Service'
      },
      comment: null
    })
  })

  it('merchant parsing SAMSUNG ELECTRONIC', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'SAMSUNG ELECTRONIC; SCHWALBACH A;DE',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'SCHWALBACH A',
        country: 'DE',
        location: null,
        mcc: null,
        title: 'SAMSUNG ELECTRONIC'
      },
      comment: null
    })
  })

  it('merchant parsing Udemy', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'UDEMY; ONLINE COURSES; SAN FRANCISC; US',
      operationName: 'Оплата товаров и услуг',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: 'SAN FRANCISC',
        country: 'US',
        location: null,
        mcc: null,
        title: 'UDEMY; ONLINE COURSES'
      },
      comment: null
    })
  })

  it('merchant parsing without country', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'dominos.by',
      operationName: 'Оплата товаров (услуг)',
      sum: -18
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -18,
          invoice: null,
          fee: 0
        }
      ],
      merchant: {
        city: null,
        country: null,
        location: null,
        mcc: null,
        title: 'dominos.by'
      },
      comment: null
    })
  })
})
