import { type Transaction, type TransactionUpdateType } from "./typing.ts";
import { logger, debugStringForTransaction } from "./Logger.ts";
import { convertAccountToUpdate, convertBankTransaction, createDebtTransaction } from './converter.ts';
import inquirer from 'inquirer';
import { createDateWithoutTimeZone, getDateTwoWeeksAgo, toISODateString } from './date.ts';
import Zenmoney from '../Zenmoney.ts';

export class CompareTwoUserAccounts {
  left: Zenmoney;
  right?: Zenmoney;

  constructor(left: Zenmoney) {
    this.left = left;
  }

  async setup() {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'otherUsername',
        message: 'Other Zenmoney username:',
        validate: (v: string) => !!v || 'Username is required'
      },
      {
        type: 'password',
        name: 'otherPassword',
        message: 'Other Zenmoney password:',
        mask: '*',
        validate: (v: string) => !!v || 'Password is required'
      },
    ]);

    const right = new Zenmoney(answers.otherUsername, answers.otherPassword);
    await right.syncDiff();
    this.right = right;

    let details = await inquirer.prompt([
      {
        type: 'input',
        name: 'startDate',
        message: 'Compare from date in format YYYY-MM-DD:',
        default: () => {
          return getDateTwoWeeksAgo();
        }
      },
      {
        type: 'input',
        name: 'leftPayee',
        message: 'Debt account title (exact as in Zenmoney):',
        validate: (v: string) => !!v || 'Debt account title is required'
      },
      {
        type: 'input',
        name: 'rightPayee',
        message: "Debt account title in other user's Zenmoney (exact as in Zenmoney):",
        validate: (v: string) => !!v || 'Debt account title is required'
      },
      {
        type: 'input',
        name: 'accountIdForMissedTransactions',
        message: 'Account title for missed transactions:',
        validate: (v: string) => !!v || 'Account title is required'
      }
    ]);

    const { startDate, leftPayee, rightPayee, accountIdForMissedTransactions } = details;
    let account = this.left.getAccounts({ title: accountIdForMissedTransactions })[0];

    if (!account) {
      throw new Error("Account not found");
    }

    const start = createDateWithoutTimeZone(startDate);
    const end = new Date();

    await this.compare(
      start,
      end,
      leftPayee,
      rightPayee,
      account.id
    );
  }

  async compare(
    startDate: Date,
    endDate: Date,
    leftPayee: string,
    rightPayee: string,
    accountIdForMissedTransactions?: string
  ) {
    if (!this.right) {
      throw new Error("Right Zenmoney not set");
    }

    let debtAccountType = 'debt';
    let leftDebtAccount = this.left.getAccounts({ type: debtAccountType })[0];
    let rightDebtAccount = this.right.getAccounts({ type: debtAccountType })[0];

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

    const { missed, extra } = this.findDiff(
      leftTransactions,
      rightTransactions,
      leftDebtAccount.id,
      rightDebtAccount.id
    );

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

    if (missed.length === 0 || !accountIdForMissedTransactions) {
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
    const { choice } = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: 'Do you want to add these transactions to Zenmoney? (y/n): ',
      choices: ['yes', 'no'],
    }]);

    return choice === 'yes';
  }

}
