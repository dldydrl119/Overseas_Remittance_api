import { Controller, Get,Post, Body, UseGuards, Request, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TransferService } from './transfer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto'; // ✅ 추가
import { QuoteResponseDto } from './dto/quote-response.dto'; // ✅ 새로운 DTO import


@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('quote')
  @UseGuards(JwtAuthGuard)
  async createQuote(@Body() body: CreateQuoteDto, @Request() req): Promise<{ resultCode: number; resultMsg: string; quote: QuoteResponseDto }> {
    try {
      console.log('🔍 [TransferController] Incoming Request User:', req.user);
      if (!body.amount || !body.targetCurrency) {
        throw new BadRequestException('송금 금액과 대상 통화는 필수 입력값입니다.');
      }
      return await this.transferService.generateQuote(body.amount, body.targetCurrency, req.user);
    } catch (error) {
      console.error('🚨 [TransferController] Error:', error.message);

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('인증에 실패했습니다. 다시 로그인해 주세요.');
      }

      throw new BadRequestException(`오류 발생: ${error.message}`);
    }
  }

  @Post('request')
  @UseGuards(JwtAuthGuard) // ✅ 인증 적용 추가
  async requestTransfer(@Body() body: { quoteId: string }, @Request() req) {
    try {
      if (!req.user) throw new UnauthorizedException('인증되지 않은 사용자입니다.');

      return await this.transferService.requestTransfer(body.quoteId, req.user);
    } catch (error) {
      console.error('🚨 [TransferController] Error:', error.message);

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException('인증되지 않은 사용자입니다.');
      }
      
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }

      throw new InternalServerErrorException('알 수 없는 오류가 발생했습니다. (UNKNOWN_ERROR)');
    }
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getUserTransfers(@Request() req) {
    return this.transferService.getUserTransfers(req.user.id);
  }
}
