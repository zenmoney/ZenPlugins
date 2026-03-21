import { convertTransaction } from '../../../converters'
import { AccountInfo } from '../../../types'

describe('convertTransaction', () => {
  const accountRSD: AccountInfo = {
    accountNumber: '0001000316640',
    cardNumber: '',
    id: '0001000316640',
    name: 'Tekući račun',
    currency: 'RSD',
    balance: 23832.94
  }

  it.each([
    [
      {
        id: 'id_%2FwwIaVbmrPpW4HthBRTaEqdEq245HL97XRq0yVLNfKByA776TgC%2Bp8jSoheMHkx6%2BTldqpYX0ZiJNAzWLqpt06vLYFmsI29l',
        date: new Date('2025-02-24T00:00:00+03:00'),
        address: 'ATM OTP BG M GORKOG 11BEOGRAD',
        amount: -5000,
        currency: 'RSD',
        description: ''
      },
      {
        hold: false,
        date: new Date('2025-02-24T00:00:00+03:00'),
        movements: [
          {
            id: 'id_%2FwwIaVbmrPpW4HthBRTaEqdEq245HL97XRq0yVLNfKByA776TgC%2Bp8jSoheMHkx6%2BTldqpYX0ZiJNAzWLqpt06vLYFmsI29l',
            account: { id: '0001000316640' },
            sum: -5000,
            fee: 0,
            invoice: null
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RSD',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 5000,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'ATM OTP BG M GORKOG 11BEOGRAD',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: 'id_kv3pxHzRIwLoV9%2B5d6rQlvZRj2VhcXGFqgoa04cKbhKBnOt4j2Eet8WQXcyYzqbCgKyMyUaphSY%3D',
        date: new Date('2025-12-11T00:00:00+03:00'),
        address: 'Gotovinska isplata sa tekuceg racuna',
        amount: -31000,
        currency: 'RSD',
        description: ''
      },
      {
        hold: false,
        date: new Date('2025-12-11T00:00:00+03:00'),
        movements: [
          {
            id: 'id_kv3pxHzRIwLoV9%2B5d6rQlvZRj2VhcXGFqgoa04cKbhKBnOt4j2Eet8WQXcyYzqbCgKyMyUaphSY%3D',
            account: { id: '0001000316640' },
            sum: -31000,
            fee: 0,
            invoice: null
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RSD',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 31000,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Gotovinska isplata sa tekuceg racuna'
      }
    ]
  ])('converts cash withdrawal accountRSD', (accountTransaction, transaction) => {
    expect(convertTransaction(accountTransaction, accountRSD)).toEqual(transaction)
  })
})
