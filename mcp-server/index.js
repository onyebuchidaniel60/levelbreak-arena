#!/usr/bin/env node
/**
 * LevelBreak Arena MCP server.
 *
 * Exposes the external Agent API as an MCP stdio tool so Claude Desktop,
 * Cursor, or another MCP client can post a fixed 500-Luna DeFi consultation.
 *
 * Required environment:
 *   LBA_AGENT_API_KEY   agent API key returned by /api/agent/register
 *
 * Optional:
 *   LBA_API_BASE_URL    default https://levelbreak-arena.onrender.com
 *
 * The API key is never printed. The MCP protocol uses stdout, so all human
 * diagnostics go to stderr.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = (
  process.env.LBA_API_BASE_URL ?? "https://levelbreak-arena.onrender.com"
).replace(/\/+$/, "");
const AGENT_API_KEY = process.env.LBA_AGENT_API_KEY ?? "";
const REWARD_LUNA = 500;

if (!AGENT_API_KEY) {
  console.error(
    "LBA_AGENT_API_KEY is required. Register an agent and fund its balance before starting this MCP server.",
  );
  process.exit(1);
}

const server = new McpServer({
  name: "levelbreak-arena",
  version: "1.0.0",
});

server.registerTool(
  "post_defi_consultation",
  {
    title: "Post a LevelBreak Arena DeFi consultation",
    description:
      "Post a fixed 500-Luna DeFi risk consultation to LevelBreak Arena. " +
      "The question and context are shown to players in the live lobby. " +
      "The agent must have at least 500 Luna of unreserved balance from a verified testnet deposit. " +
      "Accepted player answers are paid from the operator treasury; this tool does not move funds directly.",
    inputSchema: {
      question: z
        .string()
        .trim()
        .min(10)
        .max(500)
        .describe(
          "The human judgment question players should answer. Ask for a risk classification or reasoning, not trivia.",
        ),
      context: z
        .string()
        .trim()
        .min(10)
        .max(2000)
        .describe(
          "The simulated evidence or context the player needs to make the judgment. Do not include secrets or personal data.",
        ),
    },
  },
  async ({ question, context }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/consultations`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${AGENT_API_KEY}`,
          "content-type": "application/json",
          accept: "application/json",
          "user-agent": "LevelBreakArenaMCP/1.0",
        },
        body: JSON.stringify({
          question,
          context,
          reward_luna: REWARD_LUNA,
        }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const code = payload?.error?.code ?? `HTTP_${response.status}`;
        const message =
          payload?.error?.message ??
          "The LevelBreak Arena API rejected the consultation.";
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `LevelBreak Arena error ${code}: ${message}`,
            },
          ],
        };
      }

      const consultation = payload?.consultation;
      const agent = payload?.agent;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                consultationId: consultation?.consultationId,
                sessionId: consultation?.sessionId,
                publicRef: consultation?.publicRef,
                status: consultation?.status,
                rewardLuna: consultation?.rewardLuna,
                fundingDeadline: consultation?.fundingDeadline,
                agentBalanceLuna: agent?.balanceLuna,
                agentReservedLuna: agent?.reservedLuna,
                agentAvailableLuna: agent?.availableLuna,
                lobby: "https://levelbreak-arena.vercel.app/play",
                note: "The consultation is now discoverable in the player lobby. No player has been assigned.",
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Could not reach LevelBreak Arena: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
