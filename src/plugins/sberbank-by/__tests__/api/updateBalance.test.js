import { updateAccountBalance } from '../../api.js'

describe('updateAccountBalance', () => {
  it.each([
    [
      {
        productClassId: 1,
        productTypeId: 821,
        productName: null,
        icon: '',
        background: '',
        backColor1: '#9FA3C1',
        backColor2: '#B3C0BE',
        contractType: 1,
        contractId: '367719901',
        contractNumber: '5521718',
        refContractNumber: null,
        account: 'BY10BPSB3014F000000005521718',
        name: 'ЛПЦ Карточный счет физических лиц (BYN)',
        currencyCode: '933',
        currencyName: 'BYN',
        dateStart: 1503003600000,
        dateEnd: null,
        dateClosed: null,
        percentRate: 0.01,
        availableAmount: 444.97,
        amount: 444.97,
        unit: 1,
        creditCurrentPayment: '0',
        creditRest: null,
        descr: 'Дополнительный офис №333 Светлогорск',
        paymentPercent: null,
        principalDebt: null,
        percentAccuralUrgent: null,
        percentUrgent: null,
        departmentNumber: '369-333',
        contractAccount: 'BY75BPSB30143330004439330000',
        isGracePeriod: null,
        isUseInDebitTransactions: 1,
        overdraftLimit: null,
        packageContractNumber: '5521722',
        packageContractKind: '92004',
        isFamily: false,
        cardList:
            [{
              contractId: '367719901',
              contract: null,
              productTypeId: 8032,
              productName: 'MasterCard',
              icon: 'ic_mastercard',
              imageUri: 'mc_gold_chip_paypass.png',
              background: null,
              backColor1: '#FABB40',
              backColor2: '#EF6A5D',
              dominantColor: '#ca9730',
              textColor: 'ff000000',
              status: 0,
              cardId: '1012784482',
              panCode: '543553******9142',
              name: 'ЛПЦ MC Gold Chip PayPass, BYN',
              yearEnd: 2023,
              monthEnd: 7,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              isMoneyback: false,
              cardholderName: 'ALIAKSANDR MAKASHYN'
            }],
        actionList:
            [{
              actionCode: 1050504,
              actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
              actionGroup: 700
            },
            {
              actionCode: 1050505,
              actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 700
            },
            {
              actionCode: 1050507,
              actionName: 'Заявление на выпуск дополнительной карты лицу, не являющемуся владельцем счета из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 700
            },
            {
              actionCode: 1150325,
              actionName: 'Замена карты по сроку действия из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 125
            }]
      },
      {
        status: 200,
        url: 'https://digital.bps-sberbank.by/SBOLServer/rest/client/balance',
        headers:
        {
          'x-powered-by': 'Servlet/3.0',
          'access-control-allow-methods': 'GET, POST, PUT, DELETE',
          server: 'nginx/1.16.1',
          'cache-control': 'no-cache, no-store, max-age=0, must-revalidate',
          'x-client-ip': '172.30.69.147',
          'access-control-allow-origin': '*',
          pragma: 'no-cache',
          'access-control-allow-headers': 'Authorization,Content-Type,Accept,X-Sbol-Id,X-Sbol-OS,X-Sbol-Version,X-Sbol-Token,X-Sbol-Sdk,X-Sbol-P',
          'content-length': '342',
          'x-xss-protection': '1; mode=block',
          date: 'Mon, 08 Feb 2021 06:06:26 GMT',
          connection: 'keep-alive',
          expires: '0',
          'access-control-expose-headers': 'X-Sbol-Token, Sbol-UDID, X-Sbol-Balance',
          'x-frame-options': 'DENY',
          'access-control-max-age': '84600',
          'access-control-allow-credentials': 'true',
          'content-type': 'application/json;charset=UTF-8',
          'x-global-transaction-id': '282259096',
          'x-backside-transport': 'OK OK',
          'content-language': 'en-RU',
          'x-content-type-options': 'nosniff'
        },
        body:
        {
          errorInfo: { errorCode: '0', errorDescription: null },
          amount: 45.04,
          currency: 933,
          minBalance: 0,
          overdraft: 1200,
          amountLockAcc: 517.15,
          amountLockCrd: 517.15,
          currentStatus: 0,
          currentStatusDescription: 'Действительная карта ',
          currentStatusDiscription: 'Действительная карта ',
          typeId: 15137
        },
        ms: 190
      },
      {
        productClassId: 1,
        productTypeId: 821,
        productName: null,
        icon: '',
        background: '',
        backColor1: '#9FA3C1',
        backColor2: '#B3C0BE',
        contractType: 1,
        contractId: '367719901',
        contractNumber: '5521718',
        refContractNumber: null,
        account: 'BY10BPSB3014F000000005521718',
        name: 'ЛПЦ Карточный счет физических лиц (BYN)',
        currencyCode: '933',
        currencyName: 'BYN',
        dateStart: 1503003600000,
        dateEnd: null,
        dateClosed: null,
        percentRate: 0.01,
        availableAmount: 444.97,
        amount: 45.04,
        unit: 1,
        creditCurrentPayment: '0',
        creditRest: null,
        descr: 'Дополнительный офис №333 Светлогорск',
        paymentPercent: null,
        principalDebt: null,
        percentAccuralUrgent: null,
        percentUrgent: null,
        departmentNumber: '369-333',
        contractAccount: 'BY75BPSB30143330004439330000',
        isGracePeriod: null,
        isUseInDebitTransactions: 1,
        overdraftLimit: 1200,
        packageContractNumber: '5521722',
        packageContractKind: '92004',
        isFamily: false,
        cardList:
            [{
              contractId: '367719901',
              contract: null,
              productTypeId: 8032,
              productName: 'MasterCard',
              icon: 'ic_mastercard',
              imageUri: 'mc_gold_chip_paypass.png',
              background: null,
              backColor1: '#FABB40',
              backColor2: '#EF6A5D',
              dominantColor: '#ca9730',
              textColor: 'ff000000',
              status: 0,
              cardId: '1012784482',
              panCode: '543553******9142',
              name: 'ЛПЦ MC Gold Chip PayPass, BYN',
              yearEnd: 2023,
              monthEnd: 7,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              isMoneyback: false,
              cardholderName: 'ALIAKSANDR MAKASHYN'
            }],
        actionList:
            [{
              actionCode: 1050504,
              actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
              actionGroup: 700
            },
            {
              actionCode: 1050505,
              actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 700
            },
            {
              actionCode: 1050507,
              actionName: 'Заявление на выпуск дополнительной карты лицу, не являющемуся владельцем счета из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 700
            },
            {
              actionCode: 1150325,
              actionName: 'Замена карты по сроку действия из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 125
            }]
      }
    ]
  ])('updates balance', (apiAccount, serverResponce, udatedAccount) => {
    updateAccountBalance(apiAccount, serverResponce)
    expect(apiAccount).toEqual(udatedAccount)
  })
})
