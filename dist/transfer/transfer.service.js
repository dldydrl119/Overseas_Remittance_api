"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transfer_entity_1 = require("./transfer.entity");
const axios_1 = require("@nestjs/axios");
const moment_1 = __importDefault(require("moment"));
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/user.entity");
let TransferService = class TransferService {
    async getUserTransfers(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('사용자를 찾을 수 없습니다.');
        const transfers = await this.transferRepository.find({
            where: { user: { id: userId } },
            order: { requestedDate: 'DESC' },
        });
        const today = (0, moment_1.default)().startOf('day').toDate();
        const todayTransfers = transfers.filter(t => new Date(t.requestedDate) >= today);
        return {
            resultCode: 200,
            resultMsg: 'OK',
            userId: user.userId,
            name: user.name,
            todayTransferCount: todayTransfers.length,
            todayTransferUsdAmount: todayTransfers.reduce((sum, t) => sum + t.targetAmount, 0),
            history: transfers.map(t => ({
                sourceAmount: t.sourceAmount,
                fee: t.fee,
                usdExchangeRate: t.exchangeRate,
                usdAmount: (t.sourceAmount - t.fee) / t.exchangeRate,
                targetCurrency: t.targetCurrency,
                exchangeRate: t.exchangeRate,
                targetAmount: t.targetAmount,
                requestedDate: t.requestedDate.toISOString(),
            })),
        };
    }
    constructor(httpService, transferRepository, userRepository) {
        this.httpService = httpService;
        this.transferRepository = transferRepository;
        this.userRepository = userRepository;
        this.quotes = new Map();
    }
    saveQuote(quote) {
        this.quotes.set(quote.quoteId, quote);
        console.log(`✅ [TransferService] 저장된 견적서:`, this.quotes);
    }
    getQuote(quoteId) {
        console.log(`🔍 [TransferService] 저장된 quoteId 목록:`, [...this.quotes.keys()]);
        return this.quotes.get(quoteId);
    }
    async requestTransfer(quoteId, user) {
        if (!user)
            throw new common_1.UnauthorizedException('인증되지 않은 사용자입니다.');
        const quote = this.getQuote(quoteId);
        if (!quote)
            throw new common_1.BadRequestException('존재하지 않는 견적서입니다.');
        const now = (0, moment_1.default)();
        const expireTime = (0, moment_1.default)(quote.expireTime, 'YYYY-MM-DD HH:mm:ss');
        if (now.isAfter(expireTime)) {
            throw new common_1.BadRequestException('견적서가 만료되었습니다. (QUOTE_EXPIRED)');
        }
        const userTransfers = await this.getUserTransfers(user.id);
        const todayTransferUsdAmount = userTransfers.todayTransferUsdAmount;
        const dailyLimit = user.type === 'corporate' ? 5000 : 1000;
        if (todayTransferUsdAmount + quote.targetAmount > dailyLimit) {
            throw new common_1.ForbiddenException('송금 한도를 초과하였습니다. (LIMIT_EXCESS)');
        }
        const transfer = this.transferRepository.create({
            user: user.id,
            sourceAmount: Math.floor(quote.targetAmount * quote.exchangeRate),
            fee: Math.floor(this.calculateFee(quote.targetAmount, quote.exchangeRate)),
            exchangeRate: quote.exchangeRate,
            targetCurrency: 'JPY',
            targetAmount: Math.floor(quote.targetAmount),
        });
        try {
            await this.transferRepository.save(transfer);
            console.log(`✅ [TransferService] 송금 성공: ${quoteId}`);
        }
        catch (error) {
            console.error('🚨 [TransferService] Database Error:', error.message);
            throw new common_1.InternalServerErrorException('알 수 없는 오류가 발생했습니다. (UNKNOWN_ERROR)');
        }
        return {
            resultCode: 200,
            resultMsg: 'OK',
        };
    }
    async generateQuote(amount, targetCurrency, user) {
        if (!user)
            throw new common_1.UnauthorizedException('인증되지 않은 사용자입니다.');
        if (!amount || amount <= 0)
            throw new common_1.BadRequestException('송금 금액은 0보다 커야 합니다.');
        if (!targetCurrency)
            throw new common_1.BadRequestException('대상 통화는 필수 입력값입니다.');
        const exchangeRate = await this.getExchangeRate(targetCurrency);
        if (!exchangeRate)
            throw new common_1.BadRequestException('환율 정보를 가져올 수 없습니다.');
        const { fee, fixedFee } = this.getFeePolicy(amount, targetCurrency);
        if (fee === undefined || fixedFee === undefined) {
            throw new common_1.BadRequestException('잘못된 통화 유형입니다. (지원: USD, JPY)');
        }
        const totalFee = Number((amount * fee + fixedFee).toFixed(2));
        const targetAmount = Number(((amount - totalFee) / exchangeRate).toFixed(2));
        if (targetAmount <= 0)
            throw new common_1.BadRequestException('받는 금액이 0보다 커야 합니다.');
        const quote = {
            quoteId: (0, uuid_1.v4)(),
            exchangeRate: Number(exchangeRate.toFixed(3)),
            expireTime: (0, moment_1.default)().add(10, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
            targetAmount: targetAmount,
        };
        this.saveQuote(quote);
        console.log(`✅ [TransferService] 새 견적서 저장됨:`, quote);
        return {
            resultCode: 200,
            resultMsg: 'OK',
            quote,
        };
    }
    async getExchangeRate(targetCurrency) {
        try {
            const apiUrl = 'https://crix-api-cdn.upbit.com/v1/forex/recent?codes=FRX.KRWJPY,FRX.KRWUSD';
            const response = await this.httpService.get(apiUrl).toPromise();
            const data = response.data;
            if (!data || !Array.isArray(data)) {
                throw new common_1.BadRequestException('환율 정보를 가져올 수 없습니다.');
            }
            const currencyData = data.find((item) => item.currencyCode === targetCurrency);
            if (!currencyData) {
                throw new common_1.BadRequestException('지원하지 않는 통화입니다. (지원 통화: USD, JPY)');
            }
            return currencyData.basePrice / currencyData.currencyUnit;
        }
        catch (error) {
            console.error('🚨 환율 API 호출 오류:', error.message);
            throw new common_1.BadRequestException('환율 정보를 가져오는 중 오류가 발생했습니다.');
        }
    }
    calculateFee(amount, exchangeRate) {
        return amount * exchangeRate * 0.002 + 1000;
    }
    getFeePolicy(amount, currency) {
        if (currency === 'USD') {
            if (amount <= 1000000) {
                return { fee: 0.002, fixedFee: 1000 };
            }
            return { fee: 0.001, fixedFee: 3000 };
        }
        else if (currency === 'JPY') {
            return { fee: 0.005, fixedFee: 3000 };
        }
        throw new common_1.BadRequestException('지원하지 않는 통화입니다. (USD, JPY만 가능)');
    }
};
exports.TransferService = TransferService;
exports.TransferService = TransferService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(transfer_entity_1.Transfer)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [axios_1.HttpService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], TransferService);
//# sourceMappingURL=transfer.service.js.map