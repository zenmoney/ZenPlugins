import React from "react";

export class UI extends React.PureComponent {
    render() {
        const {status, onManualStartPress} = this.props;
        return (
            <React.Fragment>
                {onManualStartPress && (
                    <React.Fragment>
                        Open docked devtools (Command-Option-I on Mac, F12 on Windows) to proceed or press <button>Start manually</button>
                    </React.Fragment>
                )}
                <div>{status}</div>
            </React.Fragment>
        );
    }
}
