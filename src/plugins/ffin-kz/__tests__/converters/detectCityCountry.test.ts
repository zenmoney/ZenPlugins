import { detectCityCountryLocation } from '../../converters/transactions'

describe('detectCityCountryLocation', () => {
  const kzCity = 'Kazakhstan'

  it('detects Almaty variants with explicit country code', () => {
    expect(detectCityCountryLocation('COFFEE BOOM COFFEE HOUSE ALMATY KZ')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'COFFEE BOOM COFFEE HOUSE' })
    expect(detectCityCountryLocation('YANDEX.DELIVERY ALMATY KZ')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'YANDEX.DELIVERY' })
    expect(detectCityCountryLocation('Anytime.kz ALMATY KZ')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'Anytime.kz' })
  })

  it('detects Almaty without explicit country code', () => {
    expect(detectCityCountryLocation('SMART POINT ALMATY STOLOV Almaty')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'SMART POINT STOLOV' })
    expect(detectCityCountryLocation('UG TAM GDE GORY ALMATY')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'UG TAM GDE GORY' })
    expect(detectCityCountryLocation('GALMART DOSTYK SUPERMA 2 ALMATY')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'GALMART DOSTYK SUPERMA 2' })
    expect(detectCityCountryLocation('TOO ECO-LOGIC DISTRIBUTI ALMATY KZKZ')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'TOO ECO-LOGIC DISTRIBUTI' })
    expect(detectCityCountryLocation('EVA COFFEE HOUSE KAZAKHF G. ALMATY')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'EVA COFFEE HOUSE KAZAKHF' })
    expect(detectCityCountryLocation('UG TAM GDE GORY ALMATY Исполнение ного документа')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'UG TAM GDE GORY' })
    expect(detectCityCountryLocation('AVTOMOYKA RABAD G.ALMATY KZ')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'AVTOMOYKA RABAD' })
    expect(detectCityCountryLocation('TOO CINEMA HOTEL CORPORA Almaty')).toEqual({ city: 'Almaty', country: kzCity, locationPoint: 'TOO CINEMA HOTEL CORPORA' })
  })

  it('detects other Kazakhstan cities', () => {
    expect(detectCityCountryLocation('ROYAL PETROL AZS 22-2 BAITEREK')).toEqual({ city: 'Baiterek', country: kzCity, locationPoint: 'ROYAL PETROL AZS 22-2' })
    expect(detectCityCountryLocation('POYAL PETROL AZS CHUNJA KZ')).toEqual({ city: 'Chunja', country: kzCity, locationPoint: 'POYAL PETROL AZS' })
  })

  it('detects Shanghai, China', () => {
    expect(detectCityCountryLocation('PINDUODUO ShangHai CN')).toEqual({ city: 'Shanghai', country: 'China', locationPoint: 'PINDUODUO' })
  })

  it('detects Minsk, Belarus', () => {
    expect(detectCityCountryLocation('SERV.BSB LINK MINSK BY')).toEqual({ city: 'Minsk', country: 'Belarus', locationPoint: 'SERV.BSB LINK' })
  })

  it('returns null for unknown locations', () => {
    expect(detectCityCountryLocation('IP YUG TAM GDE GORY')).toEqual({ locationPoint: 'UG TAM GDE GORY' })
    expect(detectCityCountryLocation('APPLE.COM BILL ITUNES.COM IE')).toEqual({ locationPoint: 'APPLE.COM BILL ITUNES.COM IE' })
    expect(detectCityCountryLocation('ТОО Arbuz Group (Арбуз Груп) За оплату билета/услугу/продукты /товар заказ 123456 Arbuz')).toEqual({ locationPoint: 'ТОО Arbuz Group' })
  })
})
