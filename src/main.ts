import Zenmoney from './Zenmoney.ts';
import inquirer from 'inquirer';
import fs from 'fs';
import { logger } from './utils/Logger.ts';
import { CompareTransactionsWithBank } from './utils/CompareTransactionsWithBank.ts';

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

        await new CompareTransactionsWithBank().compare(
            this.zenmoney,
            '<account_id>',
            filePath
        );

        // 3. Extract unique account titles
        // const uniqueTitles = Array.from(
        //     new Set(
        //         transactions
        //             .map(tx => tx.accountTitle)
        //             .filter(t => typeof t === 'string' && t.trim())
        //     )
        // );

        // 4. Prompt to select or add
        // const { choice } = await inquirer.prompt([{
        //     type: 'list',
        //     name: 'choice',
        //     message: 'Select an account title or add a new one:',
        //     choices: [
        //         ...uniqueTitles,
        //         new inquirer.Separator(),
        //         'Add a new account title'
        //     ]
        // }]);

        // // 5. If “add new”, ask for input
        // let accountTitle = choice;
        // if (choice === 'Add a new account title') {
        //     const { newTitle } = await inquirer.prompt([{
        //         type: 'input',
        //         name: 'newTitle',
        //         message: 'Enter the new account title:',
        //         validate(input) {
        //             return input.trim()
        //                 ? true
        //                 : 'Account title cannot be empty.';
        //         }
        //     }]);
        //     accountTitle = newTitle.trim();
        // }

        // console.log('✅ Selected account title:', accountTitle);
        // …proceed with accountTitle…
    }
}

let main = new Main()
main
    .setup()
    .then(() => {
        main.syncFromFile();
    })
    .catch(err => {
        logger.error('Fatal error:', err);
        process.exit(1);
    });
