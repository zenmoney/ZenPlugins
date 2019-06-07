import { convertMetalAccount, GRAMS_IN_OZ } from '../../../converters'

describe('convertMetalAccount', () => {
  it('converts gold', () => {
    expect(convertMetalAccount({
      id: '500427744',
      name: 'Обезлич. мет. счета (золото)',
      number: '20309098838170333558',
      openDate: '06.01.2019T00:00:00',
      closeDate: '15.01.2019T00:00:00',
      balance: { amount: '50,00', currency: { code: 'AUR', name: 'г' } },
      availcash: { amount: '50,00', currency: { code: 'AUR', name: 'г' } },
      currency: 'ЗОЛОТО В ГРАММАХ (AUR)',
      agreementNumber: '20309A98838170333558',
      state: 'opened',
      arrested: 'false',
      showarrestdetail: 'true'
    })).toEqual({
      products: [
        {
          id: '500427744',
          type: 'ima',
          instrument: 'XAU'
        }
      ],
      zenAccount: {
        id: 'ima:500427744',
        type: 'checking',
        title: 'Обезлич. мет. счета (золото)',
        instrument: 'XAU',
        syncID: ['20309098838170333558'],
        balance: 50 / GRAMS_IN_OZ
      }
    })
  })

  it('converts silver', () => {
    expect(convertMetalAccount({
      id: '500427747',
      name: 'Обезлич. мет. счета (серебро)',
      number: '20309099038170403096',
      openDate: '06.01.2019T00:00:00',
      closeDate: '15.01.2019T00:00:00',
      balance: { amount: '3812,00', currency: { code: 'ARG', name: 'г' } },
      availcash: { amount: '3812,00', currency: { code: 'ARG', name: 'г' } },
      currency: 'СЕРЕБРО В ГРАММАХ (ARG)',
      agreementNumber: '20309A99038170403096',
      state: 'opened',
      arrested: 'false',
      showarrestdetail: 'true'
    })).toEqual({
      products: [
        {
          id: '500427747',
          type: 'ima',
          instrument: 'XAG'
        }
      ],
      zenAccount: {
        id: 'ima:500427747',
        type: 'checking',
        title: 'Обезлич. мет. счета (серебро)',
        instrument: 'XAG',
        syncID: ['20309099038170403096'],
        balance: 3812 / GRAMS_IN_OZ
      }
    })
  })
})
