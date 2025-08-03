import { convertQifToZenmoney, convertBankTransaction, convertAccountToUpdate } from './converter.ts';
import { parseFile } from './qif2json.ts';
import type Zenmoney from '../Zenmoney.ts';
import { logger, debugStringForBankTransaction, debugStringForTransaction } from './Logger.ts';
import { type BankTransaction, type Transaction } from './typing.ts';
import readline from 'readline';

export class CompareTransactionsWithBank {
	async compare(zen: Zenmoney, accountId: string, filePath: string) {

		let account = zen.getAccount(accountId);

		if (!account) {
			throw new Error('Account not found');
		}

		let bankTransactions = await this.loadTransactions(filePath);

		if (bankTransactions.length === 0) {
			throw new Error('No bank transactions found');
		}

		let startDate = bankTransactions[bankTransactions.length - 1].date;

		let zenTransactions = zen.getTransactions({
			startDate: new Date(startDate),
			bankAccountId: accountId,
		});

		// Build a map for Zenmoney transactions
		const zenTxMap = new Map<string, Transaction[]>();
		for (const tx of zenTransactions) {
			// for outcome and income transactions
			let amount = tx.income - tx.outcome;

			if (tx.incomeAccount != tx.outcomeAccount) {
				// for transfer and debts,
				amount = tx.incomeAccount == accountId ? tx.income : -tx.outcome;
			}

			const key = `${tx.date}|${amount}`.trim();
			const existing = zenTxMap.get(key);
			if (existing) {
				existing.push(tx);
			} else {
				zenTxMap.set(key, [tx]);
			}
		}

		// Build a map for bank transactions
		const bankTxMap = new Map<string, BankTransaction[]>();
		for (const bankTx of bankTransactions) {
			const key = `${bankTx.date}|${bankTx.amount}`.trim();
			const existing = bankTxMap.get(key);
			if (existing) {
				existing.push(bankTx);
			} else {
				bankTxMap.set(key, [bankTx]);
			}
		}

		// Find transactions present in bank but missing in Zenmoney (missing in Zenmoney)
		const missingInZenmoney: BankTransaction[] = [];
		for (const [key, bankTx] of bankTxMap.entries()) {
			const zenTx = zenTxMap.get(key) ?? [];
			if (bankTx.length > zenTx.length) {
				let missing = bankTx.slice(zenTx.length)
				missingInZenmoney.push(...missing);
			}
		}

		// Find transactions present in Zenmoney but not in bank (extra in Zenmoney)
		const extraInZenmoney: Transaction[] = [];
		for (const [key, zenTx] of zenTxMap.entries()) {
			let bankTx = bankTxMap.get(key) ?? [];
			if (zenTx.length > bankTx.length) {
				let extra = zenTx.slice(bankTx.length)
				extraInZenmoney.push(...extra);
			}
		}

		if (missingInZenmoney.length) {
			logger.debug(
				'Missing in Zenmoney (should be imported):\n',
				missingInZenmoney.map(debugStringForBankTransaction)
					.join('\n')
			);
		}

		if (extraInZenmoney.length) {
			logger.debug(
				'Extra in Zenmoney (not in bank):\n',
				extraInZenmoney
					.map(el => debugStringForTransaction(el))
					.join('\n')
			);
		}

		if (missingInZenmoney.length === 0) {
			console.log('No missing transactions to add to Zenmoney.');
			return;
		}

		const shouldAddTransactions = await this.askUserToAddTransactions();
		if (!shouldAddTransactions) {
			return;
		}

		let transactions = missingInZenmoney.map(tx => convertBankTransaction(tx, account.user, [], account.id));

		await zen.syncDiff({
			transactions: transactions,
			accounts: convertAccountToUpdate([account]),
		});
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

	async loadTransactions(filePath: string): Promise<BankTransaction[]> {
		let ext = filePath.split('.').pop()?.toLowerCase();
		switch (ext) {
			case 'csv':
				const { parseCSVToBankTx } = await import('./csvParser.ts');
				return await parseCSVToBankTx(filePath);
			case 'qif':
				return await this.parseQifFile(filePath);
			default:
				throw new Error(`Unsupported file extension: ${ext}`);
		}
	}

	async parseQifFile(filePath: string): Promise<BankTransaction[]> {
		let result = await parseFile(filePath, { dateFormat: 'us' });
		let bankTransactions = convertQifToZenmoney(result);
		return bankTransactions;
	}
}
