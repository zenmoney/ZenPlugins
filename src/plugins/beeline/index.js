/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from '../faktura/main'

const apiUri = 'https://bank.beeline.ru/api'

async function scrape ({ fromDate, toDate }) {
  return main.scrape({ fromDate, toDate, apiUri })
}

export {
  scrape
}
