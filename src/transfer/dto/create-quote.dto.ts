// src/transfer/dto/create-quote.dto.ts
import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateQuoteDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  targetCurrency: string;
}
