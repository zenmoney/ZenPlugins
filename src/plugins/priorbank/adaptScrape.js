export default function adaptScrape(scrape) {
    if (!scrape) {
        throw new Error("scrape function should be defined");
    }
    if (typeof scrape !== "function") {
        throw new Error("scrape should be a function");
    }
    return () => {
        console.info("started at", new Date());
        const from = new Date("2000-01-01T00:00:00.000Z");
        return scrape({from}).then(
            (results) => {
                results.forEach(({account, transactions}) => {
                    ZenMoney.addAccount(account);
                    if (transactions.length) {
                        ZenMoney.addTransaction(transactions);
                        console.info(`added ${transactions.length} transaction(s) for account ${account.id}`);
                    }
                });
                console.debug("scrape results", results);
                ZenMoney.setResult({success: true});
            },
            (e) => ZenMoney.setResult({
                success: false,
                message: "Unhandled rejection occurred" + (e && e.message ? ": " + e.message : ""),
            })
        );
    };
};
