import type { OpenClawConfig } from "../config/config.js";
import { resolveStorePath, updateSessionStoreEntry } from "../config/sessions.js";
import { resolveSessionAgentId } from "./agent-scope.js";

type PendingMarker = { value: boolean };

type MarkUntrustedConfirmationPendingParams = {
  config?: OpenClawConfig;
  sessionKey?: string;
  agentId?: string;
  pendingMarker?: PendingMarker;
};

export async function markUntrustedConfirmationPending(
  params: MarkUntrustedConfirmationPendingParams,
): Promise<void> {
  if (!params.config || !params.sessionKey) return;
  if (params.pendingMarker?.value) return;
  const agentId =
    params.agentId ??
    resolveSessionAgentId({
      sessionKey: params.sessionKey,
      config: params.config,
    });
  const storePath = resolveStorePath(params.config.session?.store, { agentId });
  try {
    const updated = await updateSessionStoreEntry({
      storePath,
      sessionKey: params.sessionKey,
      update: async (entry) => {
        if (entry.untrustedMemoryPending) return null;
        return { untrustedMemoryPending: true, untrustedMemoryPendingAt: Date.now() };
      },
    });
    if (updated && params.pendingMarker) params.pendingMarker.value = true;
  } catch {
    // Best-effort; do not fail callers.
  }
}

export type { MarkUntrustedConfirmationPendingParams, PendingMarker };
