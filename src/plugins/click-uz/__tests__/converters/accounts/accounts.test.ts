import { convertAccounts } from '../../../converters'
import { FetchedAccounts } from '../../../models'

describe('convertAccount', () => {
  it.each([
    [
      {
        cards: [
          {
            id: 16448770,
            bank_code: '880',
            bank_name: 'CLICK',
            bank_short_name: 'CLICK',
            card_name: 'Виртуальный счет',
            card_number: '8800810205401234',
            card_expire_date: null,
            card_status: 1,
            card_status_text: 'Активна',
            card_token: null,
            card_type: 'WALLET',
            font_color: 'FFFFFFFF',
            monitoring_status: 0,
            is_default: false,
            card_number_hash: '405FE7AE5E0AB36A4544812C4AF7ECDDA62F98FB1274866A874C71FC34B12345',
            cardholder: 'CLICK-Кошелек',
            currency_code: 'UZS',
            click: false,
            details: false,
            securecode_available: false,
            securecode_status: false,
            permission: {
              payment: 1,
              transfer: [
                'SMARTV',
                'WALLET'
              ],
              clickpass: 1,
              blockable: false,
              activation: false,
              copy_number: true,
              removable: 1
            },
            images: {
              background: 'https://cdn.click.uz/app/evo/card/wallet/light-bg_v1.png',
              logo: 'https://cdn.click.uz/app/evo/card/wallet/light-logo_v3.png',
              mini_logo: 'https://cdn.click.uz/app/evo/card/wallet/light-mini-logo_v3.png',
              cardtype: null,
              cardtype_mini: 'https://cdn.click.uz/app/evo/card/wallet/light-mini-logo_v3.png'
            },
            transfer_limits: {
              send_min_limit: 1000,
              send_max_limit: 999999999,
              receive_min_limit: 1000,
              receive_max_limit: 1344998.64,
              percent: 0
            },
            options: {
              is_masked: false,
              button_set: 'WALLET',
              display_type: 'WALLET'
            }
          },
          {
            id: 23946997,
            bank_code: '004',
            bank_name: 'Агробанк',
            bank_short_name: 'AGRO',
            card_name: 'VISA-карта',
            card_number: '4187 80** **** 1337',
            card_expire_date: '----',
            card_status: 1,
            card_status_text: 'Активна',
            card_token: '418780TUVFAW1337',
            card_type: 'AGRVISAUSD',
            font_color: 'FFFFFFFF',
            monitoring_status: 0,
            is_default: false,
            card_number_hash: 'E31CC70BA9D13EF6D40B7FDD5606F9E57399C47E761EF8F1EEB5400692212345',
            cardholder: 'ANTONOV ANTOV ANTONOVICH',
            currency_code: 'USD',
            click: false,
            details: true,
            securecode_available: false,
            securecode_status: false,
            permission: {
              payment: 0,
              transfer: [],
              clickpass: 0,
              blockable: true,
              activation: false,
              copy_number: true,
              removable: 1
            },
            images: {
              background: 'https://cdn.click.uz/app/evo/card/agrvisausd/agro-bg_v1.png',
              logo: 'https://cdn.click.uz/app/evo/card/agrvisausd/agro-logo_v1.png',
              mini_logo: 'https://cdn.click.uz/app/evo/card/agrvisausd/agro-mini-logo_v1.png',
              cardtype: 'https://cdn.click.uz/app/evo/card/types/agrvisausd_v1.png',
              cardtype_mini: 'https://cdn.click.uz/app/evo/card/types/agrvisausd_small_v1.png'
            },
            transfer_limits: {
              send_min_limit: 1000,
              send_max_limit: 10000000000,
              receive_min_limit: 1000,
              receive_max_limit: 10000000000,
              percent: 0
            },
            options: {
              is_masked: true,
              button_set: 'VISA',
              display_type: 'VISA'
            }
          },
          {
            id: 18291234,
            bank_code: '062',
            bank_name: 'TBC Банк',
            bank_short_name: 'TBC',
            card_name: 'Humo от TBC',
            card_number: '9860 43** **** 1234',
            card_expire_date: '0625',
            card_status: -999,
            card_status_text: 'Профилактика',
            card_token: null,
            card_type: 'HUMO',
            font_color: 'FFFFFFFF',
            monitoring_status: 0,
            is_default: false,
            card_number_hash: 'A5CAB4A5319FC6B32816AA669CE955639399C47E761EF8F1EEB5400692212345',
            cardholder: 'ANTONOV ANTOV ANTONOVICH',
            currency_code: 'UZS',
            click: false,
            details: false,
            securecode_available: false,
            securecode_status: false,
            permission:
              {
                payment: 1,
                transfer: ['SMARTV', 'WALLET', 'HUMO'],
                clickpass: 1,
                blockable: false,
                activation: false,
                copy_number: true,
                removable: 1
              },
            images:
              {
                background: 'https://cdn.click.uz/app/evo/card/humo/tbc-bg_v1.png',
                logo: 'https://cdn.click.uz/app/evo/card/humo/tbc-logo_v1.png',
                mini_logo: 'https://cdn.click.uz/app/evo/card/humo/tbc-mini-logo_v1.png',
                cardtype: 'https://cdn.click.uz/app/evo/card/types/humo_v1.png',
                cardtype_mini: 'https://cdn.click.uz/app/evo/card/types/humo_small_v1.png'
              },
            transfer_limits:
              {
                send_min_limit: 1000,
                send_max_limit: 13000000,
                receive_min_limit: 1000,
                receive_max_limit: 5000000,
                percent: 0.8
              },
            options: { is_masked: true, button_set: 'HUMO', display_type: 'HUMO' }
          }
        ],
        balances: [
          {
            account_id: 16448770,
            balance: 5001.36
          },
          {
            account_id: 23946997,
            balance: 0
          }
        ]
      },
      [
        {
          balance: 5001.36,
          id: '16448770',
          instrument: 'UZS',
          savings: false,
          syncIds: [
            '8800810205401234'
          ],
          title: 'Виртуальный счет',
          type: 'checking'
        },
        {
          balance: 0,
          id: '23946997',
          instrument: 'USD',
          savings: false,
          syncIds: [
            '418780******1337'
          ],
          title: 'VISA-карта',
          type: 'ccard'
        },
        {
          archived: true,
          balance: null,
          id: '18291234',
          instrument: 'UZS',
          savings: false,
          syncIds: [
            '986043******1234'
          ],
          title: 'Humo от TBC',
          type: 'ccard'
        }
      ]
    ],
    [
      {
        cards: [
          {
            id: 8189532,
            bank_code: '014',
            bank_name: 'Ипак Йули Банк',
            bank_short_name: 'IPAK',
            card_name: 'Карта UZCARD',
            card_number: '8600 14** **** 1234',
            card_expire_date: '1019',
            card_status: -100,
            card_status_text: 'Карта не найдена/Неверный срок',
            card_token: '5bcec838ca57d707583a77e0',
            card_type: 'SMARTV',
            font_color: 'FFFFFFFF',
            monitoring_status: 0,
            is_default: false,
            card_number_hash: '5F028E19AFF1F66BDD162C4C82C5FAF00F5BF377EC3C20C2611003B50A87FC4C',
            cardholder: 'ANTONOV ANTOV ANTONOVICH',
            currency_code: 'UZS',
            click: false,
            details: false,
            securecode_available: false,
            securecode_status: false,
            permission:
              {
                payment: 1,
                transfer: ['SMARTV', 'WALLET', 'HUMO'],
                clickpass: 1,
                blockable: false,
                activation: false,
                copy_number: false,
                removable: 1
              },
            images:
              {
                background: 'https://cdn.click.uz/app/evo/card/uzcard/ipak-bg_v1.png',
                logo: 'https://cdn.click.uz/app/evo/card/uzcard/ipak-logo_v1.png',
                mini_logo: 'https://cdn.click.uz/app/evo/card/uzcard/ipak-mini-logo_v1.png',
                cardtype: 'https://cdn.click.uz/app/evo/card/types/uzcard_v1.png',
                cardtype_mini: 'https://cdn.click.uz/app/evo/card/types/uzcard_small_v1.png'
              },
            transfer_limits:
              {
                send_min_limit: 5000,
                send_max_limit: 10000000000,
                receive_min_limit: 5000,
                receive_max_limit: 10000000000,
                percent: 1
              },
            options: { is_masked: true, button_set: 'SMARTV', display_type: 'SMARTV' }
          }
        ],
        balances: [
          { account_id: 22787386, balance: 5458.02 },
          { account_id: 12745888, balance: 149355.44 }
        ]
      },
      [
        {
          archived: true,
          balance: null,
          id: '8189532',
          instrument: 'UZS',
          savings: false,
          syncIds: ['860014******1234'],
          title: 'Карта UZCARD',
          type: 'ccard'
        }
      ]
    ],
    [
      {
        cards:
          [
            {
              id: 23946997,
              bank_code: '004',
              bank_name: 'Агробанк',
              bank_short_name: 'AGRO',
              card_name: 'VISA-карта',
              card_number: '4187 80** **** 1234',
              card_expire_date: '----',
              card_status: 1,
              card_status_text: 'Активна',
              card_token: '418780TUVFAW0110',
              card_type: 'AGRVISAUSD',
              font_color: 'FFFFFFFF',
              monitoring_status: 0,
              is_default: false,
              card_number_hash: 'E31CC70BA9D13EF6D40B7FDD5606F9E4006922A516B57399C47E761EF8F1EEB5',
              cardholder: 'ANTONOV ANTOV ANTONOVICH',
              currency_code: 'USD',
              click: false,
              details: true,
              securecode_available: false,
              securecode_status: false,
              permission:
                {
                  payment: 0,
                  transfer: [],
                  clickpass: 0,
                  blockable: true,
                  activation: false,
                  copy_number: true,
                  removable: 1
                },
              images:
                {
                  background: 'https://cdn.click.uz/app/evo/card/agrvisausd/agro-bg_v1.png',
                  logo: 'https://cdn.click.uz/app/evo/card/agrvisausd/agro-logo_v1.png',
                  mini_logo: 'https://cdn.click.uz/app/evo/card/agrvisausd/agro-mini-logo_v1.png',
                  cardtype: 'https://cdn.click.uz/app/evo/card/types/agrvisausd_v1.png',
                  cardtype_mini: 'https://cdn.click.uz/app/evo/card/types/agrvisausd_small_v1.png'
                },
              transfer_limits:
                {
                  send_min_limit: 1000,
                  send_max_limit: 10000000000,
                  receive_min_limit: 1000,
                  receive_max_limit: 10000000000,
                  percent: 0
                },
              options: { is_masked: true, button_set: 'VISA', display_type: 'VISA' }
            }
          ],
        balances: [
          { account_id: 22787386, balance: 5458.02 },
          { account_id: 12745888, balance: 149355.44 }
        ]
      },
      [
        {
          balance: null,
          id: '23946997',
          instrument: 'USD',
          savings: false,
          syncIds: [
            '418780******1234'
          ],
          title: 'VISA-карта',
          type: 'ccard'
        }
      ]
    ],
    [
      {
        cards:
          [
            {
              id: 18953765,
              bank_code: '880',
              bank_name: 'CLICK',
              bank_short_name: 'CLICK',
              card_name: 'Kham1dch1kk',
              card_number: '8801703211773840',
              card_expire_date: null,
              card_status: 0,
              card_status_text: 'Не активна',
              card_token: null,
              card_type: 'WALLET',
              font_color: 'FFFFFFFF',
              monitoring_status: 0,
              is_default: false,
              card_number_hash: 'B4ECD1CB0352CDF2045526A016FF00FF5A831C05F42E9A76F9BD9AF33B37CA84',
              cardholder: 'CLICK-Кошелек',
              currency_code: 'UZS',
              click: false,
              details: false,
              securecode_available: false,
              securecode_status: false,
              permission:
                {
                  payment: 1,
                  transfer: ['SMARTV', 'WALLET'],
                  clickpass: 1,
                  blockable: false,
                  activation: true,
                  copy_number: false,
                  removable: 1
                },
              images:
                {
                  background: 'https://cdn.click.uz/app/evo/card/wallet/light-bg_v1.png',
                  logo: 'https://cdn.click.uz/app/evo/card/wallet/light-logo_v3.png',
                  mini_logo: 'https://cdn.click.uz/app/evo/card/wallet/light-mini-logo_v3.png',
                  cardtype: null,
                  cardtype_mini: 'https://cdn.click.uz/app/evo/card/wallet/light-mini-logo_v3.png'
                },
              transfer_limits:
                {
                  send_min_limit: 1000,
                  send_max_limit: 999999999,
                  receive_min_limit: 1000,
                  receive_max_limit: 1497632.5,
                  percent: 0
                },
              options:
                {
                  is_masked: false,
                  button_set: 'WALLET',
                  display_type: 'WALLET'
                }
            }
          ],
        balances: [
          { account_id: 25700072, balance: 692197.5 },
          { account_id: 25699681, balance: 177824.23 },
          { account_id: 25700054, balance: 339268.41 }
        ]
      },
      [
        {
          archived: true,
          balance: null,
          id: '18953765',
          instrument: 'UZS',
          savings: false,
          syncIds: ['8801703211773840'],
          title: 'Kham1dch1kk',
          type: 'checking'
        }
      ]
    ],
    [
      {
        cards:
          [
            {
              id: 26686775,
              bank_code: '004',
              bank_name: 'Агробанк',
              bank_short_name: 'AGRO',
              card_name: 'VISA-карта',
              card_number: '4187 18** **** 1234',
              card_expire_date: '----',
              card_status: 1,
              card_status_text: 'Активна',
              card_token: '418781VMEEQE6956',
              card_type: 'AGRVISASUM',
              font_color: 'FFFFFFFF',
              monitoring_status: 0,
              is_default: false,
              card_number_hash: '0BA3F923FE18996D9A50EBEAA5D8E9539603816D10DD059F1D1EF428C5A74540',
              cardholder: 'ANTONOV ANTOV ANTONOVICH',
              currency_code: 'UZS',
              click: true,
              details: true,
              securecode_available: false,
              securecode_status: false,
              is_identified: null,
              permission:
                {
                  payment: 0,
                  transfer: [],
                  clickpass: 0,
                  blockable: true,
                  activation: false,
                  copy_number: true,
                  removable: 1
                },
              images:
                {
                  background: 'https://cdn.click.uz/app/evo/card/agrvisasum/agro-bg_v1.png',
                  logo: 'https://cdn.click.uz/app/evo/card/agrvisasum/agro-logo_v3.png',
                  mini_logo: 'https://cdn.click.uz/app/evo/card/agrvisasum/agro-mini-logo_v2.png',
                  cardtype: 'https://cdn.click.uz/app/evo/card/types/agrvisasum_v1.png',
                  cardtype_mini: 'https://cdn.click.uz/app/evo/card/types/agrvisasum_small_v1.png',
                  badge_url: 'https://cdn.click.uz/app/evo/card/badges/click_v1.png'
                },
              transfer_limits:
                {
                  send_min_limit: 1000,
                  send_max_limit: 10000000000,
                  receive_min_limit: 1000,
                  receive_max_limit: 10000000000,
                  percent: 0
                },
              options: { is_masked: true, button_set: 'VISA', display_type: 'VISA' }
            },
            {
              id: 19619132,
              bank_code: '062',
              bank_name: 'TBC Банк',
              bank_short_name: 'TBC',
              card_name: '8684 TBC Humo',
              card_number: '9860 53** **** 1234',
              card_expire_date: '1222',
              card_status: -99,
              card_status_text: 'Срок действия карты истек',
              card_token: null,
              card_type: 'HUMO',
              font_color: 'FFFFFFFF',
              monitoring_status: 0,
              is_default: false,
              card_number_hash: '959B18611385F776730B1F33008C21DA45D206513B4C04E29A7BCBB7B0FC6005',
              cardholder: 'ANTONOV ANTOV ANTONOVICH',
              currency_code: 'UZS',
              click: false,
              details: false,
              securecode_available: false,
              securecode_status: false,
              is_identified: null,
              permission:
                {
                  payment: 1,
                  transfer: ['SMARTV', 'WALLET', 'HUMO'],
                  clickpass: 1,
                  blockable: false,
                  activation: false,
                  copy_number: false,
                  removable: 1
                },
              images:
                {
                  background: 'https://cdn.click.uz/app/evo/card/humo/tbc-bg_v1.png',
                  logo: 'https://cdn.click.uz/app/evo/card/humo/tbc-logo_v1.png',
                  mini_logo: 'https://cdn.click.uz/app/evo/card/humo/tbc-mini-logo_v1.png',
                  cardtype: 'https://cdn.click.uz/app/evo/card/types/humo_v1.png',
                  cardtype_mini: 'https://cdn.click.uz/app/evo/card/types/humo_small_v1.png',
                  badge_url: null
                },
              transfer_limits:
                {
                  send_min_limit: 1000,
                  send_max_limit: 15000000,
                  receive_min_limit: 1000,
                  receive_max_limit: 100000000,
                  percent: 0.8
                },
              options: { is_masked: true, button_set: 'HUMO', display_type: 'HUMO' }
            }
          ],
        balances: [
          { account_id: 26686775, balance: 7001 },
          { account_id: 25699681, balance: 177824.23 },
          { account_id: 25700054, balance: 339268.41 }
        ]
      },
      [
        {
          balance: 7001,
          id: '26686775',
          instrument: 'UZS',
          savings: false,
          syncIds: [
            '418718******1234'
          ],
          title: 'VISA-карта',
          type: 'ccard'
        },
        {
          archived: true,
          balance: null,
          id: '19619132',
          instrument: 'UZS',
          savings: false,
          syncIds: [
            '986053******1234'
          ],
          title: '8684 TBC Humo',
          type: 'ccard'
        }
      ]
    ]
  ])('convert accounts', (apiAccounts: FetchedAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
