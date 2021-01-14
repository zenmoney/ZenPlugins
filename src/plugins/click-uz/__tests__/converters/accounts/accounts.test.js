import { convertAccounts } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      [
        {
          id: 12000956,
          accno: '8600 02 ** **** 0725',
          description: 'Карта UZCARD-Online',
          branch: '00000',
          bank_name: 'Узнацбанк',
          currency: '000',
          currency_code: 'UZS',
          currency_name: 'сум ',
          acc_abs: 'SMARTV ',
          access: 2,
          card_num: '8600 02 ** **** 0725',
          expire_date: '1124',
          short_name: 'NBU',
          card_num_crypted: 'dNcXNvF332B239hPU7L+XK2bb15YFlmBf9P1tqgiHbPbB6urEB4+4A99/Df93/3fEiNtBBBQUWotEiK7/brwbfgy4Ub3OKPyUEJU4BuC3ZDPS2f3zxFxNJfhXCKG5AqT8SSZmYWubXQ/UTYopXQPN7W6xb9jDHyfnaqHjdykbGo=',
          card_num_hash: '9A32C95DA2EC505D4B7EA92989776D118B68455C8A78D6AD740D8A311B7D4C7B|9711E0E6F6A8F4B4E0530100007F3A67',
          is_uzcard: 1,
          removable: 1,
          background_color_top: '106,84,159',
          background_color_bottom: '177,149,251',
          font_color: '255,255,255',
          card_background_url: 'https://cdn.click.uz/app/rev2/card/uzcard/nbu.png',
          image_url: 'https://cdn.click.uz/app/rev2/bank/nbu.png',
          payment_allowed: 1,
          p2p_allowed: 1,
          monitoring_token: '',
          card_status: 1,
          card_status_text: 'Активна',
          card2wallet: 1,
          wallet2card: true,
          wallet2wallet: true,
          checksum: 1251241451
        },
        {
          id: 13988320,
          accno: '8801504201237823',
          description: 'Виртуальный счет',
          branch: '00000',
          bank_name: 'CLICK',
          currency: '000',
          currency_code: 'UZS',
          currency_name: 'сум ',
          acc_abs: 'WALLET ',
          access: 2,
          card_num: '8801504201237823',
          expire_date: null,
          short_name: 'CLICK',
          card_num_crypted: 'bd5PHKohgI9I0mNtYypFk5+KNexxfitC1OgXusZuQchyyWpt7wvfEB9LCHNScF8LjUzwqcnOWQb8+GxhF9D8+08VSMBJJdwDYFuBJUPXyJe097UWDzVBoWu4Dm4X6WTBF4teLwma7pZPZOyyZtfN/vSxCdFGHp85PV5DfQb3afw=',
          card_num_hash: '7F6633EB3A41B5D194A17ACCC41FB3083E23D76F060B029F0BAC48140AF33E46|',
          is_uzcard: 0,
          removable: 0,
          background_color_top: '192,62,108',
          background_color_bottom: '255,141,101',
          font_color: '45,45,45',
          card_background_url: 'https://cdn.click.uz/app/rev2/card/wallet/light.png',
          image_url: 'https://cdn.click.uz/app/rev2/bank/wallet.png',
          payment_allowed: 0,
          p2p_allowed: 0,
          monitoring_token: '',
          card_status: 0,
          card_status_text: 'Не активна',
          card2wallet: 0,
          wallet2card: true,
          wallet2wallet: true,
          checksum: -1355966782,
          balance: 10905
        },
        {
          id: 15777643,
          accno: '8801408204063029',
          description: 'CLICK-кошелёк Light',
          branch: '00000',
          bank_name: 'CLICK',
          currency: '000',
          currency_code: 'UZS',
          currency_name: 'сум ',
          acc_abs: 'WALLET ',
          access: 2,
          card_num: '8801408204063029',
          expire_date: null,
          short_name: 'CLICK',
          card_num_crypted: 'Te0Q4Z8t8ROvzTQ7d1s/wfiLUgAOPxazsP/vdjsEMFljuo+BptCFVnCM7DQxh1+1PjhHkn4Ugkfupl6276uS4zRarXRhIstA7Fy/omSljIy6hz/NrBjQNZN246iUFhve5GaGOcG27rP8iPqXYsuO8XG9IYQS6QJ4CgRgSTQNKbo=',
          card_num_hash: '8D9D761A3B3FEF0B22A5BB2A33A57B69123C18F93FF28DA5F2B551FFD1CAC814|',
          is_uzcard: 0,
          removable: 0,
          background_color_top: '192,62,108',
          background_color_bottom: '255,141,101',
          font_color: '45,45,45',
          card_background_url: 'https://cdn.click.uz/app/rev2/card/wallet/light.png',
          image_url: 'https://cdn.click.uz/app/rev2/bank/wallet.png',
          payment_allowed: 0,
          p2p_allowed: 0,
          monitoring_token: '',
          card_status: 0,
          card_status_text: 'Не активна',
          card2wallet: 0,
          wallet2card: true,
          wallet2wallet: true,
          checksum: -496207544
        }
      ],
      [
        {
          account_id: 12000956,
          balance: 283.84,
          error: 0
        },
        {
          account_id: 13988320,
          balance: 10905,
          error: 0
        },
        {
          account_id: 15777643,
          balance: 0,
          error: 0
        }
      ],
      [
        {
          id: '12000956',
          type: 'ccard',
          title: 'Карта UZCARD-Online',
          instrument: 'UZS',
          syncIds: [
            '860002******0725'
          ],
          balance: 283.84
        },
        {
          id: '13988320',
          type: 'checking',
          title: 'Виртуальный счет',
          instrument: 'UZS',
          syncIds: [
            '880150******7823'
          ],
          balance: 10905
        },
        {
          id: '15777643',
          type: 'checking',
          title: 'CLICK-кошелёк Light',
          instrument: 'UZS',
          syncIds: [
            '880140******3029'
          ],
          balance: 0
        }
      ]
    ]
  ])('converts broker accounts', (apiAccounts, apiBalances, accounts) => {
    expect(convertAccounts(apiAccounts, apiBalances)).toEqual(accounts)
  })
})
