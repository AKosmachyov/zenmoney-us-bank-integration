import Zenmoney from './Zenmoney.ts';
import inquirer from 'inquirer';
import fs from 'fs';
import { logger } from './utils/Logger.ts';
import { CompareTransactionsWithBank } from './utils/CompareTransactionsWithBank.ts';
import { CompareTwoUserAccounts } from './utils/CompareTwoUserAccounts.ts';

class Main {
    private zenmoney: Zenmoney;

    constructor() {
        const username = process.env.ZEN_USER;
        const password = process.env.ZEN_PWD;

        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        this.zenmoney = new Zenmoney(username, password);
    }

    async setup() {
        if (!this.zenmoney.canSkipLogin()) {
            await this.login();
        }
        await this.syncChanges();
        await this.showMenu();
    }

    async login() {
        logger.log('Start Login');
        await this.zenmoney.login();
        logger.log('Login successful');
    }

    async syncChanges() {
        logger.log('Downloading data from Zenmoney');
        await this.zenmoney.syncDiff();
        logger.log('Data downloaded successfully');
    }

    async syncFromFile() {
        let { filePath } = await inquirer.prompt([{
            type: 'input',
            name: 'filePath',
            message: 'Drag and drop the file with bank transactions:',
            validate(input) {
                let path = input.trim();
                let errorMessage = 'Please enter a valid file path.';

                if (!path) {
                    return errorMessage;
                }

                if (path.startsWith('\'') || path.startsWith('\"')) {
                    path = path.slice(1, -1);
                }

                if (path.endsWith('\'') || path.endsWith('\"')) {
                    path = path.slice(0, -1);
                }

                return fs.existsSync(path)
                    ? true
                    : errorMessage;
            }
        }]);

        if (filePath.startsWith('\'') || filePath.startsWith('\"')) {
            filePath = filePath.slice(1, -1);
        }

        if (filePath.endsWith('\'') || filePath.endsWith('\"')) {
            filePath = filePath.slice(0, -1);
        }

        let accounts = await this.zenmoney.getAccounts();

        const { choice } = await inquirer.prompt([{
            type: 'list',
            name: 'choice',
            message: 'Select an account:',
            choices: accounts.map(account => account.title),
            pageSize: 10,
        }]);

        let account = accounts.find(account => account.title === choice);

        if (!account) {
            logger.error('Account not found');
            return;
        }

        await new CompareTransactionsWithBank().compare(
            this.zenmoney,
            account.id,
            filePath
        );
    }

    async syncWithAnotherUser() {
        const compare = new CompareTwoUserAccounts(this.zenmoney);
        await compare.setup();
    }

    async showMenu() {
        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: [
                    { name: 'Import transactions from a bank file', value: 'syncFromFile' },
                    { name: 'Compare and sync with another user', value: 'syncWithAnotherUser' },
                    { name: 'Exit', value: 'exit' },
                ]
            }
        ]);

        switch (action) {
            case 'syncFromFile':
                await this.syncFromFile();
                await this.showMenu();
                break;
            case 'syncWithAnotherUser':
                await this.syncWithAnotherUser();
                await this.showMenu();
                break;
            default:
                logger.log('Goodbye!');
                process.exit(0);
        }
    }
}

let main = new Main()
main
    .setup()
    .catch(err => {
        logger.error('Fatal error:', err);
        process.exit(1);
    });
