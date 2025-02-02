import { getAmountFromDescription } from '../../converters'

describe('getAmountFromDescription', () => {
  it.each([
    ['გადახდა - WWW.GENKI.WORLD 54.60 EUR 20.05.2023', { sum: 54.6, instrument: 'EUR' }],
    ['გადახდა - SUPPORT_ZZZ 500.00 RUB 18.04.2023', { sum: 500.0, instrument: 'RUB' }],
    ['განაღდება - ATM Credo 8401 (batumi 5) 700.00 USD 13.05.2023', { sum: 700.0, instrument: 'USD' }],
    ['გადახდა - get-course.kz 222277.63 KZT 29.05.2023', { sum: 222277.63, instrument: 'KZT' }],
    ['გადახდა - WWW.GENKI.WORLD', null],
    ['უნაღდო კონვერტაცია', null],
    ['Personal Transfer.', null],
    ['/RFB/235AD12277H32B65///POP Service s.', null]
  ])('get invoice sum and instument from description', (description, invoice) => {
    expect(getAmountFromDescription(description, 1)).toEqual(invoice)
  })
})
