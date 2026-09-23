import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

export type StoredFile = {
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
};

export interface StorageProvider {
  upload(file: File, folder: string): Promise<StoredFile>;
  delete(storageKey: string): Promise<void>;
  resolve(storageKey: string): Promise<string | null>;
}

const allowedAudioMimeTypes = new Set(["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "audio/webm", "audio/ogg"]);
const allowedExtensions = new Set([".mp3", ".m4a", ".wav", ".webm", ".ogg"]);

export function validateAudioUpload(file: File) {
  const extension = path.extname(file.name).toLocaleLowerCase();
  const maxBytes = env.MAX_UPLOAD_MB * 1024 * 1024;
  if (!allowedAudioMimeTypes.has(file.type) || !allowedExtensions.has(extension)) {
    throw new Error("UNSUPPORTED_MEDIA_TYPE");
  }
  if (file.size > maxBytes) {
    throw new Error("FILE_TOO_LARGE");
  }
}

export class LocalStorageProvider implements StorageProvider {
  private root = path.resolve(env.UPLOAD_DIR);

  async upload(file: File, folder: string): Promise<StoredFile> {
    validateAudioUpload(file);
    const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-").toLocaleLowerCase();
    const extension = path.extname(file.name).toLocaleLowerCase();
    const storageKey = `${safeFolder}/${crypto.randomUUID()}${extension}`;
    const destination = path.resolve(this.root, storageKey);
    if (!destination.startsWith(this.root)) throw new Error("INVALID_STORAGE_KEY");
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, Buffer.from(await file.arrayBuffer()));
    return {
      storageKey,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    };
  }

  async delete(storageKey: string) {
    const resolved = await this.resolve(storageKey);
    if (resolved) await unlink(resolved).catch(() => undefined);
  }

  async resolve(storageKey: string) {
    const resolved = path.resolve(this.root, storageKey);
    if (!resolved.startsWith(this.root)) return null;
    try {
      await stat(resolved);
      return resolved;
    } catch {
      return null;
    }
  }
}

export const storageProvider = new LocalStorageProvider();
