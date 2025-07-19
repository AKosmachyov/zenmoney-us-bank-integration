import fs from 'fs';

function parseDate(str: string, format: string) {
	var array = str.replace(' ', '').split(/[^0-9]/);
	if (format === 'us') {
		array = [array[1], array[0], array[2]];
	}
	const [day, month, year] = array;

	const output: {
		year: number;
		month: string;
		day: string;
	} = { year: 0, month: '00', day: '00' };
	const yearNow = new Date().getFullYear();
	const yearInt = parseInt(year, 10);
	const year1900 = 1900 + yearInt;
	const year2000 = 2000 + yearInt;

	output.day = day.length < 2 ? `0${day}` : day;
	output.month = month.length < 2 ? `0${month}` : month;
	output.year = yearInt;

	if (year.length <= 2) {
		output.year = year2000 > yearNow ? year1900 : year2000;
	}

	return `${output.year}-${output.month}-${output.day}`;
}

export interface QifOptions {
	dateFormat?: string;
	ignoreType?: boolean;
}

export interface Qif {
	transactions: QIFTransaction[];
	type: string;
}

export interface Division {
	amount: number;
	category: string;
	description: string;
	subcategory: string;
}

export interface QIFTransaction {
	date: string;
	amount: number;
	number: string;
	memo: string;
	address: string[];
	payee: string;
	category: string;
	subcategory: string;
	clearedStatus: string;
	division: Division[];
	[key: string]: any;
}

export const parseQIF = (qif: string, options: QifOptions = {}): Qif => {
	const lines = qif.split('\n');
	let line = lines.shift();
	let transaction: QIFTransaction = <QIFTransaction>{};
	let division: Division = <Division>{};
	const typeArray = /!Type:([^$]*)$/.exec(line!.trim()) || [];

	if (!typeArray || !typeArray.length) {
		if (!options.ignoreType) {
			throw new Error('File does not appear to be a valid qif file: ' + line);
		}
		typeArray[1] = line!.trim();
	}

	const type = typeArray[1];
	const transactions: QIFTransaction[] = [];

	while (line = lines.shift()) {
		line = line.trim();
		if (line === '^') {
			transactions.push(transaction);
			transaction = <QIFTransaction>{};
			continue;
		}
		switch (line[0]) {
			case '!':
				if (line.indexOf('!Type:') !== -1) {
					// paypal include type for each transaction
					break;
				} else {
					throw new Error('Unknown Detail Code: ' + line[0] + ' in ' + line);
				}
			case 'D':
				transaction.date = parseDate(line.substring(1), options.dateFormat || '');
				break;
			case 'T':
				transaction.amount = parseFloat(line.substring(1).replace(',', ''));
				break;
			case 'N':
				transaction.number = line.substring(1);
				break;
			case 'M':
				transaction.memo = line.substring(1);
				break;
			case 'A':
				transaction.address = (transaction.address || []).concat(line.substring(1));
				break;
			case 'P':
				transaction.payee = line.substring(1).replace(/&amp;/g, '&');
				break;
			case 'L':
				const lArray = line.substring(1).split(':');
				transaction.category = lArray[0];
				if (lArray[1] !== undefined) {
					transaction.subcategory = lArray[1];
				}
				break;
			case 'C':
				transaction.clearedStatus = line.substring(1);
				break;
			case 'S':
				const sArray = line.substring(1).split(':');
				division.category = sArray[0];
				if (sArray[1] !== undefined) {
					division.subcategory = sArray[1];
				}
				break;
			case 'E':
				division.description = line.substring(1);
				break;
			case '$':
				division.amount = parseFloat(line.substring(1));
				if (!(transaction.division instanceof Array)) {
					transaction.division = [];
				}
				transaction.division.push(division);
				division = <Division>{};

				break;

			default:
				throw new Error('Unknown Detail Code: ' + line[0] + ' in ' + line);
		}
	}

	// Remove the last transaction if it is empty (i.e., has no keys)
	if (transactions.length > 0 && Object.keys(transactions[transactions.length - 1]).length === 0) {
		transactions.pop();
	}

	if (Object.keys(transaction).length) {
		transactions.push(transaction);
	}

	return <Qif>{
		transactions,
		type
	};
};

export const parseFile = function parseFile(qifFile: string, options: QifOptions): Promise<Qif> {
	return fs.promises.readFile(qifFile, 'utf8').then((qifData: string) => {
		return parseQIF(qifData, options);
	});
};
