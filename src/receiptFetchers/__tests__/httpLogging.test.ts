import fetchMock from 'fetch-mock'
import get from '../../types/get'
import * as apb from '../apb-ofd-md/fetchApi'
import * as beeline from '../beeline-kz/fetchApi'
import * as buhta from '../buhta-kz/fetchApi'
import * as entersoft from '../entersoft-gr/fetchApi'
import * as ikassa from '../ikassa-by/fetchApi'
import * as kaspi from '../kaspi-ofd-kz/fetchApi'
import * as kofd from '../kofd-kz/fetchApi'
import * as mapr from '../mapr-me/fetchApi'
import * as mev from '../mev-sfs-md/fetchApi'
import * as ofd1 from '../ofd1-kz/fetchApi'
import * as oofd from '../oofd-kz/fetchApi'
import * as rekassa from '../rekassa-kz/fetchApi'
import * as sift from '../sift-mev-md/fetchApi'
import * as softone from '../softone-gr/fetchApi'
import * as soliq from '../soliq-uz/fetchApi'
import * as suf from '../suf-purs-gov-rs/fetchApi'
import * as salyk from '../tax-salyk-kg/fetchApi'
import * as taxcore from '../taxcore-ba/fetchApi'
import * as taxon4ek from '../taxon4ek-by/fetchApi'
import * as taxservice from '../taxservice-am/fetchApi'
import * as ukassa from '../ukassa-kz/fetchApi'
import * as vchasno from '../vchasno-ua/fetchApi'
import * as vs from '../vs-gr/fetchApi'
import * as webkassa from '../webkassa-by/fetchApi'
import * as wipon from '../wipon-kz/fetchApi'
import * as wofd from '../wofd-kz/fetchApi'

const url = 'https://receipt.example/document?reference=public-lookup'
interface TransportCase {
  name: string
  request: () => Promise<unknown>
  format?: 'json' | 'binary' | 'redirect'
  method?: 'POST'
}

// Each transport must emit both HTTP events and follow redirects, except when
// resolving a short link. The model bodies do not invoke provider converters.
const cases: TransportCase[] = [
  { name: 'apb-ofd-md', request: async () => await apb.fetchReceipt(url) },
  { name: 'beeline-kz', request: async () => await beeline.fetchReceipt(url) },
  { name: 'buhta-kz', request: async () => await buhta.fetchReceipt('model-register', 'model-receipt') },
  { name: 'entersoft-gr', request: async () => await entersoft.fetchPage(url) },
  { name: 'ikassa-by', request: async () => await ikassa.fetchReceipt('model-document') },
  { name: 'kaspi-ofd-kz', request: async () => await kaspi.fetchReceipt(url) },
  { name: 'kofd-kz', request: async () => await kofd.fetchReceipt({ reference: 'public-lookup' }), format: 'json' },
  { name: 'mapr-me', request: async () => await mapr.verifyInvoice({ reference: 'public-lookup' }), format: 'json', method: 'POST' },
  { name: 'mev-sfs-md', request: async () => await mev.fetchReceipt(url) },
  { name: 'ofd1-kz', request: async () => await ofd1.fetchReceipt(url) },
  { name: 'ofd1-kz fragment', request: async () => await ofd1.fetchReceiptFragment(url) },
  { name: 'oofd-kz page', request: async () => await oofd.fetchPublicPage(url) },
  { name: 'oofd-kz consumer', request: async () => await oofd.fetchConsumerPage({ fiscalNumber: 'model-fiscal', cashboxNumber: 'model-cashbox', totalSum: '0', purchaseTime: 'model-time' }) },
  { name: 'oofd-kz API', request: async () => await oofd.fetchReceipt('/model-receipt'), format: 'json' },
  { name: 'rekassa-kz', request: async () => await rekassa.fetchReceipt(url), format: 'binary' },
  { name: 'sift-mev-md', request: async () => await sift.fetchReceipt(url) },
  { name: 'softone-gr', request: async () => await softone.fetchReceipt(url) },
  { name: 'soliq-uz', request: async () => await soliq.fetchReceipt(url) },
  { name: 'suf-purs-gov-rs', request: async () => await suf.fetchReceipt(url) },
  { name: 'suf-purs-gov-rs redirect', request: async () => await suf.resolveShortLink(url), format: 'redirect' },
  { name: 'tax-salyk-kg', request: async () => await salyk.fetchReceipt(url), format: 'json' },
  { name: 'taxcore-ba', request: async () => await taxcore.fetchReceipt(url), format: 'json' },
  { name: 'taxon4ek-by', request: async () => await taxon4ek.fetchReceipt('model-receipt'), format: 'json' },
  { name: 'taxservice-am', request: async () => await taxservice.fetchReceipt(url) },
  { name: 'ukassa-kz', request: async () => await ukassa.fetchReceipt('model-id', 'model-fiscal', 'model-kgd'), format: 'json', method: 'POST' },
  { name: 'vchasno-ua', request: async () => await vchasno.fetchReceipt(url) },
  { name: 'vs-gr', request: async () => await vs.fetchReceipt(url) },
  { name: 'webkassa-by', request: async () => await webkassa.fetchReceipt('model-receipt'), format: 'binary' },
  { name: 'wipon-kz', request: async () => await wipon.fetchReceipt(url) },
  { name: 'wofd-kz', request: async () => await wofd.fetchReceipt('model-register', 'model-ticket', 'model-date'), format: 'json' },
  { name: 'wofd-kz redirect', request: async () => await wofd.resolveKpos(url), format: 'redirect' }
]

beforeEach(() => {
  // Use the host Response implementation so binary transports also run here.
  (fetchMock as typeof fetchMock & { setImplementations: (implementations: { Response: typeof Response }) => void }).setImplementations({ Response })
  Object.assign(globalThis, { ZenMoney: { features: { binaryResponseBody: true } } })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

test.each(cases)('[model] $name logs HTTP and uses the intended redirect mode', async ({ request, format, method }) => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  const status = format === 'redirect' ? 302 : 200
  const body = format === 'json' ? JSON.stringify({ diagnostic: 'public-model-body' }) : 'public-model-body'
  fetchMock.mock('*', new Response(body, { status, headers: { Location: url, 'X-Request-Id': 'model-request-id' } }))
  await request()
  expect(get(fetchMock.lastOptions(), 'redirect') ?? 'follow').toBe(format === 'redirect' ? 'manual' : 'follow')
  expect(debug).toHaveBeenCalledWith('request', expect.objectContaining({ url: fetchMock.lastUrl(), method: method ?? 'GET' }))
  expect(debug).toHaveBeenCalledWith('response', expect.objectContaining({
    status,
    body: format === 'json' ? { diagnostic: 'public-model-body' } : expect.stringContaining(format === 'binary' ? Buffer.from(body).toString('hex') : body),
    headers: expect.objectContaining({ location: url, 'x-request-id': 'model-request-id' })
  }))
})
