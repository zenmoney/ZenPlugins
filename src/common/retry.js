export default async function retry({
    getter,
    predicate,
    maxAttempts = 1,
    log = false,
}) {
    for (let attempt = 1; attempt <= maxAttempts; ++attempt) {
        const getterResult = getter();
        const value = await getterResult;
        const ok = predicate(value);
        log && console.info("retry", {ok, attempt, maxAttempts});
        if (ok) {
            return value;
        }
    }
    throw new Error(`could not satisfy predicate in ${maxAttempts} attempt(s)`);
}
