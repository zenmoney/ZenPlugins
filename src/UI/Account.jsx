import _ from "lodash";
import React from "react";
import {accountRectangleColor, zenmoneyRedColor} from "./designSystem";

const calculateBalanceText = ({balance, creditLimit, available, instrument}) => {
    if (_.isNumber(balance)) {
        return `${balance} ${instrument}`;
    }
    if (_.isNumber(creditLimit) && _.isNumber(available)) {
        return `${(available - creditLimit).toFixed(2)} ${instrument}?`;
    }
    if (_.isNumber(creditLimit) && _.isNumber(available)) {
        return (
            <div style={{margin: 5, fontSize: 15, fontWeight: "lighter"}}>
                n/a {instrument}
            </div>
        );
    }
};

const Balance = ({children}) => <div style={{margin: 5, fontSize: 15, fontWeight: "lighter"}}>{children}</div>;

export const Account = ({title, ...rest}) => {
    return (
        <div
            style={{
                background: accountRectangleColor,
                width: "100%",
                height: 50,
                float: "right",
            }}
        >
            <div 
                style={{
                    margin: 5, 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis', 
                    color: zenmoneyRedColor
                }}
            >
                {title}
            </div>
            <Balance>{calculateBalanceText(rest)}</Balance>
        </div>
    );
};
