import { Repository } from 'typeorm';
import { Transfer } from './transfer.entity';
import { HttpService } from '@nestjs/axios';
import { User } from '../users/user.entity';
interface Quote {
    quoteId: string;
    exchangeRate: number;
    expireTime: string;
    targetAmount: number;
}
export declare class TransferService {
    private readonly httpService;
    private readonly transferRepository;
    private readonly userRepository;
    private quotes;
    getUserTransfers(userId: string): Promise<{
        resultCode: number;
        resultMsg: string;
        userId: string;
        name: string;
        todayTransferCount: number;
        todayTransferUsdAmount: number;
        history: {
            sourceAmount: number;
            fee: number;
            usdExchangeRate: number;
            usdAmount: number;
            targetCurrency: string;
            exchangeRate: number;
            targetAmount: number;
            requestedDate: string;
        }[];
    }>;
    constructor(httpService: HttpService, transferRepository: Repository<Transfer>, userRepository: Repository<User>);
    saveQuote(quote: Quote): void;
    getQuote(quoteId: string): Quote | undefined;
    requestTransfer(quoteId: string, user: any): Promise<{
        resultCode: number;
        resultMsg: string;
    }>;
    generateQuote(amount: number, targetCurrency: string, user: any): Promise<{
        resultCode: number;
        resultMsg: string;
        quote: Quote;
    }>;
    getExchangeRate(targetCurrency: string): Promise<number>;
    private calculateFee;
    private getFeePolicy;
}
export {};
