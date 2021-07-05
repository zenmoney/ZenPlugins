/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as main from '../faktura/main'

const apiUri = 'https://oplata.plus.svyaznoy.ru/api'

async function scrape (args) {
  return main.scrape({ ...args, apiUri })
}

export {
  scrape
}
