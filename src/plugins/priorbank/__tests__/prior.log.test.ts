import fetchMock from 'fetch-mock'

interface Auth {
  accessToken: string
  clientSecret: string
  userSession: string
}
const { getCards, getCardDesc }: Record<'getCards' | 'getCardDesc', (auth: Auth) => Promise<{ body: unknown }>> = jest.requireActual('../prior')

const auth = { accessToken: 'synthetic-access-token', clientSecret: 'synthetic-client-secret', userSession: 'synthetic-session' }

describe('Priorbank response logging', () => {
  afterEach(() => {
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it('masks Cards cookies and identifiers while keeping status and balance diagnostics', async () => {
    // Source: zenmoney_plugin_log_2026-11-16-09-55-54.log, /Cards response.
    // Projected to one card and the fields needed for logging; identifiers/cookies are synthetic.
    // This is not a complete account-conversion fixture; the source already masked these identifiers.
    const body = {
      success: true,
      errorMessage: '',
      internalErrorCode: 0,
      externalErrorCode: '',
      token: false,
      tokenFields: null,
      result: [{
        status: { respClass: '', respCode: 0, respText: '', module: 11, messageForClient: '' },
        clientObject: {
          currIso: 'BYN',
          cardMaskedNumber: '************0001',
          cardRBSNumber: 'synthetic-rbs',
          contractNum: 'synthetic-contract',
          iban: 'synthetic-iban'
        },
        balance: { balance: 0, blocked: 0, crLimit: 0 }
      }]
    }
    const url = 'https://www.prior.by/api3/api/Cards'
    fetchMock.post(url, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'session=synthetic-card-cookie; Secure; HttpOnly' },
      body
    })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})

    const response = await getCards(auth)

    expect(response.body).toEqual(body)
    expect(debug).toHaveBeenNthCalledWith(1, 'request', expect.objectContaining({
      url,
      method: 'POST',
      headers: expect.objectContaining({ Authorization: '<string[29]>', client_id: '<string[23]>' }),
      body: { usersession: '<string[17]>' }
    }))
    expect(debug).toHaveBeenNthCalledWith(2, 'response', expect.objectContaining({
      id: expect.any(String),
      ms: expect.any(Number),
      url,
      status: 200,
      headers: expect.objectContaining({ 'content-type': 'application/json', 'set-cookie': '<string[47]>' }),
      body: {
        success: true,
        errorMessage: '',
        internalErrorCode: 0,
        externalErrorCode: '',
        token: false,
        tokenFields: null,
        result: [{
          status: { respClass: '', respCode: 0, respText: '', module: 11, messageForClient: '' },
          clientObject: {
            currIso: 'BYN',
            cardMaskedNumber: '************0001',
            cardRBSNumber: '<string[13]>',
            contractNum: '<string[18]>',
            iban: '<string[14]>'
          },
          balance: { balance: 0, blocked: 0, crLimit: 0 }
        }]
      }
    }))
    const output = JSON.stringify(debug.mock.calls)
    for (const secret of [...Object.values(auth), 'synthetic-card-cookie', 'synthetic-rbs', 'synthetic-contract', 'synthetic-iban']) {
      expect(output).not.toContain(secret)
    }
  })

  it('masks CardDesc cookies and addresses while keeping financial source fields', async () => {
    // Source: the same capture, /Cards/CardDesc response. Reduced to one result and logging fields;
    // the source already masked address lines, which are replaced by public-safe synthetic values.
    const body = {
      success: true,
      errorMessage: '',
      internalErrorCode: 0,
      externalErrorCode: '',
      result: [{
        contract: {
          creditLimit: 0,
          addrLineA: 'Synthetic name',
          addrLineB: 'Synthetic city',
          addrLineC: 'Synthetic street',
          message: { messageDateSpecified: false, messageString: '' }
        },
        monthDebit: { interest: 0, due: 0, monthlyFee: 0, total: 0 },
        currentDebit: { due: 0, ovdField: 0, interest: 0, monthlyFee: 0, total: 0 }
      }]
    }
    const url = 'https://www.prior.by/api3/api/Cards/CardDesc'
    fetchMock.post(url, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': 'session=synthetic-description-cookie; Secure; HttpOnly' },
      body
    })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})

    const response = await getCardDesc(auth)

    expect(response.body).toEqual(body)
    expect(debug).toHaveBeenNthCalledWith(1, 'request', expect.objectContaining({
      url,
      headers: expect.objectContaining({ Authorization: '<string[29]>', client_id: '<string[23]>' }),
      body: { usersession: '<string[17]>', ids: [], dateFromSpecified: false, dateToSpecified: false }
    }))
    expect(debug).toHaveBeenNthCalledWith(2, 'response', expect.objectContaining({
      url,
      status: 200,
      headers: expect.objectContaining({ 'content-type': 'application/json', 'set-cookie': '<string[54]>' }),
      body: {
        success: true,
        errorMessage: '',
        internalErrorCode: 0,
        externalErrorCode: '',
        result: [{
          contract: {
            creditLimit: 0,
            addrLineA: '<string[14]>',
            addrLineB: '<string[14]>',
            addrLineC: '<string[16]>',
            message: { messageDateSpecified: false, messageString: '' }
          },
          monthDebit: { interest: 0, due: 0, monthlyFee: 0, total: 0 },
          currentDebit: { due: 0, ovdField: 0, interest: 0, monthlyFee: 0, total: 0 }
        }]
      }
    }))
    const output = JSON.stringify(debug.mock.calls)
    for (const secret of [...Object.values(auth), 'synthetic-description-cookie', 'Synthetic name', 'Synthetic city', 'Synthetic street']) {
      expect(output).not.toContain(secret)
    }
  })

  it('[model] masks common authentication headers without hiding transport failure diagnostics', async () => {
    // Invariant: response header masking is independent of the endpoint body projection and HTTP status.
    // The generic transport error and additional authentication headers are synthetic, not bank evidence.
    const url = 'https://www.prior.by/api3/api/Cards'
    fetchMock.post(url, {
      status: 503,
      headers: { Authorization: 'synthetic-response-token', Cookie: 'synthetic-response-cookie', 'Set-Cookie': 'synthetic-set-cookie' },
      body: { error: 'Synthetic upstream unavailable', code: 'SYNTHETIC_ERROR' }
    })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})

    await getCards(auth)

    expect(debug).toHaveBeenNthCalledWith(2, 'response', expect.objectContaining({
      url,
      status: 503,
      headers: expect.objectContaining({ authorization: '<string[24]>', cookie: '<string[25]>', 'set-cookie': '<string[20]>' }),
      body: { error: 'Synthetic upstream unavailable', code: 'SYNTHETIC_ERROR' }
    }))
    const output = JSON.stringify(debug.mock.calls)
    for (const secret of ['synthetic-response-token', 'synthetic-response-cookie', 'synthetic-set-cookie']) {
      expect(output).not.toContain(secret)
    }
  })
})
