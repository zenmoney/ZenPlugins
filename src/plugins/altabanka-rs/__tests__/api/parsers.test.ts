import fs from 'fs'
import path from 'path'
import {
  parseAccountInfo,
  parseLoginResult,
  parseRequestVerificationToken,
  parseTransactions
} from '../../parsers'

describe('parsers', () => {
  it('should parse login result', async () => {
    const mockBody = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/login.html'),
      'utf8'
    )

    const response = parseLoginResult(mockBody)

    expect(response).toBe(true)
    expect(parseLoginResult('some other text')).toBe(false)
  })

  it('should parse accounts', async () => {
    const mockBody = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/accounts.html'),
      'utf8'
    )

    const response = parseAccountInfo(mockBody)

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "balance": 249233.58,
          "currency": "RSD",
          "id": "0001000512876-0xC4952DBB2BB24ECAFF9655505605F0F0",
          "name": "4242XXXXXXXX4061",
        },
        Object {
          "balance": 249233.58,
          "currency": "RSD",
          "id": "0001000512876-0x3A7A78AB70965C9C2323270A293FA54F",
          "name": "9891XXXXXXXX6625",
        },
        Object {
          "balance": 249233.58,
          "currency": "RSD",
          "id": "0001000512876",
          "name": "Tekući račun",
        },
        Object {
          "balance": 2979.07,
          "currency": "EUR",
          "id": "0001000512877",
          "name": "Štedni račun",
        },
      ]
    `)
  })

  it('should parse verification token', async () => {
    const mockBody = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/transactions-get.html'),
      'utf8'
    )

    const response = parseRequestVerificationToken(mockBody)

    expect(response).toMatchInlineSnapshot(
      '"gRMs7qlFJfglZXJ6LWt9Rrf7uFmYKVrlUJAw9kZJvP3i_2TyXQT8g09XpquVXaLZEXbWPapfQN8LTUDqEcvgUkBoHok94w-t8dlg88U-nFY1"'
    )
  })

  it('should parse card transactions', async () => {
    const mockBody = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/transactions-post-1.html'),
      'utf8'
    )

    const response = parseTransactions(mockBody)

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "LP ANDREY SERAPIONOV PR BE",
          "amount": -5000,
          "currency": "RSD",
          "date": 2024-10-10T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROQiAnv9eKjzzUz+KkcY17oVfGcac1cpGXH2hbQafqYVaR0zItwhlKuOVk0qzP4RfUc8R0cB5b+rb",
        },
        Object {
          "address": "BLVCK SUGAR DOO BE",
          "amount": -850,
          "currency": "RSD",
          "date": 2024-10-10T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROQiAnv9eKjzzX9TfebVLqb1omJLFzKwNFK63CgLt+CwFb6mv2B5sE6ZvvPwhZFnucOH9zKee0pDC",
        },
        Object {
          "address": "SELECTIVE CENTAR KNEZ BE",
          "amount": -2150,
          "currency": "RSD",
          "date": 2024-10-10T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROQiAnv9eKjzzAwZGs4gh3RVQsAS279lTUOIDuDdF0ZB3O/FsxX6VBmGsn+xHeaSsNZzqSpOlhn/S",
        },
        Object {
          "address": "PP VIDIN KAPIJA A1 BEOGRAD",
          "amount": -450,
          "currency": "RSD",
          "date": 2024-10-08T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROW+DYw0B37YdNg3+3cjmm40EKzx4BEDfrMQelRZkazIjUpYF2dR4LyoTrZHdVbqdc8vUq+jISqxR",
        },
        Object {
          "address": "LILLY APOTEKA 269 BE",
          "amount": -1305.95,
          "currency": "RSD",
          "date": 2024-10-08T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7RORKfHQXYp29vjWAesZBAPA2vq3eEsdM2vDZeC+SqNxG/Kcf5TopUo9Uqi9YNOHp8yE+gMPDeOUL1",
        },
        Object {
          "address": "H&M GALERIJA RS 0520 BEOGRAD",
          "amount": -1117,
          "currency": "RSD",
          "date": 2024-10-07T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHUCkr8H4Y8NzC7nAThSgF3KfisQBq+hhu+Bj8Y0KOoXigSWwxeyxN1zkoico0tVDR",
        },
        Object {
          "address": "H&M GALERIJA RS 0520 BEOGRAD",
          "amount": -6081,
          "currency": "RSD",
          "date": 2024-10-07T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHmFaIW1okYp15M6gW5mu9/uCwDxxqK7K+g4q8MGJen3Diyg98rhcN3OyAdthi7QbW",
        },
        Object {
          "address": "DON DON LULU 23 BEOGRAD SAVSKI",
          "amount": -393,
          "currency": "RSD",
          "date": 2024-10-07T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHuzaP7+B9LHcKdGwn2lfDqVzZZVr0qPI5lHa5tVIXpnpKbKpix82xRkmcrlxxivnP",
        },
        Object {
          "address": "PAYSPOT CORNER 12 BEOGRAD SAVSKI",
          "amount": -1999,
          "currency": "RSD",
          "date": 2024-10-07T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHnhPD4SwQ5+dkzpMrXR3Apu2VJrKwBnVSLhz5T4gyYUsq6Il6maqcGyrre7qV0h0P",
        },
        Object {
          "address": "SUSHIRRITO BW BE",
          "amount": -2230,
          "currency": "RSD",
          "date": 2024-10-07T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROXCpqc/gQY3tMC0oRtmp3FZhztLjcXl7DfINqELg3RYn1YqUZvSoj70jtihxumnx74OHMnl+UmGr",
        },
      ]
    `)
  })

  it('should parse account transactions', async () => {
    const mockBody = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/transactions-post-2.html'),
      'utf8'
    )

    const response = parseTransactions(mockBody)

    expect(response).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "K-ETA 0215663441",
          "amount": -7.14,
          "currency": "EUR",
          "date": 2024-10-20T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROexS+MuFAgyqGLsF4zn6wmg2+ls9+8iDIMN9DKrpLesjKGAnTGDgwRa0CmWUudJmfv5/FnM8dI9l",
        },
        Object {
          "address": "MOBILNA APP ONEA PODGORICA",
          "amount": -4,
          "currency": "EUR",
          "date": 2024-10-20T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROexS+MuFAgyqD+WpkTldkqwcd41njf/DJdlqZFMz0HEfwAnn4IB+wvQzycvw/2jCJBwfJmv9ymvj",
        },
        Object {
          "address": "VOLI 1 PODGORICA",
          "amount": -8.33,
          "currency": "EUR",
          "date": 2024-10-17T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7RObwJBTpX2tfccY5WOXPWm5g6XirWQBvUYcxyBq3X9tIh66iV7eS+pk2DCLfxYS+o0cELG8OPzvg+",
        },
        Object {
          "address": "MARIEN PLATZ PODGORICA",
          "amount": -71.62,
          "currency": "EUR",
          "date": 2024-10-17T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7RObwJBTpX2tfcSXO15NgJyAT4Dd+qRWWlV4BYbsQZs1moUnIC/OtHwGEri/p3hFnlSvvxPAIiz0xS",
        },
        Object {
          "address": "THE BRITISH COUNCIL MANCHESTER 23500.00 RSD
      Kurs:117.0177",
          "amount": -201.46,
          "currency": "EUR",
          "date": 2024-10-13T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROVItA/1GrciWf6yiBQboMNZhIFXhNjwOBNY877Ypq+Qq6T2grgK7sjST6dR6hDkQI0EEjwe0TTRR",
        },
        Object {
          "address": "APPLE.COM/BILL ITUNES.COM",
          "amount": -98.99,
          "currency": "EUR",
          "date": 2024-09-30T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROeNQ5v0+ZB/Lp92ZxoYpjTWuMELQqBegH1PuKDjHm2e3rwj+yG5VDg1OZFrSGlg6t3MXgb5D+olT",
        },
        Object {
          "address": "AIR SERBIA A.D BEOGRAD NOVI BEOGRAD 36992.00
      RSD Kurs:117.0936",
          "amount": -315.92,
          "currency": "EUR",
          "date": 2024-09-25T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROeDyeYpiaLJvewDfWrvlOG64LBWMkfmOlNGcepDegFz3t636MfLGsPS0ErAC54B8idWx8cH7zokZ",
        },
        Object {
          "address": "CHIP CARD AD BEOGRAD KOPAONIK 600.00 RSD
      Kurs:117.0936",
          "amount": -5.12,
          "currency": "EUR",
          "date": 2024-09-25T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROeDyeYpiaLJv/l7BwqxRalCcAa6g2Nv2IYQlD9jr3/HvORIjAFf2IjISI8X6jMij7vajo/m8CIvZ",
        },
        Object {
          "address": "AIR SERBIA A.D BEOGRAD NOVI BEOGRAD 63147.00
      RSD Kurs:117.0936",
          "amount": -539.29,
          "currency": "EUR",
          "date": 2024-09-25T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROeDyeYpiaLJvnp1c2/Cl5OZ3DPyOExYV3GVElhraeyusFlT8JkDbp7y1NN8JPA2+jc8OONpKh4K6",
        },
        Object {
          "address": "AIR SERBIA A.D BEOGRAD NOVI BEOGRAD 20455.00
      RSD Kurs:117.0917",
          "amount": -167.16,
          "currency": "EUR",
          "date": 2024-09-24T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROV3Qa3XqC9Rhi5rpkiLRsN0oWg85cW3c/D9kPnaO/TLMOOBqFL3fy6/eIhaFdxeNXotNK41IhZvL",
        },
        Object {
          "address": "APPLE.COM/US 800-676-2775 99.00 USD
      Kurs:1.1195",
          "amount": -89.33,
          "currency": "EUR",
          "date": 2024-09-24T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROV3Qa3XqC9RhUhavsPPoyv9nShr+j7yuZ+2P2MRKxi/RHsjWSj78bzYS1DZyLjl0EpifURazx0Me",
        },
        Object {
          "address": "Prodaja deviza",
          "amount": -10,
          "currency": "EUR",
          "date": 2024-09-04T22:00:00.000Z,
          "id": "+h5Bxj5lBGyJ6XvrOBRhDLeeN+xJ0/w4XMM8TTJEEZ53CZCjtJj68Ido9BFHwz3TUOdSJ2hA7SM=",
        },
        Object {
          "address": "CC_NEW FITNESS BEOGRAD 3320.00 RSD
      Kurs:117.0222",
          "amount": -28.37,
          "currency": "EUR",
          "date": 2024-08-29T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROWW8SMindbi9qyWTYzL6T0+iBI2QHnsg8kphdlLWyI599KGB4zJBkqCIlE8Aib/R4vGAm63DMjYt",
        },
        Object {
          "address": "CC_NEW FITNESS BEOGRAD 3320.00 RSD
      Kurs:117.0553",
          "amount": -28.36,
          "currency": "EUR",
          "date": 2024-07-30T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROSMX4igovJ/mtS2Jk10Pkqrt9MrwJ14QtjyPZld6fvZDhvXC7DqjMPkfMP5I1+JMELw7YSv+8Nra",
        },
        Object {
          "address": "CINEPLEXX SRB DO NOVI BEOGRAD 3210.00 RSD
      Kurs:117.0680",
          "amount": -19.86,
          "currency": "EUR",
          "date": 2024-07-24T22:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROT4IailIraT5c5/AjyJOcSAH6hRg11RtwQ58MITi7ZmmRSpk02HvNxWLyDmAjwGk8B29oj2UWfNh",
        },
        Object {
          "address": "Prodaja deviza",
          "amount": -10,
          "currency": "EUR",
          "date": 2024-05-07T22:00:00.000Z,
          "id": "+h5Bxj5lBGyJ6XvrOBRhDLHO4MP7xsK4+KHdPBOyRoi8Iavw0zjReAOpKRwd35zVLkElh0b4KVs=",
        },
        Object {
          "address": "ROMAN PAVLOV",
          "amount": 3800,
          "currency": "EUR",
          "date": 2024-04-13T22:00:00.000Z,
          "id": "+h5Bxj5lBGydLNdInhh39gudFQ5POsk76CNhd+9wvSjblV5pYsUGEJFr3dEnMpxBfDNIPvv3S7A=",
        },
        Object {
          "address": "FAVORIT CGI 6 PETROVAC NA M 1000.00 RSD
      Kurs:117.2024",
          "amount": -8.53,
          "currency": "EUR",
          "date": 2024-03-24T23:00:00.000Z,
          "id": "+h5Bxj5lBGywu4UtfJ7ROSiVJjLYHqrGk4nRX9QuDcJrEiES1A3OI8EyW+KToW2JJdZbajx4yTPRCXLQlotlm2/P0PBZ8AqL",
        },
        Object {
          "address": "ROMAN PAVLOV",
          "amount": 500,
          "currency": "EUR",
          "date": 2024-02-07T23:00:00.000Z,
          "id": "+h5Bxj5lBGydLNdInhh39oT8MEW0Tovt7fQH97F17VRFy+hp83GjBFWKCZW4nBSOdTuweS8HjHs=",
        },
      ]
    `)
  })
})
