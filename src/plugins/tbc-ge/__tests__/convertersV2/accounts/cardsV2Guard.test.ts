import { convertCardsV2 } from '../../../converters'
import { CardProductV2 } from '../../../models'

it('returns empty array when apiAccounts is null', () => {
  expect(convertCardsV2(null as unknown as CardProductV2[])).toEqual([])
})

it('returns empty array when apiAccounts is undefined', () => {
  expect(convertCardsV2(undefined as unknown as CardProductV2[])).toEqual([])
})

it('returns empty array when apiAccounts is not an array', () => {
  expect(convertCardsV2({} as unknown as CardProductV2[])).toEqual([])
})
