import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 275382617,
        balanceBefore: '3910.33',
        date: '2021-09-28T02:01:32Z',
        createdAt: '2021-09-28T02:01:32Z',
        state: 'paid',
        cashbackAmount: null,
        comment: null,
        balanceAfter: '4062.06',
        amount: '151.73',
        brand: '',
        mcid: '',
        card:
          {
            id: 354474,
            title: 'Maestro-MIR Cobadge Contactless 5 RUR',
            displayTitle: 'Maestro-MIR Cobadge Contactless 5 RUR',
            state: 'active',
            displayIcon: 'assets/cardicons/MC_MAESTRO.png'
          },
        canRepeat: false,
        account: { id: 240987, currencyId: 16, currencyIsoCode: 'rur' },
        geoInfo: {},
        categoryId: null,
        operation: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" КЭШБЭК по карте *8519. Место совершения транзакции: Дата: 30233810190000001545 151.73',
        cardOrAccount:
          {
            id: 354474,
            accountId: 240987,
            balance: '31.02',
            minimalBalance: '0.0',
            currencyId: 16,
            currencyIsoCode: 'rur',
            cardholder: 'NIKOLAY NIKOLAEV',
            number: '677384******8519',
            authLimit: '78000000000000601911',
            title: 'Maestro-MIR Cobadge Contactless 5 RUR',
            displayTitle: 'Maestro-MIR Cobadge Contactless 5 RUR',
            state: 'active',
            issueAt: '2020-07-14',
            expirationAt: '2025-07-31',
            expiresIn: 1359,
            unaffordable: false,
            lastOperationDate: '2021-10-30T03:24:25Z',
            firstOperationDate: '2020-08-10T06:56:07Z',
            blockedByDate: false,
            hidden: false,
            blankImageUrl: '/assets/cardblanks/mir_maestro.jpg',
            imageUrl: '/assets/cardimage/mir_maestro.png',
            iconUrl: '/assets/cardicons/MC_MAESTRO.png',
            keychain: null,
            svId: 683839,
            isIbs: true,
            cardType: { keyword: 'MC_MAESTRO' },
            canReissue: true,
            canBlock: true,
            isExpiring: false,
            canTokenized: true,
            canTokenizedMir: true,
            canP2p: true
          },
        cardOrAccountId: 'card_354474',
        event:
          {
            orderNumber: 1381195889,
            operationDate: '2021-09-28T02:01:32Z',
            orderDate: '2021-09-30',
            name: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            description: 'КЭШБЭК по карте *8519. Место совершения транзакции: Дата:',
            state: 'paid',
            stateDescription: 'Документ проведен',
            fk: 'ibs_id|1|541134941C',
            documentNumber: 937,
            operationKindId: '01',
            paymentPriority: '5',
            incomeDate: '2021-09-28T02:01:32Z',
            amount: '151.73',
            currencyIsoCode: 'rur',
            account: '30233810190000001545',
            destinationInn: '744719589676',
            destinationKpp: '0',
            destinationName: 'НИКОЛАЕВ НИКОЛАЙ НИКОЛАЕВИЧ',
            destinationAccount: '40817810300880010554',
            destinationBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            destinationAddress: 'Г. ЧЕЛЯБИНСК',
            destinationBic: '047501779',
            destinationCorrespondentAccount: '30101810400000000779',
            srcInn: '7421000200',
            srcKpp: '745101001',
            srcName: 'ПАО "ЧЕЛЯБИНВЕСТБАНК"',
            srcAccount: '30233810190000001545',
            srcBank: 'ПАО "ЧЕЛЯБИНВЕСТБАНК" Г ЧЕЛЯБИНСК',
            srcBic: '047501779',
            srcCorrespondentAccount: '30101810400000000779'
          }
      },
      {
        date: new Date('2021-09-28T02:01:32+00:00'),
        hold: false,
        movements: [
          {
            id: '275382617',
            account: { id: '206329' },
            invoice: null,
            sum: 151.73,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'КЭШБЭК по карте *8519'
      }
    ]
  ])('converts income', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: '206329', instrument: 'RUB' })).toEqual(transaction)
  })
})
