import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '25.07.2019',
        name: 'TAKE 5, St Petersburg',
        descr: '',
        mcc: '5814',
        iso: 'RUB',
        amount: '-140.00',
        payerdate: '',
        cardamount: '0.00',
        CUR: 'RUB',
        st: 'O',
        card: '40817810750020500000',
        clickable: '1'
      },
      {
        hold: true,
        date: new Date(2019, 6, 25),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -140,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'St Petersburg',
          title: 'TAKE 5',
          mcc: 5814,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        date: '22.07.2019',
        name: '"VF SERVISES", SANKT-PETERBU',
        descr: '',
        mcc: '9399',
        iso: 'RUB',
        amount: '-9372.92',
        payerdate: '24.07.2019',
        cardamount: '-9372.92',
        CUR: 'RUB',
        st: 'M',
        card: '40817810750020500000',
        clickable: '1'
      },
      {
        hold: false,
        date: new Date(2019, 6, 22),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -9372.92,
            fee: 0
          }
        ],
        merchant: {
          country: null,
          city: 'SANKT-PETERBU',
          title: '"VF SERVISES"',
          mcc: 9399,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    const account = { id: 'account', instrument: 'RUB' }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
