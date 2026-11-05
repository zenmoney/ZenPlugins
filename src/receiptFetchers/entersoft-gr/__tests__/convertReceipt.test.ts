import { convertReceipt } from '../converters'
import source2 from './convertReceipt-02.html'

// Complete public receipt captured 2026-11-05 from logs/receipts.csv row 547.
// The adjacent fixture preserves the entire observed provider response.
test('keeps all 49 lines and allocated discounts without repeating the savings summary', () => {
  expect(convertReceipt(source2)).toEqual({
    completeness: 'full',
    currency: 'EUR',
    operation: 'sale',
    issuedAt: {
      date: '2026-08-19'
    },
    totalAmount: '108.95',
    merchant: {
      name: 'LIDL',
      address: 'Ε.Ο. ΚΑΣΣΑΝΔΡΕΙΑΣ ΦΟΥΡΚΑΣ, -, 63077, ΚΑΣΣΑΝΔΡΕΙΑ',
      identifiers: [
        {
          value: '093683423',
          countryCode: 'GR',
          scheme: 'VAT'
        }
      ]
    },
    items: [
      {
        name: 'ΗΛΙΕΛΑΙΟ 1L',
        quantity: '1',
        unitPrice: '1.85',
        totalAmount: '1.85',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.85',
        originalTotalAmount: '1.85',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'HELL CLASSIC 250ML',
        quantity: '2',
        unitPrice: '0.59',
        totalAmount: '1.18',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.59',
        originalTotalAmount: '1.18',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΑΛΟΥΜ.30x30CM 11Μ.1Τ',
        quantity: '1',
        unitPrice: '2.99',
        totalAmount: '2.99',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.99',
        originalTotalAmount: '2.99',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΕΠΙΔ.ΓΙΑΟΥ.ΡΟΔ.250G',
        quantity: '2',
        unitPrice: '0.89',
        totalAmount: '1.78',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.89',
        originalTotalAmount: '1.78',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΓΑΡIΔ.VANNAM AΠΟ300G',
        quantity: '3',
        unitPrice: '3.15',
        totalAmount: '9.45',
        unit: 'TEMAXIO',
        originalUnitPrice: '3.15',
        originalTotalAmount: '9.45',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΕΠΙΔ.ΓΙΑΟΥ.ΦΡΑΟ.250G',
        quantity: '1',
        unitPrice: '0.89',
        totalAmount: '0.89',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.89',
        originalTotalAmount: '0.89',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΠΑΠΑΔ.ΓΕΜ.ΣΟΚ.3X200G',
        quantity: '1',
        unitPrice: '2.97',
        totalAmount: '2.97',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.97',
        originalTotalAmount: '2.97',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'FLAKERS CHOCO 500G',
        quantity: '1',
        unitPrice: '2.29',
        totalAmount: '2.29',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.29',
        originalTotalAmount: '2.29',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'Χ.ΓΛ.ΣΟΛ.Κ.ΝΟΡ.200G',
        quantity: '1',
        unitPrice: '6.45',
        totalAmount: '6.45',
        unit: 'TEMAXIO',
        originalUnitPrice: '6.45',
        originalTotalAmount: '6.45',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΤΣ.Π.ΧΡ.ΜΕΓ.38Λ.1ΤΕΜ',
        quantity: '2',
        unitPrice: '0.8',
        totalAmount: '1.6',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.8',
        originalTotalAmount: '1.6',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΠΕΡΙΒΑΝ.ΤΕΛΟΣ',
        quantity: '2',
        unitPrice: '0.09',
        totalAmount: '0.18',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.09',
        originalTotalAmount: '0.18',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΣΑΛΤΣΑ ΤΣΙΛΙ 290ML',
        quantity: '1',
        unitPrice: '1.49',
        totalAmount: '1.49',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.49',
        originalTotalAmount: '1.49',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ALFA ΜΠΥΡ.5% 6X330ML',
        quantity: '2',
        unitPrice: '5.59',
        totalAmount: '11.18',
        unit: 'TEMAXIO',
        originalUnitPrice: '5.59',
        originalTotalAmount: '11.18',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΣΤΙΓ.ΚΑΦ.ΝΤΕΚΑΦ.100G',
        quantity: '1',
        unitPrice: '3.25',
        totalAmount: '3.25',
        unit: 'TEMAXIO',
        originalUnitPrice: '3.25',
        originalTotalAmount: '3.25',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΟΛΥΜ.ΦΥΣ.9 ΦΡΟΥΤΑ 1L',
        quantity: '1',
        unitPrice: '2.66',
        totalAmount: '2.66',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.66',
        originalTotalAmount: '2.66',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΒΙΚ.ΦΥ.ΜΕ.ΝΕΡ.6PA 9L',
        quantity: '1',
        unitPrice: '1.77',
        totalAmount: '1.77',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.77',
        originalTotalAmount: '1.77',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΛΕΥΚ.ΟΙΝΟΣ ΞΗΡ.500ML',
        quantity: '1',
        unitPrice: '1.59',
        totalAmount: '1.59',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.59',
        originalTotalAmount: '1.59',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΙΩΔIOΥXO ΑΛΑΤΙ 1000G',
        quantity: '1',
        unitPrice: '0.29',
        totalAmount: '0.29',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.29',
        originalTotalAmount: '0.29',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΕΛΙΕΣ ΠΡΑΣ.ΓΕΜ.400G',
        quantity: '1',
        unitPrice: '3.09',
        totalAmount: '3.09',
        unit: 'TEMAXIO',
        originalUnitPrice: '3.09',
        originalTotalAmount: '3.09',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΑΠΑΚΙ ΚΡΗΤ.ΚΑΠΝ.250G',
        quantity: '1',
        unitPrice: '3.49',
        totalAmount: '3.49',
        unit: 'TEMAXIO',
        originalUnitPrice: '3.49',
        originalTotalAmount: '3.49',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΝΕΜΕΑ Π.Ο.Π. 0,75L',
        quantity: '1',
        unitPrice: '2.11',
        totalAmount: '2.11',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.11',
        originalTotalAmount: '2.11',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΣΚΟΡΔΑ 1ΤΕΜ.',
        quantity: '2',
        unitPrice: '0.5',
        totalAmount: '1',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.5',
        originalTotalAmount: '1',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΦΥΣ.ΧΥΜ.9 ΦΡΟΥΤΩΝ 1L',
        quantity: '1',
        unitPrice: '1.79',
        totalAmount: '1.79',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.79',
        originalTotalAmount: '1.79',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'LAYS ΤΥΡΙ ΚΡΕΜΜ120G',
        quantity: '1',
        unitPrice: '1.45',
        totalAmount: '1.45',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.45',
        originalTotalAmount: '1.45',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΡΟΖΕ ΟΙΝ.ΞΗΡΟΣ 500ML',
        quantity: '1',
        unitPrice: '1.59',
        totalAmount: '1.59',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.59',
        originalTotalAmount: '1.59',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΧΟΙΡ.ΚΙΜΑΣ.FR.500G',
        quantity: '1',
        unitPrice: '2.89',
        totalAmount: '2.89',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.89',
        originalTotalAmount: '2.89',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΣΥΜΠΥΚΝ.ΓΑΛΑ 10Χ15G',
        quantity: '1',
        unitPrice: '0.79',
        totalAmount: '0.79',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.79',
        originalTotalAmount: '0.79',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΨΩΜ.ΤΟΣΤ ΜΙ.ΣΤΑΡ340G',
        quantity: '1',
        unitPrice: '0.69',
        totalAmount: '0.69',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.69',
        originalTotalAmount: '0.69',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'MELIS.ΤΟΡΤ.ΤΡΙΚ.250G',
        quantity: '2',
        unitPrice: '1.67',
        totalAmount: '3.34',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.76',
        originalTotalAmount: '3.52',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.18'
          }
        ]
      },
      {
        name: 'ΡΟΦΗΜ.ΓΙΑΟΥΡ.ΦΡ1KG',
        quantity: '1',
        unitPrice: '1.79',
        totalAmount: '1.79',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.79',
        originalTotalAmount: '1.79',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΨΩΜΙ ΤΟΣΤ ΣΙΚΑΛ.340G',
        quantity: '1',
        unitPrice: '0.69',
        totalAmount: '0.69',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.69',
        originalTotalAmount: '0.69',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΑΣΠΡΑ ΚΡΕΜΜΥΔΙΑ',
        quantity: '0.51',
        unitPrice: '0.72',
        totalAmount: '0.37',
        unit: 'ΚΙΛΑ',
        originalUnitPrice: '0.72',
        originalTotalAmount: '0.37',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΡΟΦΗΜΑ ΓΙΑΟΥΡ.ΡΟ1KG',
        quantity: '1',
        unitPrice: '1.79',
        totalAmount: '1.79',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.79',
        originalTotalAmount: '1.79',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΠΙΠΕΡ.MIΞ 500G',
        quantity: '1',
        unitPrice: '2.75',
        totalAmount: '2.75',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.85',
        originalTotalAmount: '2.85',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.1'
          }
        ]
      },
      {
        name: 'LIF.ΦΥΣ.ΧΥ.ΠΟΡΤ.1,5L',
        quantity: '1',
        unitPrice: '3.74',
        totalAmount: '3.74',
        unit: 'TEMAXIO',
        originalUnitPrice: '3.74',
        originalTotalAmount: '3.74',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΟΛΥΜ.ΦΥ.ΡΟΔ-ΜΗ-ΣΤ.1L',
        quantity: '1',
        unitPrice: '2.66',
        totalAmount: '2.66',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.66',
        originalTotalAmount: '2.66',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΠΑΤΑΤΕΣ ΠΛΥΜ. 1,5KG',
        quantity: '1',
        unitPrice: '1.45',
        totalAmount: '1.45',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.45',
        originalTotalAmount: '1.45',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΛΕΜΟΝΙΑ',
        quantity: '0.192',
        unitPrice: '2.45',
        totalAmount: '0.47',
        unit: 'ΚΙΛΑ',
        originalUnitPrice: '2.45',
        originalTotalAmount: '0.47',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΣΤΑΦΥΛΙΑ ΜΙΧ 500G',
        quantity: '1',
        unitPrice: '2.09',
        totalAmount: '2.09',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.09',
        originalTotalAmount: '2.09',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΠΙΠΕΡ ΜΑΥΡ ΤΡΙΜ 100G',
        quantity: '1',
        unitPrice: '1.19',
        totalAmount: '1.19',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.19',
        originalTotalAmount: '1.19',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΤΣΑΜΠΙ ΤΟΜΑΤΕΣ',
        quantity: '0.888',
        totalAmount: '1.15',
        unit: 'ΚΙΛΑ',
        originalUnitPrice: '1.89',
        originalTotalAmount: '1.68',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.53'
          }
        ]
      },
      {
        name: 'ΑΥΓΑ ΑΧΥΡ.Μ 10ΤΕΜ',
        quantity: '1',
        unitPrice: '2.69',
        totalAmount: '2.69',
        unit: 'TEMAXIO',
        originalUnitPrice: '2.69',
        originalTotalAmount: '2.69',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΠΑΠΡΙΚΑ ΓΛΥΚΙΑ 100G',
        quantity: '1',
        unitPrice: '1.15',
        totalAmount: '1.15',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.15',
        originalTotalAmount: '1.15',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΚΝΩΣΟΥ ΑΓΓΟΥΡΙΑ ΤΥΠ.',
        quantity: '0.644',
        totalAmount: '0.57',
        unit: 'ΚΙΛΑ',
        originalUnitPrice: '1.29',
        originalTotalAmount: '0.83',
        adjustments: [
          {
            kind: 'discount',
            amount: '-0.26'
          }
        ]
      },
      {
        name: 'ΣΑΚΟΥΛ.ΒΙΟΔ.25Μ1ΤΕΜ',
        quantity: '1',
        unitPrice: '0.1',
        totalAmount: '0.1',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.1',
        originalTotalAmount: '0.1',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'ΣΝΙΤΣΕΛ ΚΟΤΟΠ. 470G',
        quantity: '1',
        unitPrice: '4.15',
        totalAmount: '4.15',
        unit: 'TEMAXIO',
        originalUnitPrice: '4.15',
        originalTotalAmount: '4.15',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'Χ.ΓΛ.ΠΑΡΙΖ.ΦΕΤΕΣ300G',
        quantity: '1',
        unitPrice: '1.35',
        totalAmount: '1.35',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.35',
        originalTotalAmount: '1.35',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'Χ.ΓΛ.ΙΤ.ΣTOM.CU400ML',
        quantity: '1',
        unitPrice: '1.99',
        totalAmount: '1.99',
        unit: 'TEMAXIO',
        originalUnitPrice: '1.99',
        originalTotalAmount: '1.99',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      },
      {
        name: 'MELIS.ΣΠΑΓΓ.ΝO6 500G',
        quantity: '1',
        unitPrice: '0.72',
        totalAmount: '0.72',
        unit: 'TEMAXIO',
        originalUnitPrice: '0.72',
        originalTotalAmount: '0.72',
        adjustments: [
          {
            kind: 'discount',
            amount: '0'
          }
        ]
      }
    ],
    id: '3883B8F669F6518CA377BD9F253BCDFB3FBD5C6D',
    originalTotalAmount: '110.02',
    payments: [
      {
        method: 'card',
        name: 'POS / e-POS',
        amount: '108.95'
      }
    ]
  })
})
