import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from './transfer.entity'; // ✅ 새로 만든 엔티티 추가
import { HttpService } from '@nestjs/axios';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../users/user.entity'; // ✅ User 엔티티 추가

interface Quote {
  quoteId: string;
  exchangeRate: number;
  expireTime: string;
  targetAmount: number;
}

@Injectable()
export class TransferService {
  private quotes: Map<string, Quote> = new Map(); // ✅ quoteId 저장용 캐시
  
  /** ✅ 1️⃣ 회원의 거래 내역 조회 (GET /transfer/list) */
  async getUserTransfers(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('사용자를 찾을 수 없습니다.');
  
    const transfers = await this.transferRepository.find({
      where: { user: { id: userId } },
      order: { requestedDate: 'DESC' },
    });
  
    const today = moment().startOf('day').toDate();
    const todayTransfers = transfers.filter(t => new Date(t.requestedDate) >= today);
  
    return {
      resultCode: 200,
      resultMsg: 'OK',
      userId: user.userId, // ✅ 추가됨
      name: user.name, // ✅ 추가됨
      todayTransferCount: todayTransfers.length, 
      todayTransferUsdAmount: todayTransfers.reduce((sum, t) => sum + t.targetAmount, 0),
      history: transfers.map(t => ({
        sourceAmount: t.sourceAmount,
        fee: t.fee,
        usdExchangeRate: t.exchangeRate, // ✅ usdExchangeRate 추가
        usdAmount: (t.sourceAmount - t.fee) / t.exchangeRate, // ✅ USD 변환 금액 추가
        targetCurrency: t.targetCurrency,
        exchangeRate: t.exchangeRate,
        targetAmount: t.targetAmount,
        requestedDate: t.requestedDate.toISOString(), // ✅ string 변환
      })),
    };
  }

  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(Transfer) // ✅ Transfer 엔티티의 Repository
    private readonly transferRepository: Repository<Transfer>,

    @InjectRepository(User) // ✅ User 엔티티의 Repository 추가
    private readonly userRepository: Repository<User>,
) {}

  /** ✅ 1️⃣ 견적서 저장 함수 (request 시 quoteId 조회 가능하도록) */
  saveQuote(quote: Quote) {
    this.quotes.set(quote.quoteId, quote);
    console.log(`✅ [TransferService] 저장된 견적서:`, this.quotes); // 🔥 로그 추가
  }

  /** ✅ 2️⃣ 견적서 조회 함수 */
  getQuote(quoteId: string): Quote | undefined {
    console.log(`🔍 [TransferService] 저장된 quoteId 목록:`, [...this.quotes.keys()]); // 🔥 추가 로그
    return this.quotes.get(quoteId);
  }

  /** ✅ 3️⃣ 송금 요청 처리 (견적서 유효성 검증 + DB 저장) */
  async requestTransfer(quoteId: string, user: any) {
    if (!user) throw new UnauthorizedException('인증되지 않은 사용자입니다.');

    const quote = this.getQuote(quoteId);
    if (!quote) throw new BadRequestException('존재하지 않는 견적서입니다.');

    // ✅ 견적서 만료 확인
    const now = moment();
    const expireTime = moment(quote.expireTime, 'YYYY-MM-DD HH:mm:ss');
    if (now.isAfter(expireTime)) {
        throw new BadRequestException('견적서가 만료되었습니다. (QUOTE_EXPIRED)');
    }

    // ✅ 사용자의 오늘 송금 금액 조회
    const userTransfers = await this.getUserTransfers(user.id);
    const todayTransferUsdAmount = userTransfers.todayTransferUsdAmount;

    // ✅ 하루 송금 한도 초과 체크 (기존 코드 보완)
    const dailyLimit = user.type === 'corporate' ? 5000 : 1000;
    if (todayTransferUsdAmount + quote.targetAmount > dailyLimit) {
        throw new ForbiddenException('송금 한도를 초과하였습니다. (LIMIT_EXCESS)');
    }

    // ✅ DB에 거래 내역 저장
    const transfer = this.transferRepository.create({
        user: user.id,
        sourceAmount: Math.floor(quote.targetAmount * quote.exchangeRate),  
        fee: Math.floor(this.calculateFee(quote.targetAmount, quote.exchangeRate)), 
        exchangeRate: quote.exchangeRate,
        targetCurrency: 'JPY',
        targetAmount: Math.floor(quote.targetAmount),  
    });

    try {
        await this.transferRepository.save(transfer); // ✅ DB 저장
        console.log(`✅ [TransferService] 송금 성공: ${quoteId}`);
    } catch (error) {
        console.error('🚨 [TransferService] Database Error:', error.message);
        throw new InternalServerErrorException('알 수 없는 오류가 발생했습니다. (UNKNOWN_ERROR)');
    }

    return {
        resultCode: 200,
        resultMsg: 'OK',
    };
  }

  /** ✅ 4️⃣ 송금 견적서 생성 (저장 기능 추가) */
  async generateQuote(amount: number, targetCurrency: string, user: any) {
    if (!user) throw new UnauthorizedException('인증되지 않은 사용자입니다.');
    if (!amount || amount <= 0) throw new BadRequestException('송금 금액은 0보다 커야 합니다.');
    if (!targetCurrency) throw new BadRequestException('대상 통화는 필수 입력값입니다.');

    const exchangeRate = await this.getExchangeRate(targetCurrency);
    if (!exchangeRate) throw new BadRequestException('환율 정보를 가져올 수 없습니다.');

    const { fee, fixedFee } = this.getFeePolicy(amount, targetCurrency);
    if (fee === undefined || fixedFee === undefined) {
      throw new BadRequestException('잘못된 통화 유형입니다. (지원: USD, JPY)');
    }

    const totalFee = Number((amount * fee + fixedFee).toFixed(2));
    const targetAmount = Number(((amount - totalFee) / exchangeRate).toFixed(2));
    
    if (targetAmount <= 0) throw new BadRequestException('받는 금액이 0보다 커야 합니다.');

    const quote: Quote = {
      quoteId: uuidv4(),
      exchangeRate: Number(exchangeRate.toFixed(3)),  // ✅ 소수점 3자리 제한
      expireTime: moment().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
      targetAmount: targetAmount,  // ✅ 반올림 적용
    };

    this.saveQuote(quote); // ✅ 견적서 저장 (중요)
    console.log(`✅ [TransferService] 새 견적서 저장됨:`, quote); // 🔥 추가 로그

    return {
      resultCode: 200,
      resultMsg: 'OK',
      quote,
    };
  }

  /** ✅ 5️⃣ 환율 정보 조회 */
  async getExchangeRate(targetCurrency: string): Promise<number> {
    try {
      const apiUrl = 'https://crix-api-cdn.upbit.com/v1/forex/recent?codes=FRX.KRWJPY,FRX.KRWUSD';
      const response = await this.httpService.get(apiUrl).toPromise();
      const data = response.data;

      if (!data || !Array.isArray(data)) {
        throw new BadRequestException('환율 정보를 가져올 수 없습니다.');
      }

      const currencyData = data.find((item) => item.currencyCode === targetCurrency);
      if (!currencyData) {
        throw new BadRequestException('지원하지 않는 통화입니다. (지원 통화: USD, JPY)');
      }

      return currencyData.basePrice / currencyData.currencyUnit;
    } catch (error) {
      console.error('🚨 환율 API 호출 오류:', error.message);
      throw new BadRequestException('환율 정보를 가져오는 중 오류가 발생했습니다.');
    }
  }

  /** ✅ 6️⃣ 수수료 계산 함수 */
  private calculateFee(amount: number, exchangeRate: number) {
    return amount * exchangeRate * 0.002 + 1000; // 예제 수수료 계산 로직
  }

  /** ✅ 7️⃣ 수수료 정책 */
  private getFeePolicy(amount: number, currency: string) {
    if (currency === 'USD') {
      if (amount <= 1000000) {
        return { fee: 0.002, fixedFee: 1000 };  // ✅ 100만원 이하
      }
      return { fee: 0.001, fixedFee: 3000 };  // ✅ 100만원 초과
    } else if (currency === 'JPY') {
      return { fee: 0.005, fixedFee: 3000 };  // ✅ 고정 정책
    }
    throw new BadRequestException('지원하지 않는 통화입니다. (USD, JPY만 가능)');
  }
}
