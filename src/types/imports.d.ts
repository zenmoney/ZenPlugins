// Default exports for resource and compiled-script imports.
// Resource extensions and final bundle suffixes are non-overlapping patterns.
declare module '*.wasm' {
  const base64: string
  export default base64
}

declare module '*.html' {
  const text: string
  export default text
}

declare module '*.htm' {
  const text: string
  export default text
}

declare module '*.json' {
  const value: unknown
  export default value
}

declare module '*?bundle' {
  const source: string
  export default source
}

declare module '*&bundle' {
  const source: string
  export default source
}
