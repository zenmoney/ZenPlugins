/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from '../faktura/main'

const apiUri = 'https://card.ozon.ru/api'

async function scrape ({ preferences, fromDate, toDate, isInBackground }) {
  return main.scrape({ preferences, fromDate, toDate, isInBackground, apiUri })
}

export {
  scrape
}
