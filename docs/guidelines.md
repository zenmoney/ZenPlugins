## Plugin TypeScript guidelines

### Implementation of API calls, API flow and converters
It is important for testability and readability to divide these three entities.

- API call (`fetchApi.ts`)
  - Each function should make exactly one request (except retries).
  - Should take all necessary data as arguments and return also typed data.
  - Parses responses except for accounts & transactions, which we forward to
  `converters.ts`.

- API flow (`api.ts`)
  - Each function implements some flow, e.g. first auth or getting the list of accounts,
  using functions from `fetchApi.ts`.
  - Completely depends on concrete bank specifics.

- Converters (`converters.ts`)
  - It is a big problem to correctly convert all banking products.
  So it is required to test it all.
  - First, we should gather all necessary data from presumably
  more than one endpoint, depending on product type.
  - Forward that unparsed data with some meta to the converters module.
  - Finally, convert it right into zenmoney domain object (in the simple case)
  or into some wrapper with additional data to correctly get the transaction list
  for the product.

### Don't use ```any``` type, it is not type-safe.
- To deal with server response use `unknown` type
and primitive functions from `src/types/get.ts`.
