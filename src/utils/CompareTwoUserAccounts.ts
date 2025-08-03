import type Zenmoney from '../Zenmoney.ts';
import { type Account, type Transaction, type TransactionUpdateType } from "./typing.ts";
import { logger, debugStringForTransaction } from "./Logger.ts";
import readline from 'readline';
import { convertAccountToUpdate, convertBankTransaction, createDebtTransaction } from './converter.ts';

export class CompareTwoUserAccounts {
  left: Zenmoney;
  right: Zenmoney;

  constructor(left: Zenmoney, right: Zenmoney) {
    this.left = left;
    this.right = right;
  }

  async compare(
    startDate: Date,
    endDate: Date,
    leftPayee: string,
    rightPayee: string,
    accountIdForMissedTransactions: string
  ) {
    let debtTitle = "Debts";
    let leftDebtAccount = this.left.getAccounts({ title: debtTitle })[0];
    let rightDebtAccount = this.right.getAccounts({ title: debtTitle })[0];

    if (!leftDebtAccount || !rightDebtAccount) {
      throw new Error("Debt account not found");
    }

    let leftTransactions = this.left.getTransactions({
      startDate,
      endDate,
      payee: leftPayee,
      bankAccountId: leftDebtAccount.id
    })
    let rightTransactions = this.right.getTransactions({
      startDate,
      endDate,
      payee: rightPayee,
      bankAccountId: rightDebtAccount.id
    });

    const { missed, extra } = this.findDiff(leftTransactions, rightTransactions, leftDebtAccount.id, rightDebtAccount.id);

    logger.debug(
      "Missed transactions:\n",
      missed
        .map(el => debugStringForTransaction(el, rightDebtAccount.id))
        .join(',\n')
    );
    logger.debug(
      "Extra transactions:\n",
      extra
        .map(el => debugStringForTransaction(el, leftDebtAccount.id))
        .join(',\n')
    );

    if (missed.length === 0) {
      return;
    }

    let shouldAddTransactions = await this.askUserToAddTransactions();
    if (!shouldAddTransactions) {
      return;
    }

    let leftMerchant = this.left.getMerchant(leftPayee);
    let accountForExpenses = this.left.getAccount(accountIdForMissedTransactions);
    if (!accountForExpenses || !leftMerchant) {
      throw new Error("Account or Merchant not found");
    }

    let transactionsForAdd: TransactionUpdateType[] = [];
    for (const tx of missed) {
      let amount = 0;
      let comment = tx.comment || '';
      let date = tx.date;
      if (tx.outcomeAccount == rightDebtAccount.id) {
        amount = -tx.outcome;
      }
      if (tx.incomeAccount == rightDebtAccount.id) {
        amount = tx.income;
      }

      let debt = createDebtTransaction(
        leftDebtAccount,
        accountForExpenses,
        amount,
        date,
        comment,
        leftMerchant
      )
      transactionsForAdd.push(debt);

      if (amount > 0) {
        let expense = convertBankTransaction(
          { amount: -amount, date, comment },
          leftDebtAccount.user,
          [],
          accountForExpenses.id
        )
        transactionsForAdd.push(expense);
      }
    }

    await this.left.syncDiff({
      transactions: transactionsForAdd,
      accounts: convertAccountToUpdate([accountForExpenses, leftDebtAccount]),
    });
  }

  /**
   * Detects which transactions are present in the left array but **not** in the right (missed)
   * and which are present in the right array but **not** in the left (extra).
   *
   * Two transactions are considered equal when:
   *  1. Their net amount (income - outcome) is identical (to two decimal places)
   *  2. The difference between their dates is not larger than one calendar day
   */
  private findDiff(left: Transaction[], right: Transaction[], leftDebtAccountId: string, rightDebtAccountId: string) {
    // Work with shallow copies so we can mutate safely
    const rightPool: Transaction[] = [...right];
    const extra: Transaction[] = [];

    for (const lTx of left) {
      const idx = rightPool.findIndex(rTx => this.isSameTransaction(lTx, rTx, leftDebtAccountId, rightDebtAccountId));
      if (idx === -1) {
        extra.push(lTx);
      } else {
        // Consume the matched transaction so it cannot match again
        rightPool.splice(idx, 1);
      }
    }

    const missed: Transaction[] = rightPool;
    return { missed, extra };
  }

  /**
   * Determines if two transactions should be treated as representing the same operation.
   */
  private isSameTransaction(left: Transaction, right: Transaction, leftDebtAccountId: string, rightDebtAccountId: string): boolean {
    // for lent -amount, for debt +amount
    let leftAmount = left.incomeAccount === leftDebtAccountId ? -left.outcome : left.outcome;
    // keep the same sign for debt
    let rightAmount = right.outcomeAccount === rightDebtAccountId ? -right.income : right.income;

    if (leftAmount !== rightAmount) return false;

    // Compare dates with tolerance of ±1 day
    const diffDays = Math.abs(
      (new Date(left.date).getTime() - new Date(right.date).getTime()) / (24 * 60 * 60 * 1000)
    );
    return diffDays <= 1;
  }

  async askUserToAddTransactions(): Promise<boolean> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question(
        'Do you want to add these transactions to Zenmoney? (y/n): ',
        (answer: string) => {
          rl.close();
          resolve(answer.trim().toLowerCase() === 'y');
        }
      );
    });
  }

}

