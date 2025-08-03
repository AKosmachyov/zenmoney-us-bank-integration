import { createDateWithoutTimeZone, daysDiff } from './date.ts';
import type { BankTransaction, Transaction } from './typing.ts';

export type BankComparisonResult = {
	missingInZenmoney: BankTransaction[];
	extraInZenmoney: Transaction[];
};

export function compareForBank(
	zenTransactions: Transaction[],
	bankTransactions: BankTransaction[],
	relativeToAccountId: string
): BankComparisonResult {
	const maxDaysDiff = 2;
	const zenByAmount = new Map<number, Transaction[]>();
	for (const tx of zenTransactions) {
		const amount = extractZenTransactionAmount(tx, relativeToAccountId);
		const arr = zenByAmount.get(amount) ?? [];
		arr.push(tx);
		zenByAmount.set(amount, arr);
	}

	// Prepare matched trackers
	const matchedZen = new Set<Transaction>();
	const matchedBank = new Set<BankTransaction>();
	const missingInZenmoney: BankTransaction[] = [];

	// Match bank → Zenmoney
	for (const bankTx of bankTransactions) {
		const candidates = zenByAmount.get(bankTx.amount) ?? [];
		const viable = candidates
			.filter(z => !matchedZen.has(z))
			.map(z => ({
				tx: z,
				diff: daysDiff(createDateWithoutTimeZone(z.date), createDateWithoutTimeZone(bankTx.date))
			}))
			.filter(o => o.diff <= maxDaysDiff)
			.sort((a, b) => a.diff - b.diff);

		if (viable.length > 0) {
			matchedZen.add(viable[0].tx);
			matchedBank.add(bankTx);
		} else {
			missingInZenmoney.push(bankTx);
		}
	}

	// Any Zenmoney tx not matched is extra
	const extraInZenmoney = zenTransactions.filter(z => !matchedZen.has(z));

	return { missingInZenmoney, extraInZenmoney };
}

export function extractZenTransactionAmount(tx: Transaction, relativeToAccountId: string): number {
	if (tx.incomeAccount != tx.outcomeAccount) {
		// for transfer and debts
		let amount = tx.incomeAccount === relativeToAccountId ? tx.income : -tx.outcome;
		return amount;
	}
	// for outcome and income transactions
	let amount = tx.income - tx.outcome;
	return amount;
}
