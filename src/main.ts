import Zenmoney from './Zenmoney.ts';
import { logger } from './utils/Logger.ts';
import { CompareTwoUserAccounts } from './utils/CompareTwoUserAccounts.ts';
import { CompareTransactionsWithBank } from './utils/CompareTransactionsWithBank.ts';
import { createDateWithoutTimeZone } from './utils/date.ts';

async function main() {
    const username = process.env.ZEN_USER;
    const password = process.env.ZEN_PWD;

    if (!username || !password) {
        throw new Error('Username and password are required');
    }

    // new Storage(username).sortSavedTransactions();
    // return;

    const zenmoney = new Zenmoney(username, password);
    if (!zenmoney.canSkipLogin()) {
        logger.log('Start Login');
        await zenmoney.login();
        logger.log('Login successful');
    }
    logger.log('Downloading data from Zenmoney');
    await zenmoney.syncDiff();
    logger.log('Data downloaded successfully');

    await new CompareTransactionsWithBank().compare(
        zenmoney,
        'account-id',
        './bofa.qif'
    );


    // let right = new Zenmoney('user_2', 'pwd_2')
    // await right.syncDiff();
    // let compare = new CompareTwoUserAccounts(zenmoney, right);
    compare.compare(
        createDateWithoutTimeZone('2025-06-01'),
        createDateWithoutTimeZone('2025-06-02'),
        'merchant title for left',
        'merchant title for right',
        'account id for expenses'
    );
}

main();
