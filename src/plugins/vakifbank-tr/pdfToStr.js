import pdf from 'pdf-extraction/lib/pdf-extraction'

export async function parsePdfFromBlob ({ blob }) {
  const sources = await Promise.all(
    blob.map(async (dataPart, index) => {
      try {
        console.log(`Processing data part ${index + 1} of ${blob.length}`)

        console.log(`dataPart type: ${dataPart.constructor.name}`)
        console.log('dataPart content:', dataPart)

        console.log('Converting Blob to ArrayBuffer...')
        const arrayBuffer = await dataPart.arrayBuffer()
        console.log('ArrayBuffer successfully created:', arrayBuffer.length)

        console.log('Parsing PDF from ArrayBuffer...')
        const data = await pdf(arrayBuffer)
        console.log('PDF parsed successfully:', data)

        console.log('Extracting text from parsed PDF...')
        const text = data.text
        console.log('Extracted text:', text)

        console.log(`Successfully processed data part ${index + 1}`)
        return text
      } catch (error) {
        console.error(`Failed to process data part ${index + 1}:`, error)
        throw error
      }
    })
  )

  return sources
}
