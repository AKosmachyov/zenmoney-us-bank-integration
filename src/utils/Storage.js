import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './Logger.ts';
import { createDateWithoutTimeZone } from './date.ts';

export default class Storage {

  constructor(username) {
    this.username = username;
    this.diffFILE = 'diff.json';
    this.userFile = 'user.json';
    this.transactions = 'transactions.json';
    this.accounts = 'accounts.json';
  }

  getUserDir() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return join(__dirname, '../..', 'zenmoney-content', this.username);
  }

  checkDirectory() {
    const userDir = this.getUserDir();
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
  }

  getUser() {
    const userFile = join(this.getUserDir(), this.userFile)
    if (!fs.existsSync(userFile)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(userFile, 'utf8'));
  }

  saveUser(data) {
    this.checkDirectory();
    const userFile = join(this.getUserDir(), this.userFile)
    fs.writeFileSync(userFile, JSON.stringify(data, null, 2), 'utf8');
  }

  saveInitialDiff(data) {
    this.checkDirectory();
    const diffFile = join(this.getUserDir(), this.diffFILE)
    fs.writeFileSync(diffFile, JSON.stringify(data, null, 2), 'utf8');
  }

  sortTransactions(transactions) {
    return transactions.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    })
  }

  sortSavedTransactions() {
    const localPath = join(this.getUserDir(), this.transactions);
    if (!fs.existsSync(localPath)) {
      logger.error('Transactions file not found');
      return;
    }

    let existingTransactions = [];

    try {
      existingTransactions = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (e) {
      logger.error('Failed to parse transactions:', e);
      return;
    }

    existingTransactions = this.sortTransactions(existingTransactions);
    fs.writeFileSync(localPath, JSON.stringify(existingTransactions, null, 2), 'utf8');
  }

  updateTransactions(transactions) {
    this.checkDirectory();
    const localPath = join(this.getUserDir(), this.transactions);
    let existingTransactions = [];

    let newTransactions = [];
    let deletedTransactions = [];

    transactions.forEach(item => {
      if (item.deleted) {
        deletedTransactions.push(item);
      } else {
        newTransactions.push(item);
      }
    });

    if (!fs.existsSync(localPath)) {
      existingTransactions = this.sortTransactions(newTransactions);
      fs.writeFileSync(localPath, JSON.stringify(existingTransactions, null, 2), 'utf8');
      return;
    }

    try {
      existingTransactions = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse transactions:', e);
      return;
    }

    for (const item of deletedTransactions) {
      let insertIdx = existingTransactions.findIndex(el => el.id === item.id);
      if (insertIdx !== -1) {
        existingTransactions.splice(insertIdx, 1);
      }
    }

    for (const item of newTransactions) {
      const existingIdx = existingTransactions.findIndex(tx => tx.id === item.id);
      if (existingIdx !== -1) {
        existingTransactions[existingIdx] = item;
      } else {
        let index = 0;
        let newDate = new Date(item.date);
        while (index < existingTransactions.length) {
          let existingItem = existingTransactions[index];
          let existingDate = new Date(existingItem.date);
          if (newDate >= existingDate) {
            break;
          }
          index++;
        }
        existingTransactions.splice(index, 0, item);
      }
    }

    fs.writeFileSync(localPath, JSON.stringify(existingTransactions, null, 2), 'utf8');
  }

  updateAccounts(accounts) {
    const localPath = join(this.getUserDir(), this.accounts);
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

  getAccount(id) {
    const localPath = join(this.getUserDir(), this.accounts);
    if (!fs.existsSync(localPath)) {
      logger.error('Accounts file not found');
      return null;
    }

    let accounts = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    return accounts.find(account => account.id === id);
  }

  getAccounts(filter) {
    const localPath = join(this.getUserDir(), this.accounts);
    if (!fs.existsSync(localPath)) {
      logger.error('Accounts file not found');
      return [];
    }
    let accounts = JSON.parse(fs.readFileSync(localPath, 'utf8'));
    return accounts.filter(account => {
      if (filter.title) {
        if (!account.title.includes(filter.title)) {
          return false
        }
      }
      return true;
    });
  }

  getTransactions(filter) {
    const localPath = join(this.getUserDir(), this.transactions);
    if (!fs.existsSync(localPath)) {
      logger.error('Transactions file not found');
      return [];
    }

    let transactions = JSON.parse(fs.readFileSync(localPath, 'utf8'));

    if (filter) {
      transactions = transactions.filter(item => {
        if (filter.startDate) {
          const transactionDate = createDateWithoutTimeZone(item.date)
          if (filter.startDate > transactionDate) {
            return false
          }
        }

        if (filter.endDate) {
          const transactionDate = createDateWithoutTimeZone(item.date)
          if (filter.endDate < transactionDate) {
            return false
          }
        }

        if (filter.payee && filter.payee != item.payee) {
          return false;
        }

        if (filter.merchant && filter.merchant != item.merchant) {
          return false;
        }

        if (
          filter.bankAccountId &&
          filter.bankAccountId != item.incomeAccount &&
          filter.bankAccountId != item.outcomeAccount
        ) {
          return false;
        }

        return true;
      });
    }
    return transactions;
  }
}
