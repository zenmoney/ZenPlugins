import { strippDescription } from '../../converters'

describe('strippDescription', () => {
  it.each([
    ['გადახდა - WWW.GENKI.WORLD 54.60 EUR 20.05.2023', 'WWW.GENKI.WORLD'],
    ['გადახდა - SUPPORT_ZZZ 500.00 RUB 18.04.2023', 'SUPPORT_ZZZ'],
    ['განაღდება - ATM Credo 8401 (batumi 5) 700.00 USD 13.05.2023', 'ATM Credo 8401 (batumi 5)'],
    ['გადახდა - get-course.kz 222277.63 KZT 29.05.2023', 'get-course.kz'],
    ['გადახდა - NAVRATNA UDUPI PURE VEG 380.00 INR 20.02.2024', 'NAVRATNA UDUPI PURE VEG'],
    ['გადახდა - WWW.GENKI.WORLD', 'WWW.GENKI.WORLD'],
    ['უნაღდო კონვერტაცია', 'უნაღდო კონვერტაცია'],
    ['Personal Transfer.', 'Personal Transfer. '],
    ['/RFB/235AD12277H32B65///POP Service s.', '/RFB/235AD12277H32B65///POP Service s.']
  ])('get description free of additional data', (description, strippedDescription) => {
    expect(strippDescription(description)).toEqual(strippedDescription)
  })
})
