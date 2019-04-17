import { parsePayee } from '../../../converters'

describe('parsePayee', () => {
  it('throws if not logged known description in transaction', () => {
    const apiTransactions = [
      {
        details: 'perevod mezhdu schetami/kartami'
      }
    ]

    const assertions = apiTransactions.map(apiTransaction => () => parsePayee(apiTransaction, {}))

    assertions.forEach(assertion => expect(assertion).toThrow('Incorrect merchant description!'))
  })
})
