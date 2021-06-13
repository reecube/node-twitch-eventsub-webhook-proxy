import * as path from 'path';
import * as fs from 'fs';
import { Dirent } from 'fs';

import { BaseSupport } from './BaseSupport';
import { SupportFile } from './model/SupportFile';

export class FileSystem extends BaseSupport {
  exists(path: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        fs.accessSync(path, fs.constants.F_OK);

        return resolve(true);
      } catch (e) {
        return resolve(false);
      }
    });
  }

  private async applyReplaceStrategy(from: string, to: string, replace: boolean): Promise<boolean> {
    if (!(await this.exists(from))) {
      return false;
    }

    if (await this.exists(to)) {
      if (replace) {
        await this.rrmdir(to);
      } else {
        return false;
      }
    }

    await this.rmkparentdir(to);

    return true;
  }

  async rename(from: string, to: string, replace: boolean = false): Promise<void> {
    if (!(await this.applyReplaceStrategy(from, to, replace))) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        fs.renameSync(from, to);

        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }

  async copy(from: string, to: string, replace: boolean = false): Promise<void> {
    if (!(await this.applyReplaceStrategy(from, to, replace))) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        fs.copyFileSync(from, to);

        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }

  readdir(dir: string): Promise<Dirent[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) {
          return reject(err);
        }

        return resolve(files);
      });
    });
  }

  async rcopy(from: string, to: string, filter: (file: SupportFile) => boolean = () => true): Promise<void> {
    const files = await this.rreaddir(from);

    for (const file of files) {
      if (!filter(file)) {
        continue;
      }

      await this.copy(file.absPath, path.join(to, file.relPath));
    }
  }

  readText(file): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(file, (err, file) => {
        try {
          if (err) return reject(err);

          resolve(file.toString());
        } catch (e) {
          return reject(e);
        }
      });
    });
  }

  async readObject(file): Promise<any> {
    return JSON.parse(await this.readText(file));
  }

  writeText(file, text): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        fs.writeFileSync(file, text, 'utf8');

        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }

  async writeObject(file, obj): Promise<void> {
    await this.writeText(file, JSON.stringify(obj));
  }

  rrmdir(dir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        fs.rmdirSync(dir, { recursive: true });

        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }

  async rmkparentdir(dir: string): Promise<void> {
    return await this.rmkdir(path.dirname(dir));
  }

  async rmkdir(dir: string): Promise<void> {
    if (await this.exists(dir)) return;

    return new Promise((resolve, reject) => {
      try {
        fs.mkdirSync(dir, { recursive: true });

        return resolve();
      } catch (e) {
        return reject(e);
      }
    });
  }

  async rreaddir(dir: string, parent: string = '.', level: number = 0): Promise<SupportFile[]> {
    if (!(await this.exists(dir))) {
      return [];
    }

    const dirents = await this.readdir(dir);

    const files: SupportFile[] = [];

    for (const dirent of dirents) {
      const fileName = dirent.name;
      const file = {
        parent: parent.replace(/\\/g, '/'),
        name: fileName,
        basename: this.s.h.basename(fileName),
        extension: this.s.h.ext(fileName).toLowerCase(),
        absPath: path.resolve(dir, fileName),
        relPath: path.join(parent, fileName),
        isDirectory: dirent.isDirectory(),
        level,
      };

      files.push(file);
      if (!file.isDirectory) {
        continue;
      }

      for (const entry of await this.rreaddir(file.absPath, file.relPath, level + 1)) {
        files.push(entry);
      }
    }

    return files;
  };

  async safeLoadFile(basePath: string, file: string): Promise<string> {
    const safeFile = file.replace(/\.\./g, '');

    if (safeFile !== file) throw new Error(`You are locked on the proposed path!`);

    const absPath = path.join(basePath, safeFile);

    if (!(await this.exists(absPath))) throw new Error(`File '${absPath}' does not exist!`);

    return await this.readText(absPath);
  }

  async delete(path: string): Promise<void> {
    if (!(await this.exists(path))) return;

    fs.unlinkSync(path);
  }
}
