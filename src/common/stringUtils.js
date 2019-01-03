import padLeft from 'pad-left'

export const toAtLeastTwoDigitsString = (number) => padLeft(number, 2, '0')
