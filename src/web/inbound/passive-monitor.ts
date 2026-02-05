import fs from "node:fs/promises";
import path from "node:path";

import type { MoltbotConfig } from "../../config/config.js";
import { resolveAgentWorkspaceDir } from "../../agents/agent-scope.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("gateway/channels/whatsapp").child("passive-monitor");

const DIR_MODE = 0o700;
const FILE_MODE = 0o600;

export type PassiveWhatsAppMessage = {
  cfg: MoltbotConfig;
  agentId: string;
  timestampMs: number;
  group: boolean;
  chatId: string;
  groupSubject?: string;
  senderE164?: string | null;
  pushName?: string | null;
  isFromMe: boolean;
  body: string;
};

function normalizeName(value?: string | null): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

function normalizeBody(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function buildDirectLabel(chatId: string, name: string | null): string {
  if (!name) return chatId;
  return `${chatId} (${name})`;
}

function buildGroupLabel(groupSubject: string | null, chatId: string): string {
  return groupSubject ? groupSubject : chatId;
}

function buildGroupSpeaker(
  name: string | null,
  senderE164: string | null | undefined,
  isFromMe: boolean,
): string {
  if (isFromMe) return "You";
  if (name && senderE164) return `${name} (${senderE164})`;
  if (name) return name;
  if (senderE164) return senderE164;
  return "Unknown";
}

async function ensureFileHeader(filePath: string, header: string): Promise<void> {
  try {
    await fs.writeFile(filePath, header, {
      encoding: "utf-8",
      flag: "wx",
      mode: FILE_MODE,
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "EEXIST") throw err;
  }
}

export async function appendPassiveWhatsAppMessage(params: PassiveWhatsAppMessage): Promise<void> {
  try {
    const body = normalizeBody(params.body);
    if (!body) return;

    const timestamp = new Date(params.timestampMs);
    const dateStr = timestamp.toISOString().slice(0, 10);
    const timeStr = timestamp.toISOString().slice(11, 19);

    const workspaceDir = resolveAgentWorkspaceDir(params.cfg, params.agentId);
    const memoryDir = path.join(workspaceDir, "memory", "whatsapp");
    const filePath = path.join(memoryDir, `${dateStr}.md`);

    await fs.mkdir(memoryDir, { recursive: true, mode: DIR_MODE });
    await ensureFileHeader(filePath, `# WhatsApp Messages - ${dateStr}\n`);

    const name = normalizeName(params.pushName);
    const groupSubject = normalizeName(params.groupSubject);

    const sectionTitle = params.group
      ? `Group: ${buildGroupLabel(groupSubject, params.chatId)}`
      : `Direct: ${buildDirectLabel(params.chatId, name)}`;

    const speaker = params.group
      ? buildGroupSpeaker(name, params.senderE164, params.isFromMe)
      : params.isFromMe
        ? `To ${buildDirectLabel(params.chatId, name)}`
        : `From ${buildDirectLabel(params.chatId, name)}`;

    const entry = `\n## ${sectionTitle}\n- **${timeStr}** ${speaker}: ${body}\n`;
    await fs.appendFile(filePath, entry, { encoding: "utf-8", mode: FILE_MODE });
  } catch (err) {
    log.warn({ error: String(err) }, "passive monitor write failed");
  }
}
