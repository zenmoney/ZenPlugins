import padLeft from "pad-left";

const toAtLeastTwoDigitsString = (number) => padLeft(number, 2, "0");

export const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

export function formatCommentDateTime(date) {
    if (!isValidDate(date)) {
        throw new Error("valid date should be provided");
    }
    return formatZenMoneyDate(date) + " " +
        [date.getHours(), date.getMinutes(), date.getSeconds()].map(toAtLeastTwoDigitsString).join(":");
}

export function formatZenMoneyDate(date) {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join("-");
}
