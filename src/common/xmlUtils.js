import cheerio from 'cheerio'
import { decodeHtmlSpecialCharacters } from './stringUtils'

export function parseXml (xml) {
  const $ = cheerio.load(xml, {
    xmlMode: true
  })
  const object = parseXmlNode($().children()[0])
  if (!object || typeof object !== 'object') {
    throw new Error('Error parsing XML. Unexpected root node')
  }
  return object
}

function parseXmlNode (root) {
  const children = root.children.filter(node => {
    if (node.type === 'text') {
      const value = node.data.trim()
      if (value === '' || value === '?') {
        return false
      }
    }
    return true
  })
  let object = null
  for (const node of children) {
    if (node.type === 'cdata') {
      if (children.length !== 1 || !node.children ||
        node.children.length !== 1 ||
        node.children[0].type !== 'text') {
        throw new Error('Error parsing XML. Unsupported CDATA node')
      }
      return node.children[0].data.trim()
    }
    if (node.type === 'tag') {
      if (object === null) {
        object = {}
      }
      const key = node.name
      const singleTextChildNode = node.children.length === 1 && node.children[0].type === 'text'
        ? node.children[0]
        : null
      const text = singleTextChildNode
        ? decodeHtmlSpecialCharacters(singleTextChildNode.data.trim())
        : ''
      let value
      if (!node.children || !node.children.length || (singleTextChildNode && !text)) {
        if (node.attribs && Object.keys(node.attribs).length > 0) {
          value = {}
        } else {
          value = null
        }
      } else if (singleTextChildNode) {
        value = text || null
      } else {
        value = parseXmlNode(node)
      }
      if (value && typeof value === 'object' && node.attribs) {
        Object.assign(value, node.attribs)
      }
      let _value = object[key]
      if (_value !== undefined) {
        if (!Array.isArray(_value)) {
          _value = [_value]
          object[key] = _value
        }
        _value.push(value)
      } else {
        object[key] = value
      }
    }
  }
  return object
}
