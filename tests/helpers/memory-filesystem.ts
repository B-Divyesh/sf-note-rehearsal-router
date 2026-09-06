export class MemoryFileHandle {
  readonly kind = 'file' as const;

  constructor(public readonly name: string, private contents: string, private readonly modified = 1) {}

  async getFile(): Promise<File> {
    const value = this.contents;
    return {
      name: this.name,
      size: new TextEncoder().encode(value).byteLength,
      lastModified: this.modified,
      text: async () => value
    } as File;
  }

  setContents(value: string): void {
    this.contents = value;
  }
}

export class MemoryDirectoryHandle {
  readonly kind = 'directory' as const;
  readonly entriesMap = new Map<string, MemoryDirectoryHandle | MemoryFileHandle>();
  readonly written = new Map<string, string>();

  constructor(public readonly name: string) {}

  async *entries(): AsyncGenerator<[string, MemoryDirectoryHandle | MemoryFileHandle]> {
    yield* this.entriesMap.entries();
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<MemoryDirectoryHandle> {
    const existing = this.entriesMap.get(name);
    if (existing instanceof MemoryDirectoryHandle) return existing;
    if (!options?.create) throw new DOMException('Missing', 'NotFoundError');
    const created = new MemoryDirectoryHandle(name);
    this.entriesMap.set(name, created);
    return created;
  }

  async getFileHandle(name: string, options?: { create?: boolean }): Promise<MemoryFileHandle | {
    kind: 'file';
    name: string;
    createWritable: () => Promise<{ write: (value: string) => Promise<void>; close: () => Promise<void>; abort: () => Promise<void> }>;
  }> {
    const existing = this.entriesMap.get(name);
    if (existing instanceof MemoryFileHandle) return existing;
    if (!options?.create) throw new DOMException('Missing', 'NotFoundError');
    const directory = this;
    return {
      kind: 'file' as const,
      name,
      async createWritable() {
        let contents = '';
        return {
          async write(value: string) { contents = value; },
          async close() {
            directory.written.set(name, contents);
            directory.entriesMap.set(name, new MemoryFileHandle(name, contents));
          },
          async abort() { contents = ''; }
        };
      }
    };
  }

  async removeEntry(name: string): Promise<void> {
    if (!this.entriesMap.delete(name)) throw new DOMException('Missing', 'NotFoundError');
    this.written.delete(name);
  }
}
