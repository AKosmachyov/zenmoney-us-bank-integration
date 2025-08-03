import { it, describe } from 'node:test';
import assert from 'node:assert/strict';

import { compareForBank } from '../src/utils/comparing.ts';
import { createBankTransactionStub, createZenTransactionStub, createZenTransferOrDebtStub } from './utils.ts';

describe('Comparing Bank transactions', () => {
	it('Same transactions', () => {
		let accountId = 'account_1';
		let debtAccount = 'account_2';
		let bankTransactions = [
			createBankTransactionStub('2025-08-01', 10.7, 'Income'),
			createBankTransactionStub('2025-07-20', -5.4, 'Expense'),
			createBankTransactionStub('2025-08-01', -15, 'Lent money'),
			createBankTransactionStub('2025-08-01', 15, 'Borrow money'),
		];

		let zenTransactions = [
			createZenTransactionStub('1', '2025-08-01', 10.7, accountId, 'Income'),
			createZenTransactionStub('2', '2025-07-20', -5.4, accountId, 'Expense'),
			createZenTransferOrDebtStub('3', '2025-08-01', 15, accountId, debtAccount, 'Lent money'),
			createZenTransferOrDebtStub('4', '2025-08-01', 15, debtAccount, accountId, 'Borrow money'),
		]

		let result = compareForBank(zenTransactions, bankTransactions, accountId);

		assert.deepEqual(result.missingInZenmoney, []);
		assert.deepEqual(result.extraInZenmoney, []);
	});

	it('The same with the same amount at single day', () => {
		let accountId = 'account_1';
		let debtAccount = 'account_2';
		let bankTransactions = [
			createBankTransactionStub('2025-08-01', 10.7, 'Income'),
			createBankTransactionStub('2025-08-01', 10.7, 'Income 2'),
			createBankTransactionStub('2025-08-01', -15, 'Lent money'),
			createBankTransactionStub('2025-08-01', -15, 'Lent money 2'),
		];

		let zenTransactions = [
			createZenTransactionStub('1', '2025-08-01', 10.7, accountId, 'Income'),
			createZenTransactionStub('2', '2025-08-01', 10.7, accountId, 'Income 2'),
			createZenTransferOrDebtStub('3', '2025-08-01', 15, accountId, debtAccount, 'Lent money'),
			createZenTransferOrDebtStub('4', '2025-08-01', 15, accountId, debtAccount, 'Lent money 2'),
		]

		let result = compareForBank(zenTransactions, bankTransactions, accountId);

		assert.deepEqual(result.missingInZenmoney, []);
		assert.deepEqual(result.extraInZenmoney, []);
	});

	it('Missed and extra transactions', () => {
		let accountId = 'account_1';
		let debtAccount = 'account_2';
		let bankTransactions = [
			createBankTransactionStub('2025-08-01', 10.7, 'Income'),
			createBankTransactionStub('2025-07-20', -5.4, 'Expense'),
			createBankTransactionStub('2025-08-01', -15, 'Lent money'),
			createBankTransactionStub('2025-08-01', 15, 'Borrow money'),
			createBankTransactionStub('2025-08-03', 12.1, 'Missed in Zenmoney'),
		];

		let zenTransactions = [
			createZenTransactionStub('1', '2025-08-01', 10.7, accountId, 'Income'),
			createZenTransactionStub('2', '2025-07-20', -5.4, accountId, 'Expense'),
			createZenTransferOrDebtStub('3', '2025-08-01', 15, accountId, debtAccount, 'Lent money'),
			createZenTransferOrDebtStub('4', '2025-08-01', 15, debtAccount, accountId, 'Borrow money'),
			createZenTransactionStub('5', '2025-08-10', -5.4, accountId, 'Extra in Zenmoney'),
			createZenTransactionStub('6', '2025-06-05', -6, accountId, 'Extra in Zenmoney'),
		]

		let result = compareForBank(zenTransactions, bankTransactions, accountId);

		assert.deepEqual(result.missingInZenmoney, bankTransactions.slice(4, 5));
		assert.deepEqual(result.extraInZenmoney, zenTransactions.slice(4, 6));
	});

	it('The different day', () => {
		let accountId = 'account_1';
		let debtAccount = 'account_2';
		let bankTransactions = [
			createBankTransactionStub('2025-08-02', 10.7, 'Income, in Zenmoney 2025-07-31'),
			createBankTransactionStub('2025-08-01', -15, 'Lent money, in Zenmoney 2025-08-02'),
			createBankTransactionStub('2025-08-03', 15, 'Borrow money, in Zenmoney 2025-08-01'),
		];

		let zenTransactions = [
			createZenTransactionStub('1', '2025-07-31', 10.7, accountId, 'Income'),
			createZenTransferOrDebtStub('3', '2025-08-02', 15, accountId, debtAccount, 'Lent money'),
			createZenTransferOrDebtStub('4', '2025-08-01', 15, debtAccount, accountId, 'Borrow money'),
		]

		let result = compareForBank(zenTransactions, bankTransactions, accountId);

		assert.deepEqual(result.missingInZenmoney, []);
		assert.deepEqual(result.extraInZenmoney, []);
	});

	it('The different day, but the same amount', () => {
		let accountId = 'account_1';
		let debtAccount = 'account_2';
		let bankTransactions = [
			createBankTransactionStub('2025-07-31', 10.7, 'Income Return'),
			createBankTransactionStub('2025-08-10', -15, 'Lent money'),
		];

		let zenTransactions = [
			createZenTransactionStub('1', '2025-07-31', 10.7, accountId, 'Income Return'),
			createZenTransactionStub('2', '2025-08-01', 10.7, accountId, 'Income Tips'),
			createZenTransferOrDebtStub('3', '2025-08-09', 15, accountId, debtAccount, 'Lent money for a friend'),
			createZenTransferOrDebtStub('4', '2025-08-10', 15, accountId, debtAccount, 'Lent money for a neighbor'),
		]

		let result = compareForBank(zenTransactions, bankTransactions, accountId);

		assert.deepEqual(result.missingInZenmoney, []);
		assert.deepEqual(
			result.extraInZenmoney,
			[
				zenTransactions[1],
				zenTransactions[2],
			]
		);
	});
})
