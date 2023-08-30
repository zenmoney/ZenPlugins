export declare function isDebug (): boolean
export declare function generateUUID (): string

// Generate random string with specific length
// Default alphabet is "a-z0-9"
export declare function generateRandomString (length: number, chars?: string): string
export declare function generateMacAddress (): string
export declare function randomInt (min: number, max: number): number
export declare function bufferToHex (arrayBuffer: ArrayBuffer): string
export declare function delay (ms: number): Promise<void>
export declare function takePicture (format: string): Promise<string>
