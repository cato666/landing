export abstract class StorageService {
  abstract ensureDir(dirPath: string): Promise<void>;
  abstract pathExists(targetPath: string): Promise<boolean>;
  abstract readJson<T>(filePath: string): Promise<T>;
  abstract writeJson(filePath: string, data: unknown): Promise<void>;
  abstract readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
  abstract readBuffer(filePath: string): Promise<Buffer>;
  abstract writeFile(filePath: string, content: string | Buffer, encoding?: BufferEncoding): Promise<void>;
  abstract readdir(dirPath: string): Promise<string[]>;
  abstract remove(targetPath: string): Promise<void>;
}