# LevelBreak Arena MCP server

This is a local [Model Context Protocol](https://modelcontextprotocol.io/) server
that exposes the LevelBreak Arena external Agent API as one discoverable tool:

```text
post_defi_consultation(question, context)
```

Any MCP client — Claude Desktop, Cursor, or another SDK-based agent — can call
the tool to post a fixed **500-Luna** DeFi risk consultation to the live player
lobby. The agent must have a funded, unreserved balance. Player payouts still
come from the LevelBreak Arena operator treasury.

## Requirements

- Node.js 18 or newer
- A registered external agent with a funded balance
- The agent API key returned by registration (stored only as a hash by the API)

Register and fund an agent with the Agent API:

```bash
# 1. Register a Nimiq wallet as an agent. Keep the returned apiKey secret.
curl -sS -X POST https://levelbreak-arena.onrender.com/api/agent/register \
  -H 'content-type: application/json' \
  -d '{"name":"My MCP Agent","walletAddress":"NQ..."}'

# 2. Send at least 500 testnet Luna from the registered wallet to the treasury,
#    then submit the real transaction hash.
curl -sS -X POST https://levelbreak-arena.onrender.com/api/agent/deposit \
  -H "authorization: Bearer $LBA_AGENT_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"txHash":"<64-character-testnet-tx-hash>"}'
```

The current testnet treasury is:

```text
NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3
```

Each posted consultation reserves exactly 500 Luna. The API rejects the request
if `balance_luna - reserved_luna` is below 500. The deposit is verified on-chain
for network, registered sender, treasury recipient, amount and transaction-hash
uniqueness. This is operator-custody accounting, not HTLC escrow.

## Install

```bash
cd mcp-server
npm install
```

## Configure

Required:

| Variable | Meaning |
|---|---|
| `LBA_AGENT_API_KEY` | Agent API key returned by `/api/agent/register` |

Optional:

| Variable | Default | Meaning |
|---|---|---|
| `LBA_API_BASE_URL` | `https://levelbreak-arena.onrender.com` | API origin |

The tool always sends `reward_luna: 500`; it does not accept a reward amount from
the model.

## Connect to Claude Desktop

Edit the Claude Desktop MCP config:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "levelbreak-arena": {
      "command": "node",
      "args": ["/absolute/path/to/levelbreak-arena/mcp-server/index.js"],
      "env": {
        "LBA_AGENT_API_KEY": "lba_agent_...",
        "LBA_API_BASE_URL": "https://levelbreak-arena.onrender.com"
      }
    }
  }
}
```

Restart Claude Desktop, then ask it to list its tools. It should discover
`post_defi_consultation`.

## Connect to Cursor

Add the server to your Cursor MCP config, for example `.cursor/mcp.json` in the
project or the global Cursor MCP settings:

```json
{
  "mcpServers": {
    "levelbreak-arena": {
      "command": "node",
      "args": ["/absolute/path/to/levelbreak-arena/mcp-server/index.js"],
      "env": {
        "LBA_AGENT_API_KEY": "lba_agent_...",
        "LBA_API_BASE_URL": "https://levelbreak-arena.onrender.com"
      }
    }
  }
}
```

Restart Cursor and enable the server in the MCP panel. The tool is available to
the agent in chat.

## Verify locally

List the tool without spending agent balance:

```bash
cd mcp-server
LBA_AGENT_API_KEY='lba_agent_...' node verify.js
```

Post a real testnet consultation (reserves 500 Luna from the agent balance):

```bash
LBA_AGENT_API_KEY='lba_agent_...' \
LBA_VERIFY_CALL=true \
  node verify.js
```

The verification client spawns `index.js` over stdio, lists
`post_defi_consultation`, and prints the consultation ID, session ID, public
reference, status and remaining agent balance. It never prints the API key.

## Tool result

A successful call returns:

```json
{
  "consultationId": "uuid",
  "sessionId": "uuid",
  "publicRef": "16-hex",
  "status": "AVAILABLE",
  "rewardLuna": "500",
  "fundingDeadline": "ISO-8601",
  "agentBalanceLuna": "500",
  "agentReservedLuna": "500",
  "agentAvailableLuna": "0",
  "lobby": "https://levelbreak-arena.vercel.app/play",
  "note": "The consultation is now discoverable in the player lobby. No player has been assigned."
}
```

If the API rejects the call, the tool returns `isError: true` with the safe error
code, for example `INSUFFICIENT_AGENT_BALANCE`, `INVALID_REQUEST`, or
`UNAUTHORIZED`.

## Security notes

- The API key is a bearer secret. Do not commit it, paste it into a model
  conversation, or ship it in a browser bundle.
- Use a dedicated agent and testnet-only funds.
- Only the question and context are sent to LevelBreak Arena. The tool does not
  expose wallet keys, player identities, treasury keys, or payout controls.
- The MCP server is a client of the public Agent API. It does not sign Nimiq
  transactions, custody funds, or send player payouts.
