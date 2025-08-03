import { type Qif } from './qif2json.ts';
import { type BankTransaction, type TransactionUpdateType, type Account, type AccountUpdateType, type Merchant } from './typing.ts';
import { randomUUID } from 'crypto';

export function convertQifToZenmoney(qif: Qif): BankTransaction[] {
	return qif.transactions.map(transaction => {
		return {
			date: transaction.date,
			amount: transaction.amount,
			comment: transaction.payee,
		};
	});
}

export function convertAccountToUpdate(accounts: Account[]): AccountUpdateType[] {
	let update = accounts.map((account: Account) => {
		let update = JSON.parse(JSON.stringify(account, replacer));
		delete update.enableCorrection;
		return update as AccountUpdateType;
	});
	return update;
}

export function convertBankTransaction(
	transaction: BankTransaction,
	user: number,
	tags: string[] = [],
	bankAccountId: string,
	isViewed: boolean = false,
	dateOffset?: number
): TransactionUpdateType {
	let created = Math.round(new Date().getTime() / 1000);
	let offset = dateOffset ?? Math.floor(Math.random() * (14 - 5 + 1)) + 5; // to mimic mobile app [5, 14]
	let id = randomUUID();
	let isIncome = transaction.amount > 0;
	let amount = Math.abs(transaction.amount);
	return {
		"opIncome": null,
		"created": created,
		"source": null,
		"outcome": isIncome ? 0 : amount,
		"changed": created + offset,
		"outcomeBankID": null,
		"opIncomeInstrument": null,
		"deleted": false,
		"reminderMarker": null,
		"latitude": null,
		"opOutcome": null,
		"qrCode": null,
		"mcc": null,
		"tag": tags,
		"incomeAccount": bankAccountId,
		"id": id,
		"hold": null,
		"date": transaction.date,
		"user": user,
		"longitude": null,
		"incomeBankID": null,
		"incomeInstrument": 1,
		"outcomeInstrument": 1,
		"outcomeAccount": bankAccountId,
		"viewed": isViewed ? 1 : 0,
		"payee": null,
		"income": isIncome ? amount : 0,
		"comment": transaction.comment || '',
		"originalPayee": null,
		"opOutcomeInstrument": null,
		"merchant": null
	}
}

export function createDebtTransaction(
	debtAccount: Account,
	account: Account,
	amount: number,
	date: string,
	comment: string,
	merchant: Merchant,
	isViewed: boolean = false,
	dateOffset?: number
): TransactionUpdateType {
	let created = Math.round(new Date().getTime() / 1000);
	let offset = dateOffset ?? Math.floor(Math.random() * (14 - 5 + 1)) + 5; // to mimic mobile app [5, 14]
	let id = randomUUID();
	let isIncome = amount > 0;
	let positiveAmount = Math.abs(amount);
	return {
		"opIncome": null,
		"created": created,
		"source": null,
		"outcome": positiveAmount,
		"changed": created + offset,
		"outcomeBankID": null,
		"opIncomeInstrument": null,
		"deleted": false,
		"reminderMarker": null,
		"latitude": null,
		"opOutcome": null,
		"qrCode": null,
		"mcc": null,
		"tag": null,
		"incomeAccount": isIncome ? account.id : debtAccount.id,
		"id": id,
		"hold": null,
		"date": date,
		"user": debtAccount.user,
		"longitude": null,
		"incomeBankID": null,
		"incomeInstrument": 1,
		"outcomeInstrument": 1,
		"outcomeAccount": isIncome ? debtAccount.id : account.id,
		"viewed": isViewed ? 1 : 0,
		"payee": merchant.title,
		"income": positiveAmount,
		"comment": comment || '',
		"originalPayee": null,
		"opOutcomeInstrument": null,
		"merchant": merchant.id
	}
}

function replacer(key: string, value: any) {
	if (typeof value === 'boolean') {
		return value ? 1 : 0;
	}
	return value;
}
