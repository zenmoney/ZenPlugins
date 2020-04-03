describe('dummy', () => { // Только для того чтобы jest не ругался что в файле должен быть тест
  it('should be true', () => {
    expect(true).toEqual(true)
  })
})

export const apiCards = [
  {
    id: '1234xxxxxxxx5678',
    balance: 50,
    prevCardId: null,
    cardCurrency: 'usd'
  }
]

export const apiWallets = [
  {
    ePid: '000-123456',
    balances: [
      {
        currentBalance: 500,
        currency: 'usd',
        accountNumber: '000-123456',
        accountType: 'EWallet'
      },
      {
        currentBalance: 0.0000,
        currency: 'eur',
        accountNumber: '000-123456',
        accountType: 'EWallet'
      },
      {
        currentBalance: 0.0000,
        currency: 'rub',
        accountNumber: '000-123456',
        accountType: 'EWallet'
      }
    ]
  }
]
