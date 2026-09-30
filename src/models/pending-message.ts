export interface PendingMessage {
    content: string;
    date: Date;
    transactionId: string;
    failed: boolean;
};