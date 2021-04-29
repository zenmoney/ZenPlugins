import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it('should convert Girokonto account', () => {
    const apiAccount = {
      account: {
        accountId: '271ABD2FA08D37B4DEBD11E3AB39634B',
        accountDisplayId: '628827968492',
        currency: 'EUR',
        clientId: '077B0DC0F0260B0B4ACF6BF38F9A2664',
        accountType: {
          key: 'CA',
          text: 'Girokonto'
        },
        iban: 'DE50500105177141441838',
        creditLimit: {
          value: '0',
          unit: 'EUR'
        }
      },
      accountId: '271ABD2FA08D37B4DEBD11E3AB39634B',
      balance: {
        value: '831.42',
        unit: 'EUR'
      },
      balanceEUR: {
        value: '831.42',
        unit: 'EUR'
      },
      availableCashAmount: {
        value: '831.42',
        unit: 'EUR'
      },
      availableCashAmountEUR: {
        value: '831.42',
        unit: 'EUR'
      }
    }

    expect(convertAccount(apiAccount)).toEqual({
      id: 'DE50500105177141441838',
      title: 'Girokonto (***1838)',
      syncID: ['DE50500105177141441838', '271ABD2FA08D37B4DEBD11E3AB39634B'],
      instrument: 'EUR',
      type: 'checking',
      balance: 831.42,
      startBalance: 0
    })
  })

  it('should convert Tagesgeld account', () => {
    const apiAccount = {
      account: {
        accountId: 'AC67F0AF1BA31334C4B11B2B7C2ED1EF',
        accountDisplayId: '916999989234',
        currency: 'EUR',
        clientId: '077B0DC0F0260B0B4ACF6BF38F9A2664',
        accountType: {
          key: 'DAS',
          text: 'Tagesgeld PLUS-Konto'
        },
        iban: 'DE27500105173561396225',
        creditLimit: {
          value: '0',
          unit: 'EUR'
        }
      },
      accountId: 'AC67F0AF1BA31334C4B11B2B7C2ED1EF',
      balance: {
        value: '45.75',
        unit: 'EUR'
      },
      balanceEUR: {
        value: '45.75',
        unit: 'EUR'
      },
      availableCashAmount: {
        value: '45.75',
        unit: 'EUR'
      },
      availableCashAmountEUR: {
        value: '45.75',
        unit: 'EUR'
      }
    }

    expect(convertAccount(apiAccount)).toEqual({
      id: 'DE27500105173561396225',
      title: 'Tagesgeld PLUS-Konto (***6225)',
      syncID: ['DE27500105173561396225', 'AC67F0AF1BA31334C4B11B2B7C2ED1EF'],
      instrument: 'EUR',
      type: 'checking',
      balance: 45.75,
      startBalance: 0,
      savings: true
    })
  })

  it('should ignore account types other then CA, DAS and SA', () => {
    const apiAccount = {
      account: {
        accountId: '271ABD2FA08D37B4DEBD11E3AB39634B',
        accountDisplayId: '628827968492',
        currency: 'EUR',
        clientId: '077B0DC0F0260B0B4ACF6BF38F9A2664',
        accountType: {
          key: 'CFD',
          text: 'Contract for Difference Konto'
        },
        iban: 'DE50500105177141441838',
        creditLimit: {
          value: '0',
          unit: 'EUR'
        }
      },
      accountId: '271ABD2FA08D37B4DEBD11E3AB39634B',
      balance: {
        value: '831.42',
        unit: 'EUR'
      },
      balanceEUR: {
        value: '831.42',
        unit: 'EUR'
      },
      availableCashAmount: {
        value: '831.42',
        unit: 'EUR'
      },
      availableCashAmountEUR: {
        value: '831.42',
        unit: 'EUR'
      }
    }

    expect(convertAccount(apiAccount)).toBeNull()
  })
})
