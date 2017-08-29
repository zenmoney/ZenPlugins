import padLeft from "pad-left";

const toAtLeastTwoDigitsString = (number) => padLeft(number, 2, "0");

export function formatCommentDateTime(d) {
    return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(toAtLeastTwoDigitsString).join("-") + " " +
        [d.getHours(), d.getMinutes(), d.getSeconds()].map(toAtLeastTwoDigitsString).join(":");
}

export function formatBsbApiDate(userDate) {
    if (!(userDate instanceof Date)) {
        throw new Error("userDate should be instanceof Date");
    }
    // day.month.year in bank timezone (+3)
    const bankTimezone = 3 * 3600 * 1000;
    const date = new Date(userDate.valueOf() + bankTimezone);
    return [
        date.getUTCDate(),
        date.getUTCMonth() + 1,
        date.getUTCFullYear(),
    ].map((number) => padLeft(number, 2, "0")).join(".");
}
