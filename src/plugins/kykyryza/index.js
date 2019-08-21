/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from '../cft/main'

const apiUri = 'https://oplata.kykyryza.ru/api'

async function scrape ({ fromDate, toDate }) {
  return main.scrape({ fromDate, toDate, apiUri })
}

export {
  scrape
}
