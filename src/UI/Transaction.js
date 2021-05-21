import React from "react";
import {BreakingPre} from "./BreakingPre";
import {accountRectangleColor, border, zenmoneyGreenColor, zenmoneyRedColor} from "./designSystem";

const CommentLine = ({children}) => <div style={{fontSize: 9}}><BreakingPre>{children}</BreakingPre></div>;

const Payee = ({children}) => <div style={{fontSize: 10}}>{children}</div>;

const AccountAmount = ({account, amount, opAmount, opInstrument}) => (
    <div style={{clear: "both", overflow: "hidden"}}>
        <div style={{float: "left"}}>{account.title}</div>
        <div style={{float: "right", color: (opAmount || amount) > 0 ? zenmoneyGreenColor : zenmoneyRedColor}}>
            {amount ? (amount > 0 ? "+" : "") + amount + " " + account.instrument : ""}
            {opAmount ? " (" + (opAmount > 0 ? "+" : "") + opAmount + " " + opInstrument + ")" : ""}
        </div>
    </div>
);

const Transaction = ({
    payee,
    outcome,
    outcomeAccount,
    income,
    incomeAccount,
    opOutcome,
    opOutcomeInstrument,
    opIncome,
    opIncomeInstrument,
    comment
}) => {
    return (
        <div style={{margin: 10}}>
            {(outcome || opOutcome) && <AccountAmount account={outcomeAccount} amount={-outcome} opAmount={-opOutcome} opInstrument={opOutcomeInstrument}/>}
            {(income || opIncome) && <AccountAmount account={incomeAccount} amount={income} opAmount={opIncome} opInstrument={opIncomeInstrument}/>}
            {payee && <Payee>{payee}</Payee>}
            {comment && <CommentLine>{comment}</CommentLine>}
        </div>
    );
};

export class DayTransactions extends React.PureComponent {
    render() {
        const {day, transactions, resolveAccount} = this.props;
        return (
            <React.Fragment>
                <div style={{padding: "5px 10px", fontSize: 9, backgroundColor: accountRectangleColor}}>{day}</div>
                {transactions.map(({
                    payee,
                    outcome,
                    outcomeAccount: outcomeAccountRef,
                    income,
                    incomeAccount: incomeAccountRef,
                    opOutcome,
                    opOutcomeInstrument,
                    opIncome,
                    opIncomeInstrument,
                    comment,
                  ...rest
                }, i) => (
                    <div key={i} style={{borderBottom: border}} title={JSON.stringify(rest)}>
                        <Transaction
                            payee={payee}
                            outcome={outcome}
                            outcomeAccount={resolveAccount(outcomeAccountRef)}
                            income={income}
                            incomeAccount={resolveAccount(incomeAccountRef)}
                            opOutcome={opOutcome}
                            opOutcomeInstrument={opOutcomeInstrument}
                            opIncome={opIncome}
                            opIncomeInstrument={opIncomeInstrument}
                            comment={comment}
                        />
                    </div>
                ))}
            </React.Fragment>
        );
    }
}
