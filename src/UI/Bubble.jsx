import React from "react";
import {zenmoneyRedColor} from "./designSystem";

export const Bubble = ({children}) => (
    <div
        style={{
            display: "inline-block",
            borderRadius: "50vh",
            padding: "2px 6px",
            backgroundColor: zenmoneyRedColor,
            color: "white",
        }}
    >
        {children}
    </div>
);
