import Storage from './utils/Storage.ts';
import { logger } from './utils/Logger.ts';
import type { Account, AccountFilter, DiffUpdateData, Merchant, StorageFilter, Transaction, UserModel } from './utils/typing.ts';

export default class Zenmoney {
  username: string;
  password: string;
  storage: Storage;
  user: UserModel | null;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;

    this.storage = new Storage(username);
    this.user = this.storage.getUser();
  }

  canSkipLogin() {
    return this.user && this.user.access_token;
  }

  headers(withToken = false) {
    var headers: any = {
      'accept': '*/*',
      'accept-Encoding': 'gzip',
      'accept-Language': 'en-US,en;q=0.9',
      'connection': 'keep-alive',
      'content-Type': 'application/json',
      'host': 'api.zenmoney.ru',
      'user-Agent': 'Zenmoney/i8.5.1-579'
    }

    if (withToken && this.user) {
      headers['authorization'] = `Bearer ${this.user.access_token}`;
    }

    return headers;
  }

  saveUser() {
    if (this.user) {
      this.storage.saveUser(this.user);
    }
  }

  async login() {
    const payload = {
      client_id: 'gbbd75899bd553cac63e4f1698233a',
      client_secret: '2d253c19e5',
      redirect_uri: 'zenmoney-ru://',
      grant_type: 'password',
      username: this.username,
      password: this.password,
      code: null,
      email: null,
      locale: null,
      referrer: null
    };

    try {
      const response = await fetch('https://api.zenmoney.ru/oauth2/token/', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.user = Object.assign(this.user || {}, data);
      this.saveUser()
    } catch (err) {
      logger.error('Login request failed:', err);
      throw err;
    }
  }

  async syncDiff(updateData?: DiffUpdateData) {
    if (!this.user) {
      throw new Error('Not logged in');
    }
    let serverTimestamp = this.user && this.user.serverTimestamp || 0;
    let payload: any = {
      serverTimestamp: serverTimestamp,
      currentClientTimezoneOffset: -240,
      currentClientTimestamp: Math.round(Date.now() / 1000)
    };

    if (updateData && updateData.transactions) {
      payload.transaction = updateData.transactions;
      payload.account = updateData.accounts;
    }

    try {
      const response = await fetch('https://api.zenmoney.ru/v8/diff/', {
        method: 'POST',
        headers: this.headers(true),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (serverTimestamp == 0) {
        this.storage.saveInitialDiff(data);
      }

      // TODO: Tags
      const { transaction, account } = data;
      if (!!account && account.length > 0) {
        this.storage.updateAccounts(account)
      }

      if (!!transaction && transaction.length > 0) {
        this.storage.updateTransactions(transaction)
      }

      this.user.serverTimestamp = data.serverTimestamp;
      this.saveUser()
    } catch (err) {
      logger.error('Syncronization failed:', err);
      throw err;
    }
  }

  getAccount(id: string): Account | null {
    return this.storage.getAccount(id);
  }

  getAccounts(filter: AccountFilter = {}): Account[] {
    return this.storage.getAccounts(filter);
  }

  getTransactions(filter: StorageFilter): Transaction[] {
    return this.storage.getTransactions(filter);
  }

  getMerchant(title: string): Merchant | null {
    return this.storage.getMerchant(title);
  }
}
