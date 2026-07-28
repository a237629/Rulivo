import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PrivateObjectStore {
  private readonly root = resolve(process.env.OBJECT_STORAGE_ROOT ?? ".data/private-objects");

  private pathFor(key: string): string {
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|m4a|webm)$/i.test(key))
      throw new Error("Invalid object key");
    const path = resolve(this.root, key);
    if (!path.startsWith(`${this.root}${sep}`)) throw new Error("Invalid object key");
    return path;
  }

  public async put(key: string, content: Buffer): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, content, { flag: "wx", mode: 0o600 });
  }

  public read(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key));
  }

  public async remove(key: string): Promise<void> {
    await unlink(this.pathFor(key)).catch(() => undefined);
  }
}
