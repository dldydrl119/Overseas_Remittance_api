import { User } from '../users/user.entity';
export declare class Transfer {
    id: string;
    user: User;
    sourceAmount: number;
    fee: number;
    exchangeRate: number;
    targetCurrency: string;
    targetAmount: number;
    requestedDate: Date;
}
