import { Test, TestingModule } from '@nestjs/testing';
import { TransferService } from './transfer.service';
import { Transfer } from './transfer.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import moment from 'moment';

describe('TransferService', () => {
  let service: TransferService;
  let transferRepository: Repository<Transfer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransferService,
        {
          provide: getRepositoryToken(Transfer),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<TransferService>(TransferService);
    transferRepository = module.get<Repository<Transfer>>(getRepositoryToken(Transfer));
  });

  describe('requestTransfer', () => {
    it('✅ 유효한 송금 요청 시 성공', async () => {
      const user = { id: 'user-1', type: 'personal' };
      const quote = {
        quoteId: 'quote-123',
        exchangeRate: 9.57,
        expireTime: moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        targetAmount: 500,
      };
      
      jest.spyOn(service, 'getQuote').mockReturnValue(quote);
      jest.spyOn(service, 'getUserTransfers').mockResolvedValue(Promise.resolve({
        resultCode: 200,
        resultMsg: 'OK',
        userId: 'test@example.com', 
        name: '홍길동', // ✅ name 추가
        todayTransferCount: 1, 
        todayTransferUsdAmount: 200,
        history: [
          {
            sourceAmount: 1000,
            fee: 50,
            usdExchangeRate: 1.2, // ✅ usdExchangeRate 추가
            usdAmount: 500, // ✅ USD 변환 금액 추가
            targetCurrency: 'JPY',
            exchangeRate: 9.5,
            targetAmount: 1200,
            requestedDate: new Date('2025-02-11T12:00:00.000Z').toISOString(), // ✅ string 변환
          },
        ],
        }));

      jest.spyOn(transferRepository, 'create').mockReturnValue({ id: 'transfer-1' } as Transfer);
      jest.spyOn(transferRepository, 'save').mockResolvedValue({ id: 'transfer-1' } as Transfer);

      const result = await service.requestTransfer('quote-123', user);

      expect(result).toEqual({ resultCode: 200, resultMsg: 'OK' });
    });

    it('🚨 만료된 견적서 사용 시 QUOTE_EXPIRED 오류 발생', async () => {
      const user = { id: 'user-1', type: 'personal' };
      const expiredQuote = {
        quoteId: 'quote-123',
        exchangeRate: 9.57,
        expireTime: moment().subtract(1, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        targetAmount: 500,
      };
      
      jest.spyOn(service, 'getQuote').mockReturnValue(expiredQuote);

      await expect(service.requestTransfer('quote-123', user)).rejects.toThrow(BadRequestException);
    });

    it('🚨 하루 송금 한도 초과 시 LIMIT_EXCESS 오류 발생 (개인 회원)', async () => {
      const user = { id: 'user-1', type: 'personal' };
      const quote = {
        quoteId: 'quote-123',
        exchangeRate: 9.57,
        expireTime: moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        targetAmount: 900,
      };

      jest.spyOn(service, 'getQuote').mockReturnValue(quote);
      jest.spyOn(service, 'getUserTransfers').mockResolvedValue(Promise.resolve({
        resultCode: 200,
        resultMsg: 'OK',
        userId: 'test@example.com', 
        name: '홍길동', // ✅ name 추가
        todayTransferCount: 1, 
        todayTransferUsdAmount: 200,
        history: [
          {
            sourceAmount: 1000,
            fee: 50,
            usdExchangeRate: 1.2, // ✅ usdExchangeRate 추가
            usdAmount: 500, // ✅ USD 변환 금액 추가
            targetCurrency: 'JPY',
            exchangeRate: 9.5,
            targetAmount: 1200,
            requestedDate: new Date('2025-02-11T12:00:00.000Z').toISOString(), // ✅ string 변환
          },
        ],
        }));
      await expect(service.requestTransfer('quote-123', user)).rejects.toThrow(ForbiddenException);
    });

    it('🚨 존재하지 않는 견적서 사용 시 BadRequestException 발생', async () => {
      const user = { id: 'user-1', type: 'personal' };

      jest.spyOn(service, 'getQuote').mockReturnValue(undefined);

      await expect(service.requestTransfer('quote-999', user)).rejects.toThrow(BadRequestException);
    });

    it('🚨 알 수 없는 오류 발생 시 UNKNOWN_ERROR 반환', async () => {
      const user = { id: 'user-1', type: 'personal' };
      const quote = {
        quoteId: 'quote-123',
        exchangeRate: 9.57,
        expireTime: moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        targetAmount: 500,
      };

      jest.spyOn(service, 'getQuote').mockReturnValue(quote);
      jest.spyOn(service, 'getUserTransfers').mockResolvedValue(Promise.resolve({
        resultCode: 200,
        resultMsg: 'OK',
        userId: 'test@example.com', 
        name: '홍길동', // ✅ name 추가
        todayTransferCount: 1, 
        todayTransferUsdAmount: 200,
        history: [
          {
            sourceAmount: 1000,
            fee: 50,
            usdExchangeRate: 1.2, // ✅ usdExchangeRate 추가
            usdAmount: 500, // ✅ USD 변환 금액 추가
            targetCurrency: 'JPY',
            exchangeRate: 9.5,
            targetAmount: 1200,
            requestedDate: new Date('2025-02-11T12:00:00.000Z').toISOString(), // ✅ string 변환
          },
        ],
        }));

      jest.spyOn(transferRepository, 'save').mockRejectedValue(new Error('DB Error'));

      await expect(service.requestTransfer('quote-123', user)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('generateQuote', () => {
    it('✅ 올바른 견적 요청 시 정상적으로 견적서 생성', async () => {
      const user = { id: 'user-1' };
      
      jest.spyOn(service, 'getExchangeRate').mockResolvedValue(9.57);
      jest.spyOn(service as any, 'getFeePolicy').mockReturnValue({ fee: 0.005, fixedFee: 3000 });
    
      const result = await service.generateQuote(10000, 'JPY', user);
    
      expect(result).toHaveProperty('resultCode', 200);
      expect(result).toHaveProperty('quote');
      expect(result.quote.targetAmount).toBeGreaterThan(0);
    });
  });
});
