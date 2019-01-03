import _ from "lodash";
import React from "react";
import { toAtLeastTwoDigitsString } from '../common/stringUtils'
import {prettyDeepDiff} from "../diff";
import {Account} from "./Account";
import {BreakingPre} from "./BreakingPre";
import {Bubble} from "./Bubble";
import {border, fontColor, zenmoneyGreenColor, zenmoneyRedColor} from "./designSystem";
import {DayTransactions} from "./Transaction";
import {toDate} from '../common/dateUtils'

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
        const now = new Date();
        const getDate = (date) => {
            try {
              return toDate(date)
            } catch (e) {
              return now
            }
        };
        const formatDate = (date) => {
            return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(toAtLeastTwoDigitsString).join("-");
        };

        const {transactions, resolveAccount} = this.props;
        const transactionsByDays = _.toPairs(_.groupBy(_.orderBy(transactions, (transaction) => {
            return getDate(transaction.created || transaction.date);
        }, "desc"), (transaction) => {
            return formatDate(getDate(transaction.date));
        }));

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
        const {
            waitingForDevtools, onManualStartPress,
            scrapeState, workflowState,
            scrapeResult, scrapeError,
            persistPluginDataState, persistPluginDataError, onPersistPluginDataConfirm,
        } = this.props;
        const {resolveAccount} = this.state;
        return (
            <div style={{
                display: "grid",
                gridTemplateColumns: scrapeResult ? "auto 260px 260px" : "auto",
                width: "100vw",
                height: "100vh",
                color: fontColor,
            }}>
                <SidePane>
                    {waitingForDevtools && (
                        <React.Fragment>
                            Open docked devtools (Command-Option-I on Mac, F12 on Windows) to proceed or press <button onClick={onManualStartPress}>Start manually</button>
                        </React.Fragment>
                    )}
                    {workflowState === ":workflow-state/waiting" && <div>Waiting</div>}
                    {workflowState === ":workflow-state/loading-assets" && <div>Loading plugin manifest/preferences/data…</div>}
                    {workflowState === ":workflow-state/filling-preferences" && <div>Filling preferences…</div>}
                    {scrapeState === ":scrape-state/starting" && <div>Scraping starting</div>}
                    {scrapeState === ":scrape-state/started" && <div>Scraping…</div>}
                    {scrapeState === ":scrape-state/success" &&
                    <div>Scraped {scrapeResult.accounts.length} account(s), {scrapeResult.transactions.length} transaction(s)</div>}
                    {scrapeState === ":scrape-state/success" && scrapeResult.pluginDataChange && (
                        <React.Fragment>
                            <div>pluginData changes:</div>
                            {prettyDeepDiff(scrapeResult.pluginDataChange.oldValue, scrapeResult.pluginDataChange.newValue)
                                .map((line, i) => <div key={i} style={{color: line.startsWith("+") ? zenmoneyGreenColor : zenmoneyRedColor}}>{line}</div>)}
                            {persistPluginDataState === ":persist-plugin-data-state/confirm" && (
                                <React.Fragment>
                                    <button onClick={onPersistPluginDataConfirm.bind(null, {save: true})}>Save</button>
                                    <button onClick={onPersistPluginDataConfirm.bind(null, {save: false})}>Dismiss</button>
                                </React.Fragment>
                            )}
                            {persistPluginDataState === ":persist-plugin-data-state/saving" && <div>Saving pluginData…</div>}
                            {persistPluginDataState === ":persist-plugin-data-state/saved" && <div>You saved pluginData changes</div>}
                            {persistPluginDataState === ":persist-plugin-data-state/dismiss" && <div>You dismissed pluginData changes</div>}
                            {persistPluginDataState === ":persist-plugin-data-state/save-error" && (
                                <div>
                                    We've failed to save plugin data changes because:
                                    <br />
                                    {persistPluginDataError.message}
                                </div>
                            )}
                        </React.Fragment>
                    )}
                    {scrapeState === ":scrape-state/success" && !scrapeResult.pluginDataChange && <div>pluginData: no changes</div>}
                    {scrapeState === ":scrape-state/error" && <div>Scrape error:
                        <BreakingPre>{scrapeError.message || "n/a"}</BreakingPre>
                    </div>}
                    {workflowState === ":workflow-state/complete" && <div><br />Cheers!</div>}
                </SidePane>
                {scrapeState === ":scrape-state/success" && (
                    <React.Fragment>
                        <AccountsPane accounts={scrapeResult.accounts} />
                        <TransactionsPane transactions={scrapeResult.transactions} resolveAccount={resolveAccount} />
                    </React.Fragment>
                )}
            </div>
        );
    }
}
