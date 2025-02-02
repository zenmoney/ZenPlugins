import { getAmountFromDescription } from '../../converters'

describe('getAmountFromDescription', () => {
  it.each([
    ['Payment - Amount: GEL11.00; Merchant: shawarmania, Tbilisi, vekua 3a; MCC:5812; Date: 04/04/2022 21:01; Card No: ****5585; Payment transaction amount and currency: 11.00 GEL', { sum: 11, instrument: 'GEL' }],
    ['Payment - Amount: BYN50.00; Merchant: IR WWW.VERBITSKAYA.BY>MINSK BY, Belarus; MCC:8099; Date: 20/06/2022 00:07; Card No: ****0434; Payment transaction amount and currency: 58.45 GEL; Bank conversion rate (BYN-GEL): 1.169', { sum: 50.0, instrument: 'BYN' }],
    ['Payment - Amount: INR1,103.00; Merchant: PRIME ONE>GOA                         IN, India; MCC:5411; Date: 28/12/2024 19:50; Card No: ****4346; Payment transaction amount and currency: 12.93 USD; Bank conversion rate (USD-INR): 85.3055', { sum: 1103, instrument: 'INR' }],
    ['Payment - Amount: VND183,000.00; Merchant: THE CUP COFFEE, Viet Nam; MCC:5814; Date: 16/10/2024 09:59; Card No: ****4346; Payment transaction amount and currency: 7.49 USD; Bank conversion commission fee: 0.15 USD; Card scheme conversion rate (USD-VND): 24931.8801', { sum: 183000, instrument: 'VND' }],
    ['Withdrawal - Amount: GEL180.00; ATM: Bank of Georgia, Tbilisi, Metro Didube; MCC:6011; Date: 04/04/2022 14:47; Card No: ****5585; Payment transaction amount and currency: 180.36 GEL', { sum: 180, instrument: 'GEL' }],
    ['Withdrawal - Tbilisi, Metro Didube; MCC:6011; Date: 04/04/2022 14:47; Card No: ****5585; Payment transaction amount and currency: 180.36 GEL', null],
    ['', null]
  ])('get invoice sum and instument from description', (description, invoice) => {
    expect(getAmountFromDescription(description)).toEqual(invoice)
  })
})
