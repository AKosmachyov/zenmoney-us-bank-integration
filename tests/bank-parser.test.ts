import { it, describe } from 'node:test';
import assert from 'node:assert/strict';

import { parseFile } from '../src/utils/qif2json.ts';
import { convertQifToZenmoney } from '../src/utils/converter.ts';
import { parseCSVToBankTx } from '../src/utils/csvParser.ts';

describe('Bank file parser', () => {
	it('parse BofA file', async () => {
		let filePath = './tests/data/bofa.qif';
		let result = await parseFile(filePath, { dateFormat: 'us' });
		let bankTransactions = convertQifToZenmoney(result);
		const valid = [
			{
				date: '2025-08-01',
				amount: 10.7,
				comment: 'AMAZON MKTPLACE PMTS Amzn.com/billWA'
			},
			{ date: '2025-07-15', amount: -1, comment: 'AT&T' },
			{ date: '2025-07-15', amount: -1, comment: 'AT&T *PAYMENT' }
		];

		assert.deepStrictEqual(bankTransactions, valid);
	});

	it('parse PayPal format ', async () => {
		let filePath = './tests/data/paypal.qif';
		let result = await parseFile(filePath, { dateFormat: 'us' });
		let bankTransactions = convertQifToZenmoney(result);
		const valid = [
			{ date: '2025-06-01', amount: -250, comment: 'William, Website Payment' },
			{ date: '2025-07-05', amount: 100, comment: 'William, Mobile Payment' }
		];
		assert.deepStrictEqual(bankTransactions, valid);
	});

	it('parse Amex format ', async () => {
		let filePath = './tests/data/amex.csv';
		let bankTransactions = await parseCSVToBankTx(filePath, true);
		const valid = [
			{ date: '2025-07-05', comment: 'AplPay AT&T', amount: -5 },
			{
				date: '2025-07-05',
				comment: 'AUTOPAY PAYMENT - THANK YOU',
				amount: 10.01
			}
		];
		assert.deepStrictEqual(bankTransactions, valid);
	});

	it('parse SoFi format ', async () => {
		let filePath = './tests/data/sofi.csv';
		let bankTransactions = await parseCSVToBankTx(filePath);
		const valid = [
			{ date: '2025-08-02', comment: 'FID BKG', amount: -1000 },
			{
				date: '2025-08-01',
				comment: 'BANK OF AMERICA, N.A.',
				amount: -100
			},
			{ date: '2025-07-30', comment: 'Interest earned', amount: 0.37 }
		];
		assert.deepStrictEqual(bankTransactions, valid);
	});
});
