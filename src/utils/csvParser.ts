import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import type { BankTransaction } from './typing.ts';
import { toISODateString } from './date.ts';

export async function parseCSVToBankTx(filePath: string, invertSign: boolean = false): Promise<BankTransaction[]> {
	const inStream = createReadStream(filePath);
	const rl = createInterface({ input: inStream, crlfDelay: Infinity });

	const results: BankTransaction[] = [];
	let idxDate: number, idxDesc: number, idxAmt: number;
	let first = true;

	for await (const line of rl) {
		if (first) {
			const cols = line.split(',').map(c => c.trim());
			first = false;
			const findColIdx = (needle: string) => {
				return cols.findIndex(col => {
					return col.trim().toLowerCase().includes(needle);
				});
			};
			idxDate = findColIdx('date');
			idxDesc = findColIdx('description');
			idxAmt = findColIdx('amount');
			const missing = [];
			if (idxDate < 0) missing.push('Date');
			if (idxAmt < 0) missing.push('Amount');
			if (missing.length) {
				throw new Error(`Missing required column(s): ${missing.join(', ')}`);
			}
			continue;
		}
		// to support commas in description
		const cols = splitCSVLine(line);
		const localDate = cols[idxDate];
		const date = toISODateString(localDate);
		const comment = typeof idxDesc === 'number' ? cols[idxDesc] : '';
		let amount = parseFloat(cols[idxAmt]);
		if (Number.isNaN(amount)) {
			throw new Error(`Invalid amount on line: "${line}"`);
		}
		if (invertSign) {
			amount *= -1;
		}
		results.push({ date, comment, amount });
	}

	return results;
}

export function splitCSVLine(line: string): string[] {
	const result = [];
	let cur = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (char === '"' && line[i + 1] === '"') { // escaped quote
			cur += '"';
			i++;
		} else if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(cur.trim());
			cur = '';
		} else {
			cur += char;
		}
	}
	result.push(cur.trim());
	return result;
}
