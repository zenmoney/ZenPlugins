🧩 Interactive Brokers Flex Report Plugin for ZenPlugins

This plugin integrates Interactive Brokers Client Portal Flex Reports with ZenPlugins and provides automated access to end‑of‑day account balances.
🚀 Features

    Fetches a Flex report created by the user in Client Portal or IBKR Mobile

    Uses a Flex Web Service Token generated manually by the user

    Extracts account balances for the most recent business day

    Converts the data into a standardized ZenPlugins balance format

🔧 How It Works

    The user creates an Activity Flex Query (Mint‑compatible) in Client Portal or IBKR Mobile.

    The user manually generates a Flex Web Service Token.

    The plugin uses:

        The Flex Query ID

        The Flex Token provided by the user

    The plugin requests the report via the Flex Web Service API.

    The XML response is parsed and transformed into balance data.

🔑 Where to Find the Flex Web Service Token

The plugin does not generate the token — the user must create it manually.

In IBKR Mobile:  
IBKR Mobile → Trade Reports → Third‑Party Reports → ⚙ → ✔ Mint

In the Web Client Portal:  
Performance & Reports → Third‑Party Reports → ⚙ → ✔ Mint

Once generated, the token can be used in the plugin configuration.
📊 Returned Data

The parsed report may include:

    Cash balance

    Dividends balance

    Options balance

    Funds balance

    Crypto balance

📝 Limitations

The plugin does not:

    Generate Flex Tokens

    Use TWS or IB Gateway

    Retrieve market data

    Send orders

    Fetch historical data

It is designed exclusively for retrieving balances via Flex Reports.
🤝 Contributing

Pull requests are welcome.
