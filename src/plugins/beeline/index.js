/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from '../cft/main'

const apiUri = 'https://bank.beeline.ru/api/v0001'

async function scrape ({ fromDate, toDate }) {
  return main.scrape({ fromDate, toDate, apiUri })
}

export {
  scrape
}
