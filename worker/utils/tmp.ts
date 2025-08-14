// worker/utils/tmp.ts
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

export function tmpFile(ext = ".bin") {
  const p = path.join(os.tmpdir(), `${crypto.randomBytes(8).toString("hex")}${ext}`);
  return p;
}

export async function saveToFile(resp: Response, targetPath: string): Promise<void> {
  const fileStream = createWriteStream(targetPath);
  const reader = resp.body!.getReader();
  const pump = async () => {
    const { done, value } = await reader.read();
    if (done) { fileStream.end(); return; }
    fileStream.write(value);
    await pump();
  };
  await pump();
}

export async function safeUnlink(p?: string) {
  if (!p) return;
  try { await unlink(p); } catch {}
}
