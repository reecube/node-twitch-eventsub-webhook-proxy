import * as chalk from 'chalk';
import * as ErrorStackParser from 'error-stack-parser';
import { StackFrame } from 'error-stack-parser';

export class Logger {

  private readonly cwd = process.cwd();

  private readonly typePad = 5;

  private readonly space = '  ';

  private readonly debug: boolean;

  // Only modify this value on main stream!
  level: number = 0;

  constructor(debug: boolean) {
    this.debug = debug;
  }

  private fixPath(path: string): string {
    path = path.replace(this.cwd, '');
    path = path.replace(/\\/g, '/');
    return `.${path}`;
  }

  private beautify(item: any): string {
    if (item instanceof Error) return `${item.name}: ${item.message}`;

    const formattedLines = JSON.stringify(item, null, this.space)
      .replace('\r', '')
      .split('\n');

    if (formattedLines.length > 1) {
      let width = 32;

      for (const formattedLine of formattedLines) {
        if (formattedLine.length <= width) continue;

        width = formattedLine.length;
      }

      formattedLines.unshift('');
      formattedLines.push('');

      for (let i = 0; i < formattedLines.length; i++) {
        formattedLines[i] = this.space + formattedLines[i].padEnd(width + this.space.length);
      }
    }

    return ((formattedLines.length > 1) ? '\n' : '') + chalk.inverse(formattedLines.join('\n'));
  }

  private static firstExternalStackFrame(frames: StackFrame[]): StackFrame | null {
    for (const frame of frames) {
      const fileName = frame.fileName;

      if (!fileName || fileName.endsWith('Logger.ts')) continue;

      return frame;
    }

    return null;
  }

  private doDefault(type, typeTransformer, messages: any[]): void {
    const firstMessage: any = messages[0];

    const newType = type.substr(0, this.typePad);
    const newTypeSpaces = ' '.repeat(Math.max(this.typePad - newType.length, 0));

    const typeOutput = typeTransformer(newType);

    messages.unshift(`[${typeOutput}]${newTypeSpaces} ${this.space.repeat(this.level)}`);

    messages.unshift(chalk.gray((new Date()).toISOString()));

    if (!this.debug) return;

    const error: Error = (firstMessage?.debugUseThisStack) ? firstMessage : new Error();

    const stacktrace = ErrorStackParser.parse(error);

    const stacktraceFrame = Logger.firstExternalStackFrame(stacktrace);

    const addToMessages = (msg) => {
      const postfix = chalk.gray(msg);

      messages.push(postfix);
    };

    if (!stacktraceFrame || !stacktraceFrame.fileName) return addToMessages('EMPTY');

    const msg: any[] = [
      this.fixPath(stacktraceFrame.fileName || 'Error'),
    ];

    if (stacktraceFrame.lineNumber) msg.push(stacktraceFrame.lineNumber);

    return addToMessages(`(${msg.join(':')})`);
  };

  log(...messages: any[]): void {
    if (!messages.length) return;

    this.doDefault('INFO', chalk.cyanBright, messages);

    console.log.apply(null, messages.map(message => {
      if (typeof message !== 'string') return this.beautify(message);

      return message;
    }));
  };

  warn(...messages: any[]): void {
    if (!messages.length) return;

    this.doDefault('WARN', chalk.yellowBright, messages);

    console.log.apply(null, messages.map(message => {
      if (typeof message !== 'string') return this.beautify(message);

      return message;
    }));
  };

  error(...messages: any[]): void {
    if (!messages.length) return;

    this.doDefault('ERROR', chalk.redBright, messages);

    console.error.apply(null, messages.map(message => {
      if (typeof message !== 'string') return this.beautify(message);

      return message;
    }));
  };
}
