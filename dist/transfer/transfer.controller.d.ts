import { TransferService } from './transfer.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
export declare class TransferController {
    private readonly transferService;
    constructor(transferService: TransferService);
    createQuote(body: CreateQuoteDto, req: any): Promise<{
        resultCode: number;
        resultMsg: string;
        quote: QuoteResponseDto;
    }>;
    requestTransfer(body: {
        quoteId: string;
    }, req: any): Promise<{
        resultCode: number;
        resultMsg: string;
    }>;
    getUserTransfers(req: any): Promise<{
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
}
