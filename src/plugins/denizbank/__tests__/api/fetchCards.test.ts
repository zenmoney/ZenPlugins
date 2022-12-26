import { DenizBankApi, denizBankApi, Session } from '../../api'

const API_RESPONSE = {
  creditCardListResponse: {
    canApply: true,
    isVisible: true,
    order: 2,
    creditCardList: []
  },
  debitCardListResponse: {
    canApply: false,
    isVisible: false,
    order: 1,
    debitCardList: [
      {
        guid: '9ULxuPT-35iAhrR9gwaXoNR0j5p60sYAEyrl73b-D2gf2tNBmtcoddj6b1r9Mi2br4vyA2r_T4VKLVoyykwJxw',
        name: 'BankaKartım Temassız Hazır',
        image: 'https://www.denizbank.com/_files/md_images/Janus/cards/55.png',
        maskedCardNumber: '5295 45** **** 9753',
        currency: 'TRY'
      }
    ]
  },
  debitVirtualCardListResponse: {
    canApply: false,
    isVisible: true,
    order: 0,
    debitCardList: [
      {
        guid: 'gNCHB76Zvq2FYM54nmZobRTHNmxOowy503rvMvUTbtYRWKG1ZFfZU4Sd45VAYhntb4PyN8LpoO51AWMz4vw6wg',
        name: 'BankaKartım Sanal Kart',
        image: 'https://www.denizbank.com/_files/md_images/Janus/cards/57.png',
        maskedCardNumber: '5295 45** **** 8927',
        currency: 'TRY'
      }
    ]
  }
}

describe('fetchCards', () => {
  it('should return cards', async () => {
    const dummySession: Session = { clientId: '123' }
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

    const response = await denizBankApi.fetchCards(dummySession)

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "currency": "TRY",
          "guid": "9ULxuPT-35iAhrR9gwaXoNR0j5p60sYAEyrl73b-D2gf2tNBmtcoddj6b1r9Mi2br4vyA2r_T4VKLVoyykwJxw",
          "maskedCardNumber": "5295 45** **** 9753",
          "name": "BankaKartım Temassız Hazır",
        },
        Object {
          "currency": "TRY",
          "guid": "gNCHB76Zvq2FYM54nmZobRTHNmxOowy503rvMvUTbtYRWKG1ZFfZU4Sd45VAYhntb4PyN8LpoO51AWMz4vw6wg",
          "maskedCardNumber": "5295 45** **** 8927",
          "name": "BankaKartım Sanal Kart",
        },
      ]
    `)
  })
})
