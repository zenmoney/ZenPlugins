import { convertOperation, convertPaymentMethod } from '../converters'

// Protocol field values, verbatim from the authority's verification specification, p. 15:
// https://tap.suf.poreskaupravars.org/help/Home/ExportToPdf?all=true&file=Систем-за-провjеру-фискалних-рачуна&hash=1315237238
// These tests cover enum interpretation only. Complete cash/refund responses are still missing;
// they do not establish their item layouts, monetary signs or settlement-stage handling.
test.each([
  [0, 'sale'], // Продаја
  [1, 'refund'] // Рефундација
])('preserves documented transaction type %s as %s', (value, expected) => {
  expect(convertOperation(value)).toBe(expected)
})

test.each([
  [0, 'cashless'], // Друго безготовинско плаћање
  [1, 'cash'], // Готовина
  [2, 'card'], // Платна картица
  [3, 'other'], // Чек: no dedicated Receipt payment method
  [4, 'cashless'], // Пренос на рачун
  [5, 'other'], // Ваучер: not necessarily a gift card
  [6, 'cashless'] // Инстант плаћање
])('preserves documented payment type %s as %s', (value, expected) => {
  expect(convertPaymentMethod(value)).toBe(expected)
})
