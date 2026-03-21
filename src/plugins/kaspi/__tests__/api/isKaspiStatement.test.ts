import { isKaspiStatement } from '../../api'

describe('isKaspiStatement', () => {
  it('accepts deposit statement without explicit kaspi.kz in extracted text', () => {
    const statement = `
ВЫПИСКА
По Депозиту за период с 01.02.26 по 01.02.26
Номер договора: D12345678-006
Номер счета:
KZ123123132132131313
На Депозите 01.02.26: 3 200,72 ₸ Валюта счета: тенге
`
    expect(isKaspiStatement(statement)).toBe(true)
  })

  it('rejects non-kaspi text', () => {
    const otherStatement = `
Выписка по счету
Банк: Freedom Bank
Номер счета: KZ111
Остаток: 100,00
`
    expect(isKaspiStatement(otherStatement)).toBe(false)
  })
})
