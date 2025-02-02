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
          "accountNumber": "0001000512876",
          "balance": 249233.58,
          "cardNumber": "0xC4952DBB2BB24ECAFF9655505605F0F0",
          "currency": "RSD",
          "id": "0001000512876-0xC4952DBB2BB24ECAFF9655505605F0F0",
          "name": "4242XXXXXXXX4061",
        },
        Object {
          "accountNumber": "0001000512876",
          "balance": 249233.58,
          "cardNumber": "0x3A7A78AB70965C9C2323270A293FA54F",
          "currency": "RSD",
          "id": "0001000512876-0x3A7A78AB70965C9C2323270A293FA54F",
          "name": "9891XXXXXXXX6625",
        },
        Object {
          "accountNumber": "0001000512876",
          "balance": 249233.58,
          "cardNumber": "",
          "currency": "RSD",
          "id": "0001000512876",
          "name": "Tekući račun",
        },
        Object {
          "accountNumber": "0001000512877",
          "balance": 2979.07,
          "cardNumber": "",
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

    expect(response).toEqual(
      [
        {
          address: 'LP ANDREY SERAPIONOV PR BE',
          amount: -5000,
          currency: 'RSD',
          date: new Date('2024-10-11T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROQiAnv9eKjzzUz%2BKkcY17oVfGcac1cpGXH2hbQafqYVaR0zItwhlKuOVk0qzP4RfUc8R0cB5b%2Brb'
        },
        {
          address: 'BLVCK SUGAR DOO BE',
          amount: -850,
          currency: 'RSD',
          date: new Date('2024-10-11T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROQiAnv9eKjzzX9TfebVLqb1omJLFzKwNFK63CgLt%2BCwFb6mv2B5sE6ZvvPwhZFnucOH9zKee0pDC'
        },
        {
          address: 'SELECTIVE CENTAR KNEZ BE',
          amount: -2150,
          currency: 'RSD',
          date: new Date('2024-10-11T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROQiAnv9eKjzzAwZGs4gh3RVQsAS279lTUOIDuDdF0ZB3O%2FFsxX6VBmGsn%2BxHeaSsNZzqSpOlhn%2FS'
        },
        {
          address: 'PP VIDIN KAPIJA A1 BEOGRAD',
          amount: -450,
          currency: 'RSD',
          date: new Date('2024-10-09T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROW%2BDYw0B37YdNg3%2B3cjmm40EKzx4BEDfrMQelRZkazIjUpYF2dR4LyoTrZHdVbqdc8vUq%2BjISqxR'
        },
        {
          address: 'LILLY APOTEKA 269 BE',
          amount: -1305.95,
          currency: 'RSD',
          date: new Date('2024-10-09T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7RORKfHQXYp29vjWAesZBAPA2vq3eEsdM2vDZeC%2BSqNxG%2FKcf5TopUo9Uqi9YNOHp8yE%2BgMPDeOUL1'
        },
        {
          address: 'H&M GALERIJA RS 0520 BEOGRAD',
          amount: -1117,
          currency: 'RSD',
          date: new Date('2024-10-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHUCkr8H4Y8NzC7nAThSgF3KfisQBq%2Bhhu%2BBj8Y0KOoXigSWwxeyxN1zkoico0tVDR'
        },
        {
          address: 'H&M GALERIJA RS 0520 BEOGRAD',
          amount: -6081,
          currency: 'RSD',
          date: new Date('2024-10-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHmFaIW1okYp15M6gW5mu9%2FuCwDxxqK7K%2Bg4q8MGJen3Diyg98rhcN3OyAdthi7QbW'
        },
        {
          address: 'DON DON LULU 23 BEOGRAD SAVSKI',
          amount: -393,
          currency: 'RSD',
          date: new Date('2024-10-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHuzaP7%2BB9LHcKdGwn2lfDqVzZZVr0qPI5lHa5tVIXpnpKbKpix82xRkmcrlxxivnP'
        },
        {
          address: 'PAYSPOT CORNER 12 BEOGRAD SAVSKI',
          amount: -1999,
          currency: 'RSD',
          date: new Date('2024-10-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROSByFhq1mSAHnhPD4SwQ5%2BdkzpMrXR3Apu2VJrKwBnVSLhz5T4gyYUsq6Il6maqcGyrre7qV0h0P'
        },
        {
          address: 'SUSHIRRITO BW BE',
          amount: -2230,
          currency: 'RSD',
          date: new Date('2024-10-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROXCpqc%2FgQY3tMC0oRtmp3FZhztLjcXl7DfINqELg3RYn1YqUZvSoj70jtihxumnx74OHMnl%2BUmGr'
        }
      ]
    )
  })

  it('should parse account transactions', async () => {
    const mockBody = fs.readFileSync(
      path.resolve(__dirname, './__mocks__/transactions-post-2.html'),
      'utf8'
    )

    const response = parseTransactions(mockBody)

    expect(response).toEqual(
      [
        {
          address: 'K-ETA 0215663441',
          amount: -7.14,
          currency: 'EUR',
          date: new Date('2024-10-21T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROexS%2BMuFAgyqGLsF4zn6wmg2%2Bls9%2B8iDIMN9DKrpLesjKGAnTGDgwRa0CmWUudJmfv5%2FFnM8dI9l'
        },
        {
          address: 'MOBILNA APP ONEA PODGORICA',
          amount: -4,
          currency: 'EUR',
          date: new Date('2024-10-21T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROexS%2BMuFAgyqD%2BWpkTldkqwcd41njf%2FDJdlqZFMz0HEfwAnn4IB%2BwvQzycvw%2F2jCJBwfJmv9ymvj'
        },
        {
          address: 'VOLI 1 PODGORICA',
          amount: -8.33,
          currency: 'EUR',
          date: new Date('2024-10-18T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7RObwJBTpX2tfccY5WOXPWm5g6XirWQBvUYcxyBq3X9tIh66iV7eS%2Bpk2DCLfxYS%2Bo0cELG8OPzvg%2B'
        },
        {
          address: 'MARIEN PLATZ PODGORICA',
          amount: -71.62,
          currency: 'EUR',
          date: new Date('2024-10-18T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7RObwJBTpX2tfcSXO15NgJyAT4Dd%2BqRWWlV4BYbsQZs1moUnIC%2FOtHwGEri%2Fp3hFnlSvvxPAIiz0xS'
        },
        {
          address: 'THE BRITISH COUNCIL MANCHESTER 23500.00 RSD\nKurs:117.0177',
          amount: -201.46,
          currency: 'EUR',
          date: new Date('2024-10-14T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROVItA%2F1GrciWf6yiBQboMNZhIFXhNjwOBNY877Ypq%2BQq6T2grgK7sjST6dR6hDkQI0EEjwe0TTRR'
        },
        {
          address: 'APPLE.COM/BILL ITUNES.COM',
          amount: -98.99,
          currency: 'EUR',
          date: new Date('2024-09-31T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROeNQ5v0%2BZB%2FLp92ZxoYpjTWuMELQqBegH1PuKDjHm2e3rwj%2ByG5VDg1OZFrSGlg6t3MXgb5D%2BolT'
        },
        {
          address: 'AIR SERBIA A.D BEOGRAD NOVI BEOGRAD 36992.00\nRSD Kurs:117.0936',
          amount: -315.92,
          currency: 'EUR',
          date: new Date('2024-09-26T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROeDyeYpiaLJvewDfWrvlOG64LBWMkfmOlNGcepDegFz3t636MfLGsPS0ErAC54B8idWx8cH7zokZ'
        },
        {
          address: 'CHIP CARD AD BEOGRAD KOPAONIK 600.00 RSD\nKurs:117.0936',
          amount: -5.12,
          currency: 'EUR',
          date: new Date('2024-09-26T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROeDyeYpiaLJv%2Fl7BwqxRalCcAa6g2Nv2IYQlD9jr3%2FHvORIjAFf2IjISI8X6jMij7vajo%2Fm8CIvZ'
        },
        {
          address: 'AIR SERBIA A.D BEOGRAD NOVI BEOGRAD 63147.00\nRSD Kurs:117.0936',
          amount: -539.29,
          currency: 'EUR',
          date: new Date('2024-09-26T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROeDyeYpiaLJvnp1c2%2FCl5OZ3DPyOExYV3GVElhraeyusFlT8JkDbp7y1NN8JPA2%2Bjc8OONpKh4K6'
        },
        {
          address: 'AIR SERBIA A.D BEOGRAD NOVI BEOGRAD 20455.00\nRSD Kurs:117.0917',
          amount: -167.16,
          currency: 'EUR',
          date: new Date('2024-09-25T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROV3Qa3XqC9Rhi5rpkiLRsN0oWg85cW3c%2FD9kPnaO%2FTLMOOBqFL3fy6%2FeIhaFdxeNXotNK41IhZvL'
        },
        {
          address: 'APPLE.COM/US 800-676-2775 99.00 USD\nKurs:1.1195',
          amount: -89.33,
          currency: 'EUR',
          date: new Date('2024-09-25T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROV3Qa3XqC9RhUhavsPPoyv9nShr%2Bj7yuZ%2B2P2MRKxi%2FRHsjWSj78bzYS1DZyLjl0EpifURazx0Me'
        },
        {
          address: 'Prodaja deviza',
          amount: -10,
          currency: 'EUR',
          date: new Date('2024-09-05T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGyJ6XvrOBRhDLeeN%2BxJ0%2Fw4XMM8TTJEEZ53CZCjtJj68Ido9BFHwz3TUOdSJ2hA7SM%3D'
        },
        {
          address: 'CC_NEW FITNESS BEOGRAD 3320.00 RSD\nKurs:117.0222',
          amount: -28.37,
          currency: 'EUR',
          date: new Date('2024-08-30T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROWW8SMindbi9qyWTYzL6T0%2BiBI2QHnsg8kphdlLWyI599KGB4zJBkqCIlE8Aib%2FR4vGAm63DMjYt'
        },
        {
          address: 'CC_NEW FITNESS BEOGRAD 3320.00 RSD\nKurs:117.0553',
          amount: -28.36,
          currency: 'EUR',
          date: new Date('2024-07-31T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROSMX4igovJ%2FmtS2Jk10Pkqrt9MrwJ14QtjyPZld6fvZDhvXC7DqjMPkfMP5I1%2BJMELw7YSv%2B8Nra'
        },
        {
          address: 'CINEPLEXX SRB DO NOVI BEOGRAD 3210.00 RSD\nKurs:117.0680',
          amount: -19.86,
          currency: 'EUR',
          date: new Date('2024-07-25T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROT4IailIraT5c5%2FAjyJOcSAH6hRg11RtwQ58MITi7ZmmRSpk02HvNxWLyDmAjwGk8B29oj2UWfNh'
        },
        {
          address: 'Prodaja deviza',
          amount: -10,
          currency: 'EUR',
          date: new Date('2024-05-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGyJ6XvrOBRhDLHO4MP7xsK4%2BKHdPBOyRoi8Iavw0zjReAOpKRwd35zVLkElh0b4KVs%3D'
        },
        {
          address: 'ROMAN PAVLOV',
          amount: 3800,
          currency: 'EUR',
          date: new Date('2024-04-14T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGydLNdInhh39gudFQ5POsk76CNhd%2B9wvSjblV5pYsUGEJFr3dEnMpxBfDNIPvv3S7A%3D'
        },
        {
          address: 'FAVORIT CGI 6 PETROVAC NA M 1000.00 RSD\nKurs:117.2024',
          amount: -8.53,
          currency: 'EUR',
          date: new Date('2024-03-25T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGywu4UtfJ7ROSiVJjLYHqrGk4nRX9QuDcJrEiES1A3OI8EyW%2BKToW2JJdZbajx4yTPRCXLQlotlm2%2FP0PBZ8AqL'
        },
        {
          address: 'ROMAN PAVLOV',
          amount: 500,
          currency: 'EUR',
          date: new Date('2024-02-08T00:00:00'),
          description: '',
          id: 'id_%2Bh5Bxj5lBGydLNdInhh39oT8MEW0Tovt7fQH97F17VRFy%2Bhp83GjBFWKCZW4nBSOdTuweS8HjHs%3D'
        }
      ]
    )
  })
})
