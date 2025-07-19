import Zenmoney from './Zenmoney.js';
import { type Zenmoney as ZenmoneyType } from './utils/typing.ts';
import { logger } from './utils/Logger.ts';
import { CompareTwoUserAccounts } from './utils/CompareTwoUserAccounts.ts';
import { CompareTransactionsWithBank } from './utils/CompareTransactionsWithBank.ts';

async function main() {
    const username = process.env.ZEN_USER;
    const password = process.env.ZEN_PWD;

    if (!username || !password) {
        throw new Error('Username and password are required');
    }

    // new Storage(username).sortSavedTransactions();
    // return;

    const zenmoney: ZenmoneyType = new Zenmoney(username, password);
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


    // let right = new Zenmoney('', '')
    // let compare = new CompareTwoUserAccounts(zenmoney, right);
    // compare.compare(
    //     new Date('2025-06-01'),
    //     'merchant-id for left',
    //     'merchant-id-for right'
    // );
}

main();
