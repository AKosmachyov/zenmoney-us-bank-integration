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
    hold: null,
    user: number,
    longitude: null,
    incomeBankID: null,
    incomeInstrument: number,
    outcomeInstrument: number,
    viewed: boolean,
    payee: string | null,
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
    payee: null | string,
    originalPayee: null,
    opOutcomeInstrument: null,
}

type AccountType = "ccard" | "cash" | "checking" | "deposit" | "debt";
type BalanceCorrectionType = "request";
type EndDateOffsetInterval = "year" | "day" | "month" | null;
type PayoffInterval = "month" | null;
export type Account = {
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

export type AccountUpdateType = {
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

export type DiffUpdateData = {
    transactions: TransactionUpdateType[],
    accounts: AccountUpdateType[],
}

export type StorageFilter = {
    startDate?: Date,
    endDate?: Date,
    merchant?: string,
    bankAccountId?: string,
    payee?: string,
}

export type AccountFilter = {
    title?: string,
}

export type UserModel = {
    access_token: string,
    token_type: string,
    expires_in: number,
    refresh_token: string,
    serverTimestamp: number
}

export type Merchant = {
    id: string,
    user: number,
    title: string,
}
