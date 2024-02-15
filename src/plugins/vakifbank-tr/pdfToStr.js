import pdf from 'pdf-extraction/lib/pdf-extraction'

export async function parsePdfFromBlob ({ blob }) {
  const sources = await Promise.all(blob.map(async dataPart => {
    const data = await pdf(await dataPart.arrayBuffer())
    return data.text
  }))
  return sources
}
