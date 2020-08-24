import {
  convertCard
} from '../../converters'

describe('convertAccount', () => {
  it('converts account VISA', () => {
    expect(convertCard({
      id: 245395,
      account: '22618840799031231901',
      title: 'VISA Electron(Tr)',
      state: 'ACTIVE',
      pan: '427833******3346',
      currency: { name: 'USD', scale: 2 },
      type: 'VISA',
      balance: 1500
    })).toEqual({
      id: '245395',
      type: 'ccard',
      title: 'VISA Electron(Tr)',
      instrument: 'USD',
      syncID: [
        '427833******3346',
        '22618840799031231901'
      ],
      balance: 15.00
    })
  })
  it('converts account UZCARD', () => {
    expect(convertCard({
      id: 245394,
      account: '22618000499031231002',
      state: 'ACTIVE',
      pan: '860049******4598',
      currency: { name: 'UZS', scale: 2 },
      type: 'UZCARD',
      balance: 330513221
    })).toEqual({
      id: '245394',
      type: 'ccard',
      title: 'UZCARD *4598',
      instrument: 'UZS',
      syncID: [
        '860049******4598',
        '22618000499031231002'
      ],
      balance: 3305132.21
    })
  })

  it('converts account UZCARD with Title', () => {
    expect(convertCard({
      id: 226355,
      account: '22618000699052625001',
      title: 'Туркистон Кобейдж',
      state: 'ACTIVE',
      pan: '626282******3612',
      currency: { name: 'UZS', scale: 2 },
      type: 'UZCARD',
      balance: 25
    })).toEqual({
      id: '226355',
      type: 'ccard',
      title: 'Туркистон Кобейдж',
      instrument: 'UZS',
      syncID: [
        '626282******3612',
        '22618000699052625001'
      ],
      balance: 0.25
    })
  })
})

describe('convertAccount', () => {
  it('converts account HUMO', () => {
    expect(convertCard({
      id: 232733,
      maskedPan: '986019OBDZDO8587',
      title: 'Хумо',
      state: 'ACTIVE',
      pan: '986019******2965',
      currency: { name: 'UZS', scale: 2 },
      type: 'HUMO',
      balance: 1449400
    })).toEqual({
      id: '232733',
      type: 'ccard',
      title: 'Хумо',
      instrument: 'UZS',
      syncID: [
        '986019******2965',
        '986019OBDZDO8587'
      ],
      balance: 14494.00
    })
  })
  it('converts account HUMO', () => {
    expect(convertCard({
      id: 232783,
      maskedPan: '986021CREBIX8092',
      title: 'Хумo Turkiston',
      state: 'ACTIVE',
      pan: '986021******3871',
      currency: { name: 'UZS', scale: 2 },
      type: 'HUMO',
      balance: 2114119051
    })).toEqual({
      id: '232783',
      type: 'ccard',
      title: 'Хумo Turkiston',
      instrument: 'UZS',
      syncID: [
        '986021******3871',
        '986021CREBIX8092'
      ],
      balance: 21141190.51
    })
  })
})
