export type ToolGate = {
  blocked: boolean;
  reason?: string;
  source?: string;
};

export const TOOL_GATE_UNTRUSTED_REASON =
  "Untrusted memory content detected; tools disabled for safety.";
export const TOOL_GATE_UNTRUSTED_HOOK_REASON =
  "Untrusted hook context detected; tools disabled for safety.";

const CONFIRM_PREFIXES = ["confirm", "yes, proceed", "yes proceed"];

export function createToolGate(params?: {
  blocked?: boolean;
  reason?: string;
  source?: string;
}): ToolGate {
  return {
    blocked: params?.blocked ?? false,
    reason: params?.reason,
    source: params?.source,
  };
}

export function blockToolGate(gate: ToolGate, params?: { reason?: string; source?: string }): void {
  if (gate.blocked) return;
  gate.blocked = true;
  if (params?.reason) gate.reason = params.reason;
  if (params?.source) gate.source = params.source;
}

export function isExplicitUntrustedConfirmation(text?: string): boolean {
  const cleaned = text?.trim().toLowerCase() ?? "";
  if (!cleaned) return false;
  return CONFIRM_PREFIXES.some((prefix) => cleaned === prefix || cleaned.startsWith(`${prefix} `));
}
