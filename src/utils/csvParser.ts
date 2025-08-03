import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type { BankTransaction } from './typing.ts';
import { toIsoDateString } from './date.ts';

export async function parseCSVToBankTx(filePath: string): Promise<BankTransaction[]> {
	const inStream = createReadStream(filePath);
	const rl = createInterface({ input: inStream, crlfDelay: Infinity });

	const results: BankTransaction[] = [];
	let idxDate: number, idxDesc: number, idxAmt: number;
	let first = true;

	for await (const line of rl) {
		const cols = line.split(',').map(c => c.trim());
		if (first) {
			first = false;
			let lowerCols = cols.map(c => c.toLowerCase());
			idxDate = lowerCols.indexOf('date');
			idxDesc = lowerCols.indexOf('description');
			idxAmt = lowerCols.indexOf('amount');
			const missing = [];
			if (idxDate < 0) missing.push('Date');
			if (idxAmt < 0) missing.push('Amount');
			if (missing.length) {
				throw new Error(`Missing required column(s): ${missing.join(', ')}`);
			}
			continue;
		}
		const localDate = cols[idxDate];
		const date = toIsoDateString(localDate);
		const comment = typeof idxDesc === 'number' ? cols[idxDesc] : '';
		let amount = parseFloat(cols[idxAmt]);
		if (Number.isNaN(amount)) {
			throw new Error(`Invalid amount on line: "${line}"`);
		}
		amount = amount * -1; // invert sign for Amex
		results.push({ date, comment, amount });
	}

	return results;
}
