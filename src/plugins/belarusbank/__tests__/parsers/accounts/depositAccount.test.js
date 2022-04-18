import { parseDeposits } from '../../../api'

describe('parseDeposits', () => {
  xit.each([
    [
      require('./depositAccount.html'),
      [
        {
          balance: '938.30',
          currency: 'USD',
          details: '&ltb&gtДополнительная информация&lt/b&gt&ltbr/&gtДата открытия: 27.02.2022&ltbr/&gtСрок возврата вклада: 27.08.2022&ltbr/&gt',
          id: 'BY93AKBB34141005395990070000',
          name: '"Беларусбанк-онл@йн" безотзывный (ИВ) 3, 6, 9, 13, 18, 24, 36 месяцев (капитализацией)',
          type: 'deposit'
        }
      ]
    ]
  ])('parses current deposit without percents', (html, accounts) => {
    expect(parseDeposits(html)).toEqual(accounts)
  })

  xit.each([
    [
      require('./depositAccount_1.html'),
      [
        {
          balance: '0.28',
          currency: 'USD',
          details: '&ltb&gtДополнительная информация&lt/b&gt&ltbr/&gtДата открытия: 21.09.2015&ltbr/&gtСрок возврата вклада: &ltbr/&gt',
          id: 'BY03AKBB34040000001201020128',
          name: 'Р/До востребования USD(01.08.96)',
          type: 'deposit'
        }
      ]
    ]
  ])('parses current deposit without refund period', (html, accounts) => {
    expect(parseDeposits(html)).toEqual(accounts)
  })
})
