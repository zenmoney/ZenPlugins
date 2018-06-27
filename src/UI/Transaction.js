import React from "react";
import {BreakingPre} from "./BreakingPre";
import {accountRectangleColor, border, zenmoneyGreenColor, zenmoneyRedColor} from "./designSystem";

const CommentLine = ({children}) => <div style={{fontSize: 9}}><BreakingPre>{children}</BreakingPre></div>;

const Payee = ({children}) => <div style={{fontSize: 10}}>{children}</div>;

const AccountAmount = ({account, amount}) => (
    <div style={{clear: "both", overflow: "hidden"}}>
        <div style={{float: "left"}}>{account.title}</div>
        <div style={{float: "right", color: amount > 0 ? zenmoneyGreenColor : zenmoneyRedColor}}>{amount > 0 ? "+" + amount : amount} {account.instrument}</div>
    </div>
);

const Transaction = ({payee, outcome, outcomeAccount, income, incomeAccount, comment}) => {
    return (
        <div style={{margin: 10}}>
            {outcome !== 0 && <AccountAmount account={outcomeAccount} amount={-outcome} />}
            {income !== 0 && <AccountAmount account={incomeAccount} amount={income} />}
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
                    payee, comment,
                    outcome, outcomeAccount: outcomeAccountRef,
                    income, incomeAccount: incomeAccountRef,
                    ...rest
                }, i) => (
                    <div key={i} style={{borderBottom: border}} title={JSON.stringify(rest)}>
                        <Transaction
                            payee={payee}
                            outcome={outcome}
                            outcomeAccount={resolveAccount(outcomeAccountRef)}
                            income={income}
                            incomeAccount={resolveAccount(incomeAccountRef)}
                            comment={comment}
                        />
                    </div>
                ))}
            </React.Fragment>
        );
    }
}
