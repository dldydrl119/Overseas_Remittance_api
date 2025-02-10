export class QuoteResponseDto {
    quoteId: string;
    exchangeRate: number;
    expireTime: string; // YYYY-MM-DD HH:mm:ss 형식
    targetAmount: number;
  }
  