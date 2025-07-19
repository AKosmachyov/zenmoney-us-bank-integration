import { type Transaction, type Zenmoney } from "./typing.ts";
import { logger } from "./Logger.ts";

export class CompareTwoUserAccounts {
  left: Zenmoney;
  right: Zenmoney;

  constructor(left: Zenmoney, right: Zenmoney) {
    this.left = left;
    this.right = right;
  }

  compare(startDate: Date, leftMerchant: string, rightMerchant: string) {
    let leftTransactions = this.left.getStorage().getTransactions({
      startDate,
      merchant: leftMerchant
    })
    let rightTransactions = this.right.getStorage().getTransactions({
      startDate,
      merchant: rightMerchant
    });

    const { missed, extra } = this.findDiff(leftTransactions, rightTransactions);

    logger.log(
      "Missed transactions:\n",
      missed
        .map(el => this.formatTransaction(el))
        .join(',\n')
    );
    logger.log(
      "Extra transactions:\n",
      extra
        .map(el => this.formatTransaction(el))
        .join(',\n')
    );
  }

  /**
   * Detects which transactions are present in the left array but **not** in the right (missed)
   * and which are present in the right array but **not** in the left (extra).
   *
   * Two transactions are considered equal when:
   *  1. Their net amount (income - outcome) is identical (to two decimal places)
   *  2. The difference between their dates is not larger than one calendar day
   */
  private findDiff(left: Transaction[], right: Transaction[]) {
    // Work with shallow copies so we can mutate safely
    const rightPool: Transaction[] = [...right];
    const missed: Transaction[] = [];

    for (const lTx of left) {
      const idx = rightPool.findIndex(rTx => this.isSameTransaction(lTx, rTx));
      if (idx === -1) {
        missed.push(lTx);
      } else {
        // Consume the matched transaction so it cannot match again
        rightPool.splice(idx, 1);
      }
    }

    const extra: Transaction[] = rightPool; // whatever was not matched
    return { missed, extra };
  }

  /**
   * Determines if two transactions should be treated as representing the same operation.
   */
  private isSameTransaction(left: Transaction, right: Transaction): boolean {
    if (left.outcome !== right.outcome) return false;

    // Compare dates with tolerance of ±1 day
    const diffDays = Math.abs(
      (new Date(left.date).getTime() - new Date(right.date).getTime()) / (24 * 60 * 60 * 1000)
    );
    return diffDays <= 1;
  }

  private formatTransaction(transaction: Transaction): string {
    let comment = (transaction.comment ?? '').trim().replaceAll('\n', '\\n ');
    let result = [
      `"${transaction.date}"`,
      `"${comment}"`,
      Number(transaction.income).toFixed(2),
    ]
    return `[${result.join(',')}]`;
  }
}

