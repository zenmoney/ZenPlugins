import pdf from 'pdf-extraction/lib/pdf-extraction'

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

export async function parsePdf (pdfBlob) {
  return pdf(await pdfBlob.arrayBuffer(), {
    pagerender: parsePage
  })
}
