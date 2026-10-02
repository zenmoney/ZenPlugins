import { InvalidPreferencesError } from '../../../errors'
import { Preferences } from '../models'
import { parseWallets } from '../preferences'

function prefs (overrides: Partial<Preferences> = {}): Preferences {
  return { wallet1Addresses: 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps', ...overrides }
}

describe('parseWallets', () => {
  it('единственный слот без имени получает заголовок Bitcoin и id первого адреса', () => {
    expect(parseWallets(prefs())).toEqual([{
      id: 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps',
      title: 'Bitcoin',
      addresses: ['bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps']
    }])
  })

  it('режет список по запятым и игнорирует пробелы и пустые элементы', () => {
    const wallets = parseWallets(prefs({
      wallet1Addresses: ' bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps , ,1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2 '
    }))
    expect(wallets[0].addresses).toEqual([
      'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
    ])
  })

  it('второй и третий слоты дают отдельные кошельки со своими именами', () => {
    const wallets = parseWallets(prefs({
      wallet1Title: 'Ledger_1',
      wallet2Title: 'Ledger_2',
      wallet2Addresses: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
    }))
    expect(wallets.map(w => w.title)).toEqual(['Ledger_1', 'Ledger_2'])
  })

  it('слот без адресов пропускается, даже если имя задано', () => {
    expect(parseWallets(prefs({ wallet2Title: 'Пустой', wallet2Addresses: '  ' }))).toHaveLength(1)
  })

  it('имя по умолчанию берётся из номера слота, а не из позиции в списке', () => {
    // Заполнены слоты 1 и 3, слот 2 пустой. Второй кошелёк в результате — это слот 3,
    // и назвать его надо «Bitcoin 3» по номеру слота. Возьми мы позицию в списке, вышло бы
    // «Bitcoin 2» — и счёт переименовался бы сам собой, стоит пользователю заполнить слот 2.
    const wallets = parseWallets(prefs({
      wallet3Addresses: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
    }))
    expect(wallets.map(w => w.title)).toEqual(['Bitcoin', 'Bitcoin 3'])
  })

  it('дубль адреса внутри слота схлопывается', () => {
    const address = 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps'
    expect(parseWallets(prefs({ wallet1Addresses: `${address},${address}` }))[0].addresses).toEqual([address])
  })

  it('один адрес в двух слотах — ошибка настроек', () => {
    const address = 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps'
    expect(() => parseWallets(prefs({ wallet2Addresses: address }))).toThrow(InvalidPreferencesError)
  })

  it('bech32 в верхнем регистре принимается и приводится к нижнему', () => {
    // BIP173 разрешает адрес целиком в верхнем регистре, и некоторые кошельки так
    // и отдают его в QR. API же понимает только нижний.
    const address = 'bc1q9m3zshmgyper308w9xp53kq2y2vs2c86ewcmps'
    expect(parseWallets(prefs({ wallet1Addresses: address.toUpperCase() }))[0].addresses).toEqual([address])
  })

  it('base58 не приводится к нижнему регистру — там он значащий', () => {
    // Регистр в base58 меняет сам адрес, так что нормализовать можно только bech32.
    const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
    expect(parseWallets(prefs({ wallet1Addresses: address }))[0].addresses).toEqual([address])
  })

  it('мусор вместо адреса — ошибка настроек', () => {
    expect(() => parseWallets(prefs({ wallet1Addresses: 'не адрес' }))).toThrow(InvalidPreferencesError)
  })

  it('ни одного адреса — ошибка настроек', () => {
    expect(() => parseWallets(prefs({ wallet1Addresses: '' }))).toThrow(InvalidPreferencesError)
  })
})
