import padLeft from "pad-left";

export const toAtLeastTwoDigitsString = (number) => padLeft(number, 2, "0");

export const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

export function formatCommentDateTime(date) {
    if (!isValidDate(date)) {
        throw new Error("valid date should be provided");
    }
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join("-") + " " +
        [date.getHours(), date.getMinutes(), date.getSeconds()].map(toAtLeastTwoDigitsString).join(":");
}
