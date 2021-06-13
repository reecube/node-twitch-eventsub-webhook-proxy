import { BaseSupport } from './BaseSupport';

export interface Token {
  token: string
  expires: number
}

interface SecretFile {
  api: Token
  user: Token
}

export class Secret extends BaseSupport {
  private readonly fetchVerifyCalls = 100;
  private readonly fetchVerifyDelay = 100;

  private apitoken: Token = null;
  private usertoken: Token = null;

  private async verifyAndGetToken(
    name: string,
    getToken: () => Token,
    setToken: (Token) => void,
    fetchToken: () => Promise<void>,
    firstCall = true,
  ): Promise<string> {
    const now = new Date().getTime();

    const initialToken = getToken();

    if (initialToken) {
      if (initialToken.expires >= now) {
        return initialToken.token;
      } else if (!firstCall) {
        throw new Error(`Twitch auth returned an invalid ${name} token twice! ${JSON.stringify(initialToken)}`);
      }

      this.s.logger.warn(`Memory ${name} token expired!`);
    } else {
      this.s.logger.log(`Fetch empty ${name} token.`);
    }

    setToken(null);

    await fetchToken();

    let newToken: Token = null;

    for (let i = 0; i < this.fetchVerifyCalls; i++) {
      await this.s.h.delay(this.fetchVerifyDelay);

      newToken = getToken();
    }

    await this.writeToFile();

    return await this.verifyAndGetToken(name, getToken, setToken, fetchToken, false);
  }

  async getApiToken(): Promise<string> {
    return await this.verifyAndGetToken(
      'api',
      () => this.apitoken,
      this.setApiToken,
      this.s.middleware.twitchAuthApi.fetchToken,
    );
  }

  async getUserToken(): Promise<string> {
    return await this.verifyAndGetToken(
      'user',
      () => this.usertoken,
      this.setUserToken,
      this.s.middleware.twitchAuthUser.fetchToken,
    );
  }

  setApiToken(token: Token): void {
    this.apitoken = token;
  }

  setUserToken(token: Token): void {
    this.usertoken = token;
  }

  async loadFromFile(): Promise<void> {
    const path = this.s.c.path.user.secret;

    if (!(await this.s.fs.exists(path))) {
      this.s.logger.error('Secret file does not exist!');

      this.apitoken = null;
      this.usertoken = null;

      return;
    }

    const data: SecretFile = await this.s.fs.readObject(path);

    const now = new Date().getTime();

    if (data.api.expires > now) {
      this.s.logger.warn('Local api token expired!');

      this.apitoken = null;
    } else {
      this.apitoken = data.api;
    }

    if (data.user.expires > now) {
      this.s.logger.warn('Local user token expired!');

      this.usertoken = null;
    } else {
      this.usertoken = data.user;
    }
  }

  async writeToFile(): Promise<void> {
    const path = this.s.c.path.user.secret;

    const data: SecretFile = {
      api: this.apitoken,
      user: this.usertoken,
    };

    await this.s.fs.writeObject(path, data);
  }
}
