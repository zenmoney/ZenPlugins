import { convertAccounts } from '../../../converters'
import { FetchedAccount } from '../../../models'

describe('convertAccounts', () => {
  it.each([
    [
      {
        tag: 'account',
        product: {
          acctKey: 11570661145,
          acctName: null,
          printAcctNo: 'GE82BG0000000533561802',
          availableAmount: 8802.52,
          amount: 8802.52,
          ccy: 'GEL',
          orderNo: 1,
          productCode: 'UNIVERSAL',
          productDictionaryKey: 'product.code.univarsal',
          productDictionaryValue: 'universal account',
          subType: null,
          ccyType: 'B',
          mainAcctKey: 11570661145,
          productGroup: 'ACCOUNT',
          productId: 1,
          isDefault: 'Y',
          isHidden: 'N',
          attachmentId: null,
          overlimitAmountMc: 0,
          isCardExpiring: 'N',
          isCardInactive: 'N',
          hasDigitalCard: 'N',
          paymentOwnAccounts: true,
          paymentConversion: true,
          paymentOwnAccountsDst: true,
          paymentConversionDst: true,
          paymentWithinBank: true,
          paymentWithinGeorgia: true,
          paymentForeign: true,
          productFunctions: [
            'STATEMENT',
            'PAYMENT',
            'STO',
            'OUT_TRANSFER',
            'REQUISITE',
            'IN_TRANSFER',
            'REQUISITE_PRINT',
            'OUT_TRANSFER_OWN',
            'OUT_TRANSFER_OTHER'
          ],
          attachmentUrl: null,
          pfmAcctId: 679309915,
          displayWarning: 'N'
        },
        details: {
          acctNo: 'GE82BG0000000533561802',
          acctKey: 11570661145,
          acctName: null,
          realAmount: 0,
          productDictionaryKey: 'product.code.univarsal',
          productDictionaryValue: null,
          ccy: 'GEL',
          productCode: 'UNIVERSAL',
          acctBranch: '502',
          ownerFirstName: 'ANTON',
          ownerLastName: 'ANTONOV',
          isScoolcard: false,
          isCardExpiring: 'N',
          isCardInactive: 'N',
          mainAcctKey: 11570661145,
          subAccounts: [
            {
              acctKey: 11570661145,
              printAcctNo: 'GE82BG0000000533561802',
              availableAmount: 8802.52,
              realAmount: 386.38,
              ccy: 'GEL',
              hasOverdraft: false,
              mainAcctKey: 11570661145,
              pfmAcctId: 679309915
            },
            {
              acctKey: 11570661146,
              printAcctNo: 'GE82BG0000000533561802',
              availableAmount: 2870.87,
              realAmount: 2291.29,
              ccy: 'USD',
              hasOverdraft: false,
              mainAcctKey: 11570661145,
              pfmAcctId: 679309916
            },
            {
              acctKey: 11570661147,
              printAcctNo: 'GE82BG0000000533561802',
              availableAmount: 2565.88,
              realAmount: 428.87,
              ccy: 'EUR',
              hasOverdraft: false,
              mainAcctKey: 11570661145,
              pfmAcctId: 679309913
            },
            {
              acctKey: 11570661148,
              printAcctNo: 'GE82BG0000000533561802',
              availableAmount: 2132.39,
              realAmount: 0,
              ccy: 'GBP',
              hasOverdraft: false,
              mainAcctKey: 11570661145,
              pfmAcctId: 679309914
            }
          ],
          availableAmounts: [
            {
              amount: 8802.52,
              currency: 'GEL'
            },
            {
              amount: 2870.87,
              currency: 'USD'
            },
            {
              amount: 2565.88,
              currency: 'EUR'
            },
            {
              amount: 2132.39,
              currency: 'GBP'
            }
          ],
          availableAmountSums: [
            {
              amount: 35034.38,
              currency: 'GEL'
            },
            {
              amount: 11337.25,
              currency: 'USD'
            },
            {
              amount: 10304.84,
              currency: 'EUR'
            },
            {
              amount: 8649.82,
              currency: 'GBP'
            }
          ],
          subAccountsSums: [
            {
              amount: 8924.99,
              currency: 'GEL'
            },
            {
              amount: 2888.16,
              currency: 'USD'
            },
            {
              amount: 2625.15,
              currency: 'EUR'
            },
            {
              amount: 2203.54,
              currency: 'GBP'
            }
          ],
          studDepInfos: [],
          scoolas: 0,
          pfmAcctId: 679309915,
          displayWarning: 'N'
        },
        cards: [
          {
            id: 52046901131,
            cardId: 20481965,
            acctKey: 11570661145,
            clientKey: 317021836,
            cardClass: 'Mastercard',
            cardClassCode: 'MC',
            cardName: null,
            cardType: 'MC_STN1',
            productCode: 'DEBITCARD',
            subProductCode: 'MCMC_STN1',
            subProductGroup: null,
            status: 'W',
            lastFour: '1234',
            cardHolder: 'ANTONOV ANTON',
            expDate: 1774900800000,
            isCardBlocked: 'N',
            cardPan: '89389c180601aa57541b0f131b814ad2',
            cardForTypeDictionaryKey: 'rbc.plc.registration.new.card',
            cardForTypeDictionaryValue: 'New card on new account',
            productGroup: 'CARD',
            isDigitalCard: 'N',
            productId: 5,
            subProductId: 56306160,
            isDefault: 'Y',
            isHidden: 'N',
            isCardExpiring: 'N',
            isCardInactive: 'N',
            isScoolcard: 'N',
            closeCard: 'N',
            firstSix: '548812',
            fileId: null,
            attachmentFileBase64: null,
            nameDictionaryKey: 'text.cards.MCST1',
            nameDictionaryValue: 'MC Standard - Tbilisi Sky',
            cardInsSecEntity: null,
            isPrimary: true,
            description: 'Bank Of Georgia',
            paymentNetwork: 'MC',
            cardPdfUrl: null,
            externalFile: {
              id: null,
              channelCode: 'MOBILE',
              languageCode: 'EN',
              fileType: 'CARD_ICON',
              fileSubType: 'MCMC_STN1',
              extFileId: null,
              isDark: 'Y',
              fileUrl: null
            },
            cardExternalFile: {
              id: null,
              channelCode: 'MOBILE',
              languageCode: 'EN',
              fileType: 'CARD_BACKGROUND',
              fileSubType: 'MCMC_STN1',
              extFileId: '332375716',
              isDark: 'N',
              fileUrl: 'serviceId=COMMON_GET_EXTERNAL_FILE&fileId=332375716&channel=MOBILE&langCode=EN&fileType=CARD_BACKGROUND&fileSubType=MCMC_STN1'
            }
          }
        ]
      },
      [
        {
          account: {
            balance: 386.38,
            id: '11570661145',
            instrument: 'GEL',
            syncIds: [
              'GE82BG0000000533561802GEL'
            ],
            title: 'universal account',
            type: 'ccard'
          },
          acctKey: '11570661145',
          tag: 'account'
        },
        {
          account: {
            balance: 2291.29,
            id: '11570661146',
            instrument: 'USD',
            syncIds: [
              'GE82BG0000000533561802USD'
            ],
            title: 'universal account',
            type: 'ccard'
          },
          acctKey: '11570661146',
          tag: 'account'
        },
        {
          account: {
            balance: 428.87,
            id: '11570661147',
            instrument: 'EUR',
            syncIds: [
              'GE82BG0000000533561802EUR'
            ],
            title: 'universal account',
            type: 'ccard'
          },
          acctKey: '11570661147',
          tag: 'account'
        },
        {
          account: {
            balance: 0,
            id: '11570661148',
            instrument: 'GBP',
            syncIds: [
              'GE82BG0000000533561802GBP'
            ],
            title: 'universal account',
            type: 'ccard'
          },
          acctKey: '11570661148',
          tag: 'account'
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts([apiAccounts] as FetchedAccount[])).toEqual(accounts)
  })
})
