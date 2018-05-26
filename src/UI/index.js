import _ from "lodash";
import React from "react";
import {Account} from "./Account";
import {BreakingPre} from "./BreakingPre";
import {Bubble} from "./Bubble";
import {border, fontColor} from "./designSystem";
import {DayTransactions} from "./Transaction";

const SidePane = ({children}) => <div style={{borderLeft: border, overflowY: "auto"}}>{children}</div>;

class AccountsPane extends React.PureComponent {
    render() {
        const {accounts} = this.props;
        return (
            <SidePane>
                <div style={{margin: 8}}><Bubble>Accounts</Bubble></div>
                {accounts.map(({title, instrument, type, ...rest}, i) => (
                    <div
                        key={i}
                        title={JSON.stringify(rest)}
                        style={{
                            clear: "both",
                            overflow: "hidden",
                            margin: 8,
                        }}
                    >
                        <Account title={title} instrument={instrument} {...rest} />
                    </div>
                ))}
            </SidePane>
        );
    }
}

class TransactionsPane extends React.PureComponent {
    render() {
        const {transactions, resolveAccount} = this.props;
        const transactionsByDays = _.orderBy(
            _.toPairs(_.groupBy(transactions, (x) => x.date.toISOString().slice(0, "2000-01-01".length))),
            ([day]) => day,
            "desc",
        );
        return (
            <SidePane>
                <div style={{margin: 8}}><Bubble>Transactions</Bubble></div>
                {transactionsByDays.map(([day, transactions], i) => (
                    <DayTransactions key={i} day={day} transactions={transactions} resolveAccount={resolveAccount} />
                ))}
            </SidePane>
        );
    }
}

export class UI extends React.PureComponent {
    state = {};

    static getDerivedStateFromProps({scrapeResult}) {
        if (!scrapeResult) {
            return {};
        }
        const accountsByIdLookup = _.keyBy(scrapeResult.accounts, (x) => x.id);
        return {
            resolveAccount: (ref) => {
                const account = accountsByIdLookup[ref];
                if (account) {
                    return account;
                }
                if (typeof ref === "string" && ref.includes("#")) {
                    const [type, instrument] = ref.split("#");
                    return {type, title: type[0].toUpperCase() + type.slice(1), instrument};
                }
                throw new Error(`Unknown account ref "${ref}"`);
            },
        };
    }

    render() {
        const {status, onManualStartPress, scrapeResult} = this.props;
        const {resolveAccount} = this.state;
        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: scrapeResult ? "auto 260px 260px" : "auto",
                width: "100vw",
                height: "100vh",
                color: fontColor,
            }}>
                <BreakingPre>
                    {onManualStartPress && (
                        <React.Fragment>
                            Open docked devtools (Command-Option-I on Mac, F12 on Windows) to proceed or press{" "}
                            <button onClick={onManualStartPress}>Start manually</button>
                        </React.Fragment>
                    )}
                    {onManualStartPress && "\n"}
                    {status}
                </BreakingPre>
                {scrapeResult && <AccountsPane accounts={scrapeResult.accounts} />}
                {scrapeResult && <TransactionsPane transactions={scrapeResult.transactions} resolveAccount={resolveAccount} />}
            </div>
        );
    }
}
