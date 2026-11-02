// Synthetic domain values verify display rounding independently of bank payloads.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const React = require('react') as { createElement: (component: unknown, props: unknown) => unknown }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (element: unknown) => string }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DayTransactions } = require('../Transaction') as { DayTransactions: unknown }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Account } = require('../Account') as { Account: unknown }

describe('[model] browser money presentation', () => {
  it('formats account and invoice amounts at the rendered transaction boundary', () => {
    const markup = renderToStaticMarkup(React.createElement(DayTransactions, {
      day: '2026-01-01',
      resolveAccount: () => ({ title: 'Model card', instrument: 'USD' }),
      transactions: [{ outcome: 0.1 + 0.2, outcomeAccount: 'model', opOutcome: 1.23456, opOutcomeInstrument: 'EUR' }]
    }))
    expect(markup).toContain('-0.3 USD')
    expect(markup).toContain('(-1.23 EUR)')
    expect(markup).not.toContain('0.30000000000000004')
  })

  it('formats balances with the same currency rules', () => {
    const markup = renderToStaticMarkup(React.createElement(Account, {
      title: 'Model account', instrument: 'USD', balance: 0.1 + 0.2
    }))
    expect(markup).toContain('0.3 USD')
    expect(markup).not.toContain('0.30000000000000004')
  })
})
