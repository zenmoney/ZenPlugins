# BNB Smart Chain

The plugin synchronizes public BNB Smart Chain addresses through Alchemy's
read-only API. It does not request a seed phrase or a private wallet key.

## Setup

1. Create a free application at <https://dashboard.alchemy.com/>.
2. Select **BNB Smart Chain** as the network.
3. Copy the API key (not the complete RPC URL) into the plugin preferences.
4. Add one or more public BSC addresses separated by commas.

The plugin imports BNB and allowlisted Binance-Peg stablecoins. Empty token
accounts and unsolicited incoming stablecoin transfers below 1 USD are hidden.
Intentional outgoing transfers are never filtered by amount.
