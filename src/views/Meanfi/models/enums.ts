// In seconds
export enum PaymentRateType {
    PerMinute = 0,  // 60
    PerHour = 1,    // 3600
    PerDay = 2,     // 86400
    PerWeek = 3,    // 604800
    PerMonth = 4,   // 2629750
    PerYear = 5,    // 31557000
}

export enum TransactionStatus {
    Iddle = 0,
    WalletNotFound = 1,
    TransactionStart = 2,
    TransactionStarted = 3,
    TransactionStartFailure = 4,
    InitTransaction = 5,
    InitTransactionSuccess = 6,
    InitTransactionFailure = 7,
    SignTransaction = 8,
    SignTransactionSuccess = 9,
    SignTransactionFailure = 10,
    SendTransaction = 11,
    SendTransactionSuccess = 12,
    SendTransactionFailure = 13,
    ConfirmTransaction = 14,
    ConfirmTransactionSuccess = 15,
    ConfirmTransactionFailure = 16,
    TransactionFinished = 17,
    SendTransactionFailureByMinimumAmount = 18,
    CreateRecurringBuySchedule = 19,
    CreateRecurringBuyScheduleSuccess = 20,
    CreateRecurringBuyScheduleFailure = 21,
    FeatureTemporarilyDisabled = 50
}

export enum OperationType {
    Transfer = 0,
    // Stream options
    StreamCreate = 1,
    StreamAddFunds = 2,
    StreamWithdraw = 3,
    StreamClose = 4,
    StreamPause = 5,
    StreamResume = 6,
    StreamTransferBeneficiary = 7,
    // Treasury options
    TreasuryCreate = 10,
    TreasuryStreamCreate = 11,
    TreasuryAddFunds = 12,
    TreasuryWithdraw = 13,
    TreasuryClose = 14,
    TreasuryRefreshBalance = 15,
    // DDCA Options
    DdcaCreate = 20,
    DdcaAddFunds = 21,
    DdcaWithdraw = 22,
    DdcaClose = 23,
    // Multisig options
    CreateMultisig = 30,
    EditMultisig = 31,
    CreateMint = 32,
    MintTokens = 33,
    TransferTokens = 34,
    SetMintAuthority = 35,
    UpgradeProgram = 36,
    CreateVault = 37,
    UpgradeIDL = 38,
    SetMultisigAuthority = 39,
    SetVaultAuthority = 40,
    ApproveTransaction = 41,
    ExecuteTransaction = 42,
    DeleteVault = 43,
    // IDO
    IdoDeposit = 100,
    IdoWithdraw = 101,
    IdoClaim = 102,
    IdoLpClaim = 103,
    IdoCollectFunds = 104
}
