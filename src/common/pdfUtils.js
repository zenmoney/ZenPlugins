import pdfjs from 'pdfjs-dist'
import pdf from 'pdf-extraction/lib/pdf-extraction'
import { fetchJson } from './network'
import { isDebug } from './utils'

pdfjs.GlobalWorkerOptions.workerSrc = 'unexisting'

const PDF_PARSER_URL = ''

async function parsePage (pageData) {
  const textContent = await pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: true
  })
  let lastY = 0
  let text = ''
  for (const item of textContent.items) {
    if (!lastY) {
      text += item.str
    } else if (lastY === item.transform[5]) {
      text += ' ' + item.str
    } else {
      text += '\n' + item.str
    }
    lastY = item.transform[5]
  }
  return text
}

const queue = []

function popFromQueue () {
  if (queue.length === 0) {
    return
  }
  const { dataBuffer, options, resolve, reject } = queue[0]
  const previousHandler = global.onunhandledrejection
  global.onunhandledrejection = ({ promise }) => {
    global.onunhandledrejection = previousHandler
    promise.catch(reject)
  }
  pdf(dataBuffer, options).then((result) => {
    resolve(result)
    queue.shift()
    popFromQueue()
  }).catch((e) => {
    reject(e)
    queue.shift()
    popFromQueue()
  })
}

async function pdfOrThrow (dataBuffer, options) {
  return new Promise((resolve, reject) => {
    queue.push({ dataBuffer, options, resolve, reject })
    if (queue.length === 1) {
      popFromQueue()
    }
  })
}

export async function parsePdf (pdfBlob) {
  const arrayBuffer = await pdfBlob.arrayBuffer()

  if (isDebug() && typeof global.WorkerGlobalScope !== 'undefined' && global.self instanceof global.WorkerGlobalScope) {
    console.log('parsePdf worker thread')
    return new Promise((resolve, reject) => {
      const correlationId = Math.random().toString(36)
      const handleMessage = (event) => {
        if (event.data.type === ':events/pdf-parsed' && event.data.payload.correlationId === correlationId) {
          global.removeEventListener('message', handleMessage)
          if (event.data.payload.error) {
            reject(new Error(event.data.payload.error))
          } else {
            resolve(event.data.payload.result)
          }
        }
      }
      global.addEventListener('message', handleMessage)
      global.postMessage({
        type: ':commands/parse-pdf',
        payload: { correlationId, arrayBuffer }
      })
    })
  }

  try {
    // dirty hack with unhandled rejection handler to make pdf library properly throw errors
    return await pdfOrThrow(arrayBuffer, { pagerender: parsePage })
  } catch (e) {
    if (!PDF_PARSER_URL) {
      throw e
    }
    try {
      const response = await fetchJson(PDF_PARSER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': pdfBlob.type || 'application/pdf'
        },
        body: new Uint8Array(arrayBuffer),
        stringify: (body) => body,
        log: false
      })
      if (response.status !== 200 || !response.body || typeof response.body.text !== 'string') {
        throw e
      }
      return response.body
    } catch (_) {
      throw e
    }
  }
}
