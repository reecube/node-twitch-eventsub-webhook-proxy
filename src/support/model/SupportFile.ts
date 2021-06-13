export class SupportFile {
  readonly parent: string;
  readonly name: string;
  readonly basename: string;
  readonly extension: string;
  readonly absPath: string;
  readonly relPath: string;
  readonly isDirectory: boolean;
  readonly level: number;

  constructor(
    parent: string,
    name: string,
    basename: string,
    extension: string,
    absPath: string,
    relPath: string,
    isDirectory: boolean,
    level: number,
  ) {
    this.parent = parent;
    this.name = name;
    this.basename = basename;
    this.extension = extension;
    this.absPath = absPath;
    this.relPath = relPath;
    this.isDirectory = isDirectory;
    this.level = level;
  }
}
