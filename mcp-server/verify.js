#!/usr/bin/env node
/**
 * Developer verification client for the LevelBreak Arena MCP server.
 *
 * It spawns index.js over stdio, lists the registered tools, and optionally
 * calls post_defi_consultation against the live Agent API.
 *
 * Required:
 *   LBA_AGENT_API_KEY
 *
 * Optional:
 *   LBA_API_BASE_URL       default https://levelbreak-arena.onrender.com
 *   LBA_VERIFY_CALL=true   actually post a 500-Luna consultation
 *   LBA_VERIFY_QUESTION / LBA_VERIFY_CONTEXT
 *
 * The API key is passed only to the child process and is never printed.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";

const apiKey = process.env.LBA_AGENT_API_KEY ?? "";
if (!apiKey) {
  console.error("LBA_AGENT_API_KEY is required.");
  process.exit(1);
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["index.js"],
  cwd: fileURLToPath(new URL(".", import.meta.url)),
  env: {
    ...process.env,
    LBA_AGENT_API_KEY: apiKey,
    LBA_API_BASE_URL:
      process.env.LBA_API_BASE_URL ?? "https://levelbreak-arena.onrender.com",
  },
});

const client = new Client({ name: "levelbreak-arena-verify", version: "1.0.0" });

try {
  await client.connect(transport);
  const tools = await client.listTools();
  console.log(
    JSON.stringify(
      {
        event: "mcp_tools_listed",
        tools: tools.tools.map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
      null,
      2,
    ),
  );

  if (process.env.LBA_VERIFY_CALL === "true") {
    const result = await client.callTool({
      name: "post_defi_consultation",
      arguments: {
        question:
          process.env.LBA_VERIFY_QUESTION ??
          "Would you treat this simulated MCP-posted yield strategy as safe or risky?",
        context:
          process.env.LBA_VERIFY_CONTEXT ??
          "An MCP-connected agent submitted this question. The simulated strategy advertises 240% APY, uses an unaudited new contract, and its reward token has thin liquidity.",
      },
    });
    console.log(
      JSON.stringify(
        { event: "mcp_tool_result", isError: Boolean(result.isError), result },
        null,
        2,
      ),
    );
    if (result.isError) process.exitCode = 1;
  }
} finally {
  try {
    await client.close();
  } catch {
    // The child may already have exited after an error.
  }
  setTimeout(() => process.exit(process.exitCode ?? 0), 250);
}
