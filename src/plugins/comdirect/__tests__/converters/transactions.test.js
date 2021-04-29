import { convertTransaction } from '../../converters'

const accountId = 'DE50500105177141441838'

describe('convertTransaction', () => {
  it('should convert an outgoing Transfer transaction', () => {
    const apiTransaction = {
      reference: '367670FAC04AA6AC/2',
      bookingStatus: 'BOOKED',
      bookingDate: '2020-01-13',
      amount: {
        value: '-119.99',
        unit: 'EUR'
      },
      remitter: null,
      deptor: null,
      creditor: {
        holderName: 'Goerlizter Park Drogerie',
        iban: 'DE07500105173331414435',
        bic: 'BYLADE77'
      },
      valutaDate: '2020-01-13',
      directDebitCreditorId: null,
      directDebitMandateId: null,
      endToEndReference: 'nicht angegeben',
      newTransaction: false,
      remittanceInfo: '01Goods and services                 02End-to-End-Ref.:                   03nicht angegeben                    ',
      transactionType: {
        key: 'TRANSFER',
        text: 'Transfer'
      }
    }
    console.log(convertTransaction(apiTransaction, accountId))
    expect(convertTransaction(apiTransaction, accountId)).toEqual({
      id: '367670FAC04AA6AC/2',
      incomeAccount: 'DE50500105177141441838',
      outcomeAccount: 'DE50500105177141441838',
      income: 0,
      outcome: 119.99,
      date: '2020-01-13',
      hold: false,
      comment: '[Transfer] Goods and services',
      payee: 'Goerlizter Park Drogerie'
    })
  })

  it('should convert an incoming Transfer transaction', () => {
    const apiTransaction = {
      reference: '3E83B8AF2E7E97E8/1',
      bookingStatus: 'BOOKED',
      bookingDate: '2020-06-02',
      amount: {
        value: '158.8',
        unit: 'EUR'
      },
      remitter: {
        holderName: 'Hogs of War GmbH'
      },
      deptor: null,
      creditor: null,
      valutaDate: '2020-06-02',
      directDebitCreditorId: null,
      directDebitMandateId: null,
      endToEndReference: '2121',
      newTransaction: false,
      remittanceInfo: '01Refund for a broken helmet F892251 02End-to-End-Ref.:                   032121                               ',
      transactionType: {
        key: 'TRANSFER',
        text: 'Transfer'
      }
    }

    expect(convertTransaction(apiTransaction, accountId)).toEqual({
      comment: '[Transfer] Refund for a broken helmet F892251',
      date: '2020-06-02',
      hold: false,
      id: '3E83B8AF2E7E97E8/1',
      income: 158.8,
      incomeAccount: 'DE50500105177141441838',
      outcome: 0,
      outcomeAccount: 'DE50500105177141441838',
      payee: 'Hogs of War GmbH'
    })
  })

  it('should convert a Direct Debit transaction', () => {
    const apiTransaction = {
      reference: '404F086BD88329D9/34021',
      bookingStatus: 'BOOKED',
      bookingDate: '2020-05-18',
      amount: {
        value: '-29.99',
        unit: 'EUR'
      },
      remitter: {
        holderName: 'German Germany Atta Ta-Ta-Da'
      },
      deptor: null,
      creditor: null,
      valutaDate: '2020-05-18',
      directDebitCreditorId: 'DE9550010517384296',
      directDebitMandateId: 'T2312341B812413115365260',
      endToEndReference: '6786327315204905664620385505RCUR',
      newTransaction: false,
      remittanceInfo: '01Kd-Nr.: 5103930823, Rg-Nr.: 781071202580/6, Ihre Superrechnung          03End-to-End-Ref.:                   046786327315204905664620385505RCUR   05CORE / Mandatsref.:                06T2312341B812413115365260           07Gläubiger-ID:                      08DE9550010517384296                 ',
      transactionType: {
        key: 'DIRECT_DEBIT',
        text: 'Direct Debit'
      }
    }

    expect(convertTransaction(apiTransaction, accountId)).toEqual({
      id: '404F086BD88329D9/34021',
      incomeAccount: 'DE50500105177141441838',
      outcomeAccount: 'DE50500105177141441838',
      income: 0,
      outcome: 29.99,
      payee: 'German Germany Atta Ta-Ta-Da',
      date: '2020-05-18',
      hold: false,
      comment: '[Direct Debit] Kd-Nr.: 5103930823, Rg-Nr.: 7810712580/6, Ihre Superrechnung'
    })
  })

  it('should convert an Interest / Dividends transaction', () => {
    const apiTransaction = {
      reference: 'B6ED87AD442877BB/3',
      bookingStatus: 'BOOKED',
      bookingDate: '2020-04-28',
      amount: {
        value: '0.05',
        unit: 'EUR'
      },
      remitter: null,
      deptor: null,
      creditor: null,
      valutaDate: '2020-04-29',
      directDebitCreditorId: null,
      directDebitMandateId: null,
      endToEndReference: null,
      newTransaction: false,
      remittanceInfo: '01ERTRAEGNISGUTSCHRIFT VOM 27.04.20  02DEPOTBESTAND:                 83   03GIERIGER KATER AG DL -,06          04899960             USD 0,01        05Abr.Betrag Brutto 0,06 EUR         06Steuerabzug 0,01- EUR              ',
      transactionType: {
        key: 'INTEREST_DIVIDENDS',
        text: 'Interest / Dividends'
      }
    }

    expect(convertTransaction(apiTransaction, accountId)).toEqual({
      id: 'B6ED87AD442877BB/3',
      incomeAccount: 'DE50500105177141441838',
      outcomeAccount: 'DE50500105177141441838',
      income: 0.05,
      outcome: 0,
      date: '2020-04-28',
      hold: false,
      comment: '[Interest / Dividends] ERTRAEGNISGUTSCHRIFT VOM 27.04.20 | DEPOTBESTAND: | 83 | GIERIGER KATER AG DL -,06 | 899960 | USD 0,01 | Abr.Betrag Brutto 0,06 EUR | Steuerabzug 0,01- EUR'
    })
  })
})
