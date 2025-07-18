import { type Transaction, type BankTransaction } from './typing.ts';

class Logger {
    debug(...data: any[]) {
        // if (process.env.DEBUG === 'true' || process.env.DEBUG === '1') {
        console.debug.apply(this, data);
        // }
    }
    log(...data: any[]) {
        console.info.apply(this, data);
    }

    error(...data: any[]) {
        console.error.apply(this, data);
    }

    warn(...data: any[]) {
        console.warn.apply(this, data);
    }
}

export const logger = new Logger();

export function debugStringForTransaction(transaction: Transaction): string {
    let amount = transaction.income > 0 ? transaction.income : -transaction.outcome;
    return `${transaction.date} ${amount} ${transaction.comment}`;
}

export function debugStringForBankTransaction(transaction: BankTransaction): string {
    return `${transaction.date} ${transaction.amount} ${transaction.comment}`;
}
