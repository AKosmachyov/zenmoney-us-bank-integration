const Storage = require('./utils/Storage');
const Logger = require('./utils/Logger');

class Zenmoney {

  constructor(username, password) {
    this.username = username;
    this.password = password;

    this.storage = new Storage(username);
    this.user = this.storage.getUser();
  }

  canSkipLogin() {
    return this.user && this.user.access_token;
  }

  headers(withToken = false) {
    var headers = {
      'accept': '*/*',
      'accept-Encoding': 'gzip',
      'accept-Language': 'en-US,en;q=0.9',
      'connection': 'keep-alive',
      'content-Type': 'application/json',
      'host': 'api.zenmoney.ru',
      'user-Agent': 'Zenmoney/i8.5.1-579'
    }

    if (withToken) {
      headers['authorization'] = `Bearer ${this.user.access_token}`;
    }

    return headers;
  }

  saveUser() {
    this.storage.saveUser(this.user);
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
      Logger.error('Login request failed:', err);
      throw err;
    }
  }

  async syncDiff(updateData) {
    let serverTimestamp = this.user && this.user.serverTimestamp || 0;
    const payload = {
      serverTimestamp: serverTimestamp,
      currentClientTimezoneOffset: -240,
      currentClientTimestamp: Math.round(Date.now() / 1000)
    };

    if (updateData && updateData.transaction) {
      // TODO: send account data based on transaction
      payload.transaction = data.transaction;
      payload.account = [];
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
      Logger.error('Syncronization failed:', err);
      throw err;
    }
  }
}

module.exports = Zenmoney;
