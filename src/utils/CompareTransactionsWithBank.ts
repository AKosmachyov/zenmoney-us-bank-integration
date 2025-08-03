import { convertQifToZenmoney, convertBankTransaction, convertAccountToUpdate } from './converter.ts';
import { parseFile } from './qif2json.ts';
import type Zenmoney from '../Zenmoney.ts';
import { logger, debugStringForBankTransaction, debugStringForTransaction } from './Logger.ts';
import { type BankTransaction } from './typing.ts';
import readline from 'readline';
import { compareForBank } from './comparing.ts';

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

		bankTransactions.sort((a, b) => {
			return +new Date(b.date) - +new Date(a.date);
		});
		let startDate = bankTransactions[bankTransactions.length - 1].date;

		let zenTransactions = zen.getTransactions({
			startDate: new Date(startDate),
			bankAccountId: accountId,
		});

		const { missingInZenmoney, extraInZenmoney } = compareForBank(zenTransactions, bankTransactions, accountId);

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
