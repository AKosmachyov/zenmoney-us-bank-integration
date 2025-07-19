import { convertQifToZenmoney } from './converter.ts';
import { parseFile } from './qif2json.ts';
import { type Zenmoney } from './typing.ts';
import { logger, debugStringForBankTransaction, debugStringForTransaction } from './Logger.ts';
import { type BankTransaction, type Transaction } from './typing.ts';

export class CompareTransactionsWithBank {
	async compare(zen: Zenmoney, accountId: string, filePath: string) {

		let account = zen.getAccount(accountId);

		if (!account) {
			throw new Error('Account not found');
		}

		let result = await parseFile(filePath, { dateFormat: 'us' });
		let bankTransactions = convertQifToZenmoney(result);

		if (bankTransactions.length === 0) {
			throw new Error('No bank transactions found');
		}

		let startDate = bankTransactions[bankTransactions.length - 1].date;

		let zenTransactions = zen.getTransactions({
			startDate: new Date(startDate),
			bankAccountId: accountId,
		});

		// Build a map for Zenmoney transactions
		const zenTxMap = new Map<string, Transaction>();
		for (const tx of zenTransactions) {
			let amount = tx.income - tx.outcome;
			const key = `${tx.date}|${amount}`.trim();
			zenTxMap.set(key, tx);
		}

		// Build a map for bank transactions
		const bankTxMap = new Map<string, BankTransaction>();
		for (const bankTx of bankTransactions) {
			const key = `${bankTx.date}|${bankTx.amount}`.trim();
			bankTxMap.set(key, bankTx);
		}

		// Find transactions present in bank but missing in Zenmoney (missing in Zenmoney)
		const missingInZenmoney = [];
		for (const [key, bankTx] of bankTxMap.entries()) {
			if (!zenTxMap.has(key)) {
				missingInZenmoney.push(bankTx);
			}
		}

		// Find transactions present in Zenmoney but not in bank (extra in Zenmoney)
		const extraInZenmoney = [];
		for (const [key, zenTx] of zenTxMap.entries()) {
			if (!bankTxMap.has(key)) {
				extraInZenmoney.push(zenTx);
			}
		}

		logger.debug('Missing in Zenmoney (should be imported):', missingInZenmoney.map(debugStringForBankTransaction).join('\n'));
		logger.debug('Extra in Zenmoney (not in bank):', extraInZenmoney.map(debugStringForTransaction).join('\n'));

		// let transactions = missingInZenmoney.map(tx => convertBankTransaction(tx, account.user, [], account.id));

		// await zen.syncDiff(
		// 	{
		// 		transactions: transactions,
		// 		accounts: convertAccountToUpdate([account]),
		// 	}
		// )
	}
}
