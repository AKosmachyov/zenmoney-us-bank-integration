import { type BankTransaction, type Transaction } from '../src/utils/typing.ts';
import { randomUUID } from 'crypto';

export function createZenTransactionStub(
	id: string,
	date: string,
	amount: number,
	accountId: string,
	comment: string = ''
): Transaction {
	let created = Math.round(new Date().getTime() / 1000);
	let offset = Math.floor(Math.random() * (14 - 5 + 1)) + 5;
	let tagID = randomUUID();
	let isIncome = amount > 0;
	let transactionAmount = Math.abs(amount);
	return {
		"id": id,
		"user": 1,
		"date": date,
		"income": isIncome ? transactionAmount : 0,
		"outcome": isIncome ? 0 : transactionAmount,
		"changed": created + offset,
		"incomeInstrument": 1,
		"outcomeInstrument": 1,
		"created": created,
		"originalPayee": null,
		"deleted": false,
		"viewed": true,
		"hold": null,
		"qrCode": null,
		"source": null,
		"incomeAccount": accountId,
		"outcomeAccount": accountId,
		"tag": [tagID],
		"comment": comment,
		"payee": null,
		"opIncome": null,
		"opOutcome": null,
		"opIncomeInstrument": null,
		"opOutcomeInstrument": null,
		"latitude": null,
		"longitude": null,
		"merchant": null,
		"incomeBankID": null,
		"outcomeBankID": null,
		"reminderMarker": null
	}
}

export function createZenTransferOrDebtStub(
	id: string,
	date: string,
	amount: number,
	outcomeAccountId: string,
	incomeAccountId: string,
	comment: string = ''
): Transaction {
	let created = Math.round(new Date().getTime() / 1000);
	let offset = Math.floor(Math.random() * (14 - 5 + 1)) + 5;
	let transactionAmount = Math.abs(amount);
	return {
		"id": id,
		"user": 1,
		"date": date,
		"income": transactionAmount,
		"outcome": transactionAmount,
		"changed": created + offset,
		"incomeInstrument": 1,
		"outcomeInstrument": 1,
		"created": created,
		"originalPayee": null,
		"deleted": false,
		"viewed": true,
		"hold": null,
		"qrCode": null,
		"source": null,
		"incomeAccount": incomeAccountId,
		"outcomeAccount": outcomeAccountId,
		"tag": null,
		"comment": comment,
		"payee": null,
		"opIncome": null,
		"opOutcome": null,
		"opIncomeInstrument": null,
		"opOutcomeInstrument": null,
		"latitude": null,
		"longitude": null,
		"merchant": null,
		"incomeBankID": null,
		"outcomeBankID": null,
		"reminderMarker": null
	}
}

export function createBankTransactionStub(
	date: string,
	amount: number,
	comment: string = ''
): BankTransaction {
	return {
		date,
		amount,
		comment
	}
}
