import fs from 'fs'
import path from 'path'

describe('PUMB preferences', () => {
  it('uses Ukrainian user-facing text and documents only the canonical phone format', () => {
    const preferences = fs.readFileSync(path.join(__dirname, '..', 'preferences.xml'), 'utf8')

    expect(preferences).toContain('Номер телефону')
    expect(preferences).toContain('Формат: 380501234567')
    expect(preferences).toContain('PIN-код застосунку ПУМБ')
    expect(preferences).toContain('З якої дати завантажувати операції')
    expect(preferences).not.toContain('Формат: +380')
    expect(preferences).not.toMatch(/Номер телефона|Отмена|Введите|приложения/)
  })
})
