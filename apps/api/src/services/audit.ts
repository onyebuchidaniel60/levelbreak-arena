import type { PoolClient } from "pg";

export type AuditActorType =
  | "PLAYER"
  | "OPERATOR"
  | "SYSTEM"
  | "DEMO_AGENT"
  | "AGENT";

export type AuditEventInput = {
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId?: string | null;
  ipHash?: string | null;
  details?: Record<string, unknown>;
};

/**
 * Audit metadata must never contain secrets, raw challenges, signatures,
 * cookies, private keys or database credentials.
 */
export async function recordAudit(
  client: PoolClient,
  event: AuditEventInput,
): Promise<void> {
  await client.query(
    `INSERT INTO audit_events
       (actor_type, actor_id, action, resource_type, resource_id, request_id, ip_hash, details_redacted)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      event.actorType,
      event.actorId ?? null,
      event.action,
      event.resourceType,
      event.resourceId,
      event.requestId ?? null,
      event.ipHash ?? null,
      JSON.stringify(event.details ?? {}),
    ],
  );
}
