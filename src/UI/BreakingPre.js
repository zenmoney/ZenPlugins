import React from "react";

export const BreakingPre = ({children}) => (
    <pre
        style={{
            fontFamily: "inherit",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            margin: 0,
        }}
    >
        {children}
    </pre>
);
