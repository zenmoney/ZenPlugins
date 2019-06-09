/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from '../cft/main'

const apiUri = 'https://mybank.oplata.kykyryza.ru/api/v0001'

async function scrape ({ fromDate, toDate }) {
  return main.scrape({ fromDate, toDate, apiUri })
}

export {
  scrape
}
