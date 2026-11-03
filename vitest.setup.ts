/**
 * Deterministic test environment. Integration tests opt in separately by
 * setting LBA_INTEGRATION_DATABASE_URL; normal unit/E2E runs never touch a
 * real database. GitHub Actions provides DATABASE_URL_UNPOOLED for its
 * ephemeral Postgres service, which this setup uses only when CI=true.
 */
const integrationDatabaseUrl =
  process.env.LBA_INTEGRATION_DATABASE_URL ??
  (process.env.CI === "true" ? process.env.DATABASE_URL_UNPOOLED : undefined);

if (integrationDatabaseUrl) {
  process.env.LBA_INTEGRATION_DATABASE_URL = integrationDatabaseUrl;
  process.env.DATABASE_URL = integrationDatabaseUrl;
  process.env.DEMO_FUNDING_ENABLED = "true";
}

process.env.NODE_ENV ??= "test";
process.env.APP_ENV ??= "local";
process.env.APP_ORIGIN ??= "http://127.0.0.1:4310";
process.env.DATABASE_URL ??= "postgres://lba:lba@127.0.0.1:5432/lba_test";
process.env.AUTH_SESSION_SECRET ??=
  "test-auth-session-secret-0123456789abcdef";
process.env.OPERATOR_AUTH_SECRET ??=
  "test-operator-secret-0123456789abcdef";
process.env.NIMIQ_NETWORK ??= "testnet";
process.env.NIMIQ_TREASURY_ADDRESS ??=
  "NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3";
process.env.NIMIQ_DEMO_AGENT_ADDRESS ??=
  "NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T";
process.env.NIMIQ_TREASURY_PRIVATE_KEY ??= "00";
process.env.NIMIQ_DEMO_AGENT_PRIVATE_KEY ??= "00";
process.env.PAYOUT_WORKER_ENABLED ??= "false";
process.env.DEMO_FUNDING_ENABLED ??= "false";
