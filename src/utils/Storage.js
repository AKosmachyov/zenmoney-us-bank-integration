const fs = require('fs');
const path = require('path');
const Logger = require('./Logger');

class Storage {

  constructor(username) {
    this.username = username;
    this.diffFILE = 'diff.json';
    this.userFile = 'user.json';
    this.transactions = 'transactions.json';
    this.accounts = 'accounts.json';
  }

  getUserDir() {
    return path.join(__dirname, '../..', 'zenmoney-content', this.username);
  }

  checkDirectory() {
    const userDir = this.getUserDir();
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
  }

  getUser() {
    const userFile = path.join(this.getUserDir(), this.userFile)
    if (!fs.existsSync(userFile)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(userFile, 'utf8'));
  }

  saveUser(data) {
    this.checkDirectory();
    const userFile = path.join(this.getUserDir(), this.userFile)
    fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf8');
  }

  saveInitialDiff(data) {
    this.checkDirectory();
    const diffFile = path.join(this.getUserDir(), this.diffFILE)
    fs.writeFileSync(diffFile, JSON.stringify(data, null, 2), 'utf8');
  }

  sortTransactions(transactions) {
    return transactions.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    })
  }

  sortSavedTransactions() {
    const localPath = path.join(this.getUserDir(), this.transactions);
    if (!fs.existsSync(localPath)) {
      Logger.error('Transactions file not found');
      return;
    }

    let existingTransactions = [];

    try {
      existingTransactions = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (e) {
      Logger.error('Failed to parse transactions:', e);
      return;
    }

    existingTransactions = this.sortTransactions(existingTransactions);
    fs.writeFileSync(localPath, JSON.stringify(existingTransactions, null, 2), 'utf8');
  }

  updateTransactions(transactions) {
    this.checkDirectory();
    const localPath = path.join(this.getUserDir(), this.transactions);
    let existingTransactions = [];
    if (!fs.existsSync(localPath)) {
      existingTransactions = this.sortTransactions(transactions);
      fs.writeFileSync(localPath, JSON.stringify(existingTransactions, null, 2), 'utf8');
      return;
    }

    try {
      existingTransactions = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse transactions:', e);
      return;
    }

    for (const newTx of transactions) {
      let insertIdx = 0;
      let newDate = new Date(newTx.date);
      while (insertIdx < existingTransactions.length) {
        let item = existingTransactions[insertIdx];
        let existingDate = new Date(item.date);

        if (newDate >= existingDate) {
          break;
        }

        insertIdx++;
      }
      existingTransactions.splice(insertIdx, 0, newTx);
    }

    fs.writeFileSync(localPath, JSON.stringify(existingTransactions, null, 2), 'utf8');
  }

  updateAccounts(accounts) {
    const localPath = path.join(this.getUserDir(), this.accounts);
    let existingAccounts = [];
    if (!fs.existsSync(localPath)) {
      existingAccounts = accounts;
      fs.writeFileSync(localPath, JSON.stringify(existingAccounts, null, 2), 'utf8');
      return;
    }

    try {
      existingAccounts = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse accounts:', e);
      return;
    }

    const existingMap = {};
    for (const acc of existingAccounts) {
      if (acc && acc.id) {
        existingMap[acc.id] = acc;
      }
    }
    for (const newAcc of accounts) {
      existingMap[newAcc.id] = newAcc;
    }
    const mergedAccounts = Object.values(existingMap);
    fs.writeFileSync(localPath, JSON.stringify(mergedAccounts, null, 2), 'utf8');
  }
}

module.exports = Storage;