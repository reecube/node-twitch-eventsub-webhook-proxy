import { Support } from './Support';

export abstract class BaseSupport {
  protected readonly s: Support;

  constructor(support: Support) {
    this.s = support;
  }
}
