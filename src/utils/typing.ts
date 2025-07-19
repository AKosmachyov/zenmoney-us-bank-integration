export type Transaction = {
    id: string,
    date: string,
    income: number,
    outcome: number,
    incomeAccount: string,
    outcomeAccount: string,
    tag: string[] | null,
    comment: string | null,
    // Account for Debt
    merchant: string | null,

    opIncome: null,
    created: number,
    source: null,
    changed: number,
    outcomeBankID: null,
    opIncomeInstrument: null,
    deleted: boolean,
    reminderMarker: null,
    latitude: null,
    opOutcome: null,
    qrCode: null,
    mcc: null,
    hold: null,
    user: number,
    longitude: null,
    incomeBankID: null,
    incomeInstrument: number,
    outcomeInstrument: number,
    viewed: boolean,
    payee: null,
    originalPayee: null,
    opOutcomeInstrument: null,
}

export type TransactionUpdateType = {
    id: string,
    date: string,
    income: number,
    outcome: number,
    incomeAccount: string,
    outcomeAccount: string,
    tag: string[] | null,
    comment: string | null,
    // Account for Debt
    merchant: string | null,

    opIncome: null,
    created: number,
    source: null,
    changed: number,
    outcomeBankID: null,
    opIncomeInstrument: null,
    deleted: boolean,
    reminderMarker: null,
    latitude: null,
    opOutcome: null,
    qrCode: null,
    mcc: null,
    hold: null,
    user: number,
    longitude: null,
    incomeBankID: null,
    incomeInstrument: number,
    outcomeInstrument: number,
    viewed: number,
    payee: null,
    originalPayee: null,
    opOutcomeInstrument: null,
}

type AccountType = "ccard" | "cash" | "checking" | "deposit" | "debt";
type BalanceCorrectionType = "request";
type EndDateOffsetInterval = "year" | "day" | "month" | null;
type PayoffInterval = "month" | null;
interface Account {
    id: string;
    user: number;
    instrument: number;
    type: AccountType;
    role: null;
    private: boolean;
    savings: boolean;
    title: string;
    inBalance: boolean;
    creditLimit: number;
    startBalance: number;
    balance: number;
    company: number | null;
    archive: boolean;
    enableCorrection: boolean;
    balanceCorrectionType: BalanceCorrectionType;
    startDate: string | null;
    capitalization: boolean | null;
    percent: number | null;
    changed: number;
    syncID: string[] | null;
    enableSMS: boolean;
    endDateOffset: number | null;
    endDateOffsetInterval: EndDateOffsetInterval;
    payoffStep: number | null;
    payoffInterval: PayoffInterval;
}

interface AccountUpdateType {
    id: string;
    user: number;
    instrument: number;
    type: AccountType;
    role: null;
    private: number;
    savings: number;
    title: string;
    inBalance: number;
    creditLimit: number;
    startBalance: number;
    balance: number;
    company: number | null;
    archive: number;
    // should be excluded from update
    // enableCorrection: boolean;
    balanceCorrectionType: BalanceCorrectionType;
    startDate: string | null;
    capitalization: number | null;
    percent: number | null;
    changed: number;
    syncID: string[] | null;
    enableSMS: number;
    endDateOffset: number | null;
    endDateOffsetInterval: EndDateOffsetInterval;
    payoffStep: number | null;
    payoffInterval: PayoffInterval;
}

export type BankTransaction = {
    date: string,
    amount: number,
    comment: string,
}

export type Zenmoney = {
    canSkipLogin: () => boolean;
    login: () => Promise<void>;
    syncDiff: (updateData: DiffUpdateData) => Promise<void>;
    getAccount: (id: string) => Account;
    getTransactions: (filter: StorageFilter) => Transaction[];
}

export type DiffUpdateData = {
    transactions: TransactionUpdateType[],
    accounts: AccountUpdateType[],
}

export type StorageFilter = {
    startDate?: Date,
    merchant?: string,
    bankAccountId?: string,
}
