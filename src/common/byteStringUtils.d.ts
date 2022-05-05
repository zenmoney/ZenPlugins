import forge from 'node-forge'

export declare function byteStringToByteArray (str: string): number[]
export declare function byteArrayToByteString (arr: number[]): string
export declare function getByteStringFromString (str: string, encoding?: string): forge.Bytes
