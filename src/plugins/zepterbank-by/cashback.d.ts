export const QUALIFIED_CASHBACK_MCCS: Set<number>

export function isCashbackQualified (mcc: number | null | undefined): boolean

export function getCashbackCommentLine (mcc: number | null | undefined): string

export function appendCashbackComment (comment: string | null | undefined, mcc: number | null | undefined): string
