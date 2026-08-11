import { parseDescription } from '../../converters'

describe('parseDescription', () => {
  it.each([
    [
      'Оплата товарів\\послуг \\ \\NL\\Vorden\\Hammin\\Uber BV',
      {
        comment: null,
        merchant: {
          country: 'NL',
          city: 'Vorden',
          title: 'Hammin Uber BV',
          mcc: null,
          location: null
        }
      }
    ],
    [
      'Оплата товарів\\послуг \\ S11309AH\\UA\\DNEPROPETR-SK\\Brusnichka 031',
      {
        comment: null,
        merchant: {
          country: 'UA',
          city: 'DNEPROPETR-SK',
          title: 'Brusnichka 031',
          mcc: null,
          location: null
        }
      }
    ],
    [
      'Оплата товарів\\послуг \\ 50301888\\UA\\DNIPRO\\73,.SL\\PROSTOR 175',
      {
        comment: null,
        merchant: {
          country: 'UA',
          city: 'DNIPRO',
          title: '73,.SL PROSTOR 175',
          mcc: null,
          location: null
        }
      }
    ],
    [
      'Оплата товарів\\послуг \\ 20905029\\UA\\KYIV\\35, PERE\\KYIVSKYI METRO',
      {
        comment: null,
        merchant: {
          country: 'UA',
          city: 'KYIV',
          title: '35, PERE KYIVSKYI METRO',
          mcc: null,
          location: null
        }
      }
    ],
    [
      'Оплата товарів\\послуг \\ S0214852\\UA\\KYIV\\KAFE BRANCH&COFE',
      {
        comment: null,
        merchant: {
          country: 'UA',
          city: 'KYIV',
          title: 'KAFE BRANCH&COFE',
          mcc: null,
          location: null
        }
      }
    ],
    [
      'Погашення заборгованості, яка не передбачена Договором',
      {
        comment: 'Погашення заборгованості, яка не передбачена Договором',
        merchant: null
      }
    ],
    [
      'Оплата товарів\\послуг - інтернет\\DRI Adobe Systems orderfind.com IRL',
      {
        comment: null,
        merchant: {
          fullTitle: 'DRI Adobe Systems orderfind.com IRL',
          mcc: null,
          location: null
        }
      }
    ],
    [
      'Оплата товарів\\послуг\\KAFE BRANCH&COFE KYIV UKR',
      {
        comment: null,
        merchant: {
          fullTitle: 'KAFE BRANCH&COFE KYIV UKR',
          mcc: null,
          location: null
        }
      }
    ]
  ])('%s', (description, result) => {
    expect(parseDescription(description)).toEqual(result)
  })
})
