import { Dictionary } from '../types/base';

class Url {
  queryFromParams(params: Dictionary<string>): string {
    return Object.entries(params).map(param => `${param[0]}=${param[1]}`).join('&');
  }

  make(url: string, params: Dictionary<string>): string {
    return `${url}?${this.queryFromParams(params)}`;
  }

  combine(urlA: string, urlB: string): string {
    return `${urlA}/${urlB}`;
  }
}

export class Helper {
  url = new Url();

  delay(ms: number): Promise<void> {
    return new Promise(((resolve) => {
      setTimeout(resolve, ms);
    }));
  }

  getBase<Type>(key: string, entries: Dictionary<Type>, baseKey: string = 'base'): Type {
    return entries[entries.hasOwnProperty(key) ? key : baseKey];
  };

  makeSafe(input: string): string {
    return input.replace(/[^0-9a-z\-_]/gi, '');
  };

  ext(path: string): string {
    const i = path.lastIndexOf('.');

    return (i < 0) ? '' : path.substr(i + 1);
  };

  basename(path: string): string {
    const i = path.lastIndexOf('.');

    return (i < 0) ? path : path.substr(0, i);
  };

  paseArgsString(input: string): Dictionary<string> {
    const regex = /,\s+/g;
    const separator = ':';

    const result: Dictionary<string> = {};

    const inputParts = input.split(regex);

    for (const inputPart of inputParts) {
      const idx = inputPart.indexOf(separator);

      if (idx < 0) continue;

      const key = inputPart.substr(0, idx);
      const value = inputPart.substr(idx + separator.length);

      result[key.trim()] = value.trim();
    }

    return result;
  }

  recursiveJoin(input: any, separator?: string): string {
    if (!input.length || !input.map) return input.toString();

    return input.map(entry => this.recursiveJoin(entry, separator)).join(separator);
  }
}
