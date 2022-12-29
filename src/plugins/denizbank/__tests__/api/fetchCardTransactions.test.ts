import { DenizBankApi, denizBankApi, Session } from '../../api'

const API_RESPONSE = {
  selectedCardIntermRecordList: {
    cardNumber: '529545******8927',
    productName: 'BankaKartım Sanal Kart',
    guid: 'gNCHB76Zvq2FYM54nmZobRTHNmxOowy503rvMvUTbtYRWKG1ZFfZU4Sd45VAYhntb4PyN8LpoO51AWMz4vw6wg',
    intermRecordList: [
      {
        currency: 'USD',
        transactionName: 'Sanal Pos satış',
        transactionAmount: 2.16,
        orgTransactionDate: '2022-12-23T00:01:49.0000000+03:00',
        description: 'GOOGLE *YouTube Member',
        usageType: 'Outcome'
      },
      {
        currency: 'TRY',
        transactionName: 'Sanal Pos satış',
        transactionAmount: 100.0,
        orgTransactionDate: '2022-12-20T12:58:38.0000000+03:00',
        description: 'VODAFONECEPLIRAMPASDENIZ',
        usageType: 'Outcome'
      }
    ]
  }
}

describe('fetchCardTransactions', () => {
  it('should return card transactions', async () => {
    const dummySession: Session = { clientId: '123' }
    const dummyCardId = 'card123'
    const dummyFromDate = new Date('2022-01-01')
    const dummyToDate = new Date('2022-02-02')

    const mockFetchApi = jest.spyOn(
      denizBankApi as unknown as { fetchApi: DenizBankApi['fetchApi'] },
      'fetchApi'
    )

    mockFetchApi.mockResolvedValue({
      url: '',
      status: 200,
      headers: {},
      body: API_RESPONSE
    })

    const response = await denizBankApi.fetchCardTransactions(
      dummySession,
      dummyCardId,
      dummyFromDate,
      dummyToDate
    )

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "amount": -2.16,
          "currency": "USD",
          "date": 2022-12-22T21:01:49.000Z,
          "description": "GOOGLE *YouTube Member",
          "name": "Sanal Pos satış",
          "usageType": "Outcome",
        },
        Object {
          "amount": -100,
          "currency": "TRY",
          "date": 2022-12-20T09:58:38.000Z,
          "description": "VODAFONECEPLIRAMPASDENIZ",
          "name": "Sanal Pos satış",
          "usageType": "Outcome",
        },
      ]
    `)

    expect(mockFetchApi.mock.lastCall[0]).toMatchInlineSnapshot(
      '"cards/new-debitcard-transactions/card123?startTime=2022-01-01T00%3A00%3A00.000Z&endTime=2022-02-02T00%3A00%3A00.000Z"'
    )
  })
})
