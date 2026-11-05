import { getOptString } from '../../types/get'

export function isClosedConsumerLoan (loan: unknown): boolean {
  return getOptString(loan, 'loanPurpose') === 'Потребительский кредит' &&
    (getOptString(loan, 'closeDateS') ?? '') !== ''
}

export function isActiveMortgageLoan (loan: unknown): boolean {
  if ((getOptString(loan, 'closeDateS') ?? '') !== '') return false
  return [getOptString(loan, 'loanPurpose'), getOptString(loan, 'productName')]
    .some(value => value?.toLowerCase().includes('ипоте') === true)
}
