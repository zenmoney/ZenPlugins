import { Account, AccountType } from '../../../../types/zenmoney'
import { convertMiniCardStatementOperation } from '../../converters'
import type { FetchMiniCardStatementOperation } from '../../types/fetch'

describe('convertMiniCardStatementOperation', () => {
  it('uses transaction amount sign for a VTB mini card statement operation', () => {
    const operation: FetchMiniCardStatementOperation = {
      operationDate: 1777561115000,
      operationDescription: 'Покупка',
      operationAmount: 32,
      operationCurrency: '933',
      operationPlace: 'STORE',
      operationState: 1,
      transactionAmount: -10,
      transactionCurrency: '840',
      transactionAuthCode: '999'
    }

    const account: Account = {
      id: 'test-card-contract-1',
      type: AccountType.ccard,
      title: 'Тестовая карта BYN *1111',
      instrument: 'BYN',
      syncIds: ['TEST-IBAN-CARD-0001']
    }

    expect(convertMiniCardStatementOperation(operation, account)).toEqual({
      hold: null,
      date: new Date(1777561115000),
      comment: 'Покупка\nSTORE',
      movements: [
        {
          id: 'test-card-contract-1:1777561115000:999:-10:32:Покупка',
          account: { id: 'test-card-contract-1' },
          fee: 0,
          invoice: {
            sum: -10,
            instrument: 'USD'
          },
          sum: -32
        }
      ],
      merchant: null
    })
  })
})
