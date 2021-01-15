import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accounts:
          [
            {
              id: 170522760,
              customName: false,
              name: 'Счет Mastercard Unembossed',
              productName: 'Счет Mastercard Unembossed',
              number: '40817810000015511074',
              state: 'Открыт',
              stateCode: 'open',
              amount: 7302.49,
              type: 'card',
              registryAmount: 0,
              registry2Amount: 0,
              balance: 36063.61,
              currency: 'RUB',
              availableBalance: 7302.49,
              availBalanceRub: 7302.49,
              startDate: '11.05.2019',
              order: 1,
              category: 'account',
              requisites:
                {
                  bankName: 'ФИЛИАЛ "ВОЛЖСКИЙ" ПАО "СКБ-БАНК"',
                  address: 'Россия, 400066, Волгоградская обл, Волгоград г, Коммунистическая ул, д.16',
                  bic: '041856890',
                  inn: '6608003052',
                  kpp: '343503001',
                  corrAccount: '30101810800000000890'
                },
              allowInPayments: true,
              allowOutPayments: true,
              allowLoanRepayment: true,
              tariffPlanName: 'Универсальный',
              tariffPlanCode: '',
              tariffPlanLinkToRules: '',
              specType: 'EX',
              mostActive: false,
              pdfLink: '/export/account/pdf?id=170522760',
              overdraft: false,
              sbpDefault: false,
              bonusProgramState: 'enabled',
              availableBonuses: 297.36,
              accruedBonuses: 425.22,
              nextAccrualDate: '2020-09-01',
              lockedAmount: 0,
              canClose: true,
              bonusProgramGroup:
                {
                  firstCategory: '3',
                  secondCategory: '3',
                  thirdCategory: '3',
                  selectCategoryDate: '2020-07-06T13:03:43.000+0500'
                },
              petitionId: null,
              tariffPlanCanChange: false,
              cards: [170537804, 310720201]
            }
          ],
        cards:
          [
            {
              id: '4136158',
              state_description: 'Действующая',
              blocked: false,
              name: 'Mastercard Unembossed',
              customName: false,
              amount: 7302.49,
              currency: 'RUB',
              pan: '548386******6004',
              cardholderName: '',
              category: 'card',
              expDate: '2023-10-31',
              balance: 36063.61,
              availableBalance: 7302.49,
              holdAmount: 28761.12,
              primaryAccount: '40817810000015511074',
              accountId: 170522760,
              tariffLink: 'https://www.skbbank.ru/chastnym-licam/karty/icard',
              order: '1',
              primary: true,
              cardId: '4136158',
              brand: 'Mastercard Unembossed',
              storedId: 170537804,
              limits: [],
              status: '00',
              status_desc: 'Карта не блокирована',
              state: '2',
              kind: 'debit',
              loan_funds: 0,
              own_funds: 7302.49,
              used_loan_funds: 0,
              most_active: false,
              smsPhone: '79033164152',
              smsType: null,
              packageCashBack: 'forbidden',
              packageFreeCashOut: 'off',
              packageServ: false,
              paymentSystem: 'MC',
              limit_set_available: false,
              own_customer_card: true,
              holder_name: 'Иванов Иван Иванович',
              design_id: '23006',
              design_front_url: '/export/card/design?code=23006&side=front',
              design_back_url: '/export/card/design?code=23006&side=back',
              textColor: 'white',
              canUnlock: false,
              canReissue: false,
              canAddCard: false,
              contactless: true,
              smsNotify: 30,
              highCashBack: 30,
              freeWithdraw: 30,
              canViewCvv2: false,
              smsService: false,
              canIssuePlastic: false
            },
            {
              id: '4136158',
              state_description: 'Действующая',
              blocked: false,
              name: 'Mastercard Unembossed',
              customName: false,
              amount: 7302.49,
              currency: 'RUB',
              pan: '123456******7890',
              cardholderName: '',
              category: 'card',
              expDate: '2023-10-31',
              balance: 36063.61,
              availableBalance: 7302.49,
              holdAmount: 28761.12,
              primaryAccount: '40817810000015511074',
              accountId: 170522760,
              tariffLink: 'https://www.skbbank.ru/chastnym-licam/karty/icard',
              order: '1',
              primary: true,
              cardId: '4136158',
              brand: 'Mastercard Unembossed',
              storedId: 310720201,
              limits: [],
              status: '00',
              status_desc: 'Карта не блокирована',
              state: '2',
              kind: 'debit',
              loan_funds: 0,
              own_funds: 7302.49,
              used_loan_funds: 0,
              most_active: false,
              smsPhone: '79033164152',
              smsType: null,
              packageCashBack: 'forbidden',
              packageFreeCashOut: 'off',
              packageServ: false,
              paymentSystem: 'MC',
              limit_set_available: false,
              own_customer_card: true,
              holder_name: 'Иванов Иван Иванович',
              design_id: '23006',
              design_front_url: '/export/card/design?code=23006&side=front',
              design_back_url: '/export/card/design?code=23006&side=back',
              textColor: 'white',
              canUnlock: false,
              canReissue: false,
              canAddCard: false,
              contactless: true,
              smsNotify: 30,
              highCashBack: 30,
              freeWithdraw: 30,
              canViewCvv2: false,
              smsService: false,
              canIssuePlastic: false
            }
          ],
        loans: [],
        deposits: []
      },
      [
        {
          id: '40817810000015511074',
          type: 'ccard',
          title: 'Счет Mastercard Unembossed',
          instrument: 'RUB',
          balance: 7302.49,
          creditLimit: 0,
          syncIds: [
            '40817810000015511074',
            '548386******6004',
            '123456******7890'
          ],
          storedId: [170537804, 310720201]
        }
      ]
    ]
  ])('converts account with card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })

  it.each([
    [
      {
        accounts:
          [
            {
              id: 42424242,
              customName: false,
              name: 'Счет RUB',
              productName: 'Счет RUB',
              number: '40817810900087654321',
              state: 'Открыт',
              stateCode: 'open',
              amount: 1000.00,
              type: 'current',
              registryAmount: 0,
              registry2Amount: 0,
              balance: 1000.00,
              currency: 'RUB',
              availableBalance: 1000.00,
              availBalanceRub: 1000.00,
              startDate: '08.08.2020',
              order: 99,
              category: 'account',
              requisites: {
                bankName: 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
                address: 'Россия, 109004, Москва г, Москва г, Николоямская ул, д.40/22, корп.4',
                bic: '044520000',
                inn: '',
                kpp: '775002001',
                corrAccount: '30101810045250000472'
              },
              allowInPayments: true,
              allowOutPayments: true,
              allowLoanRepayment: true,
              tariffPlanName: 'Универсальный',
              tariffPlanCode: '',
              tariffPlanLinkToRules: '',
              specType: 'EX',
              mostActive: false,
              pdfLink: '/export/account/pdf?id=42424242',
              overdraft: false,
              sbpDefault: false,
              bonusProgramState: 'forbidden',
              availableBonuses: 0,
              accruedBonuses: 0,
              nextAccrualDate: null,
              lockedAmount: 0,
              canClose: true,
              bonusProgramGroup: {
                firstCategory: '0',
                secondCategory: '0',
                thirdCategory: '0',
                selectCategoryDate: null
              },
              petitionId: 850361797
            }
          ],
        cards: [],
        loans: [],
        deposits: []
      },
      [
        {
          id: '40817810900087654321',
          type: 'checking',
          title: 'Счет RUB',
          instrument: 'RUB',
          balance: 1000.00,
          creditLimit: 0,
          syncIds: ['40817810900087654321']
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
