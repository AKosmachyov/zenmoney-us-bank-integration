const Zenmoney = require('./Zenmoney');
const Logger = require('./utils/Logger');

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
        Logger.log('Start Login');
        await zenmoney.login();
        Logger.log('Login successful');
    }
    Logger.log('Downloading data from Zenmoney');
    await zenmoney.syncDiff();
    Logger.log('Data downloaded successfully');
}

main();
