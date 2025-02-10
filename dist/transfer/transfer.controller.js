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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferController = void 0;
const common_1 = require("@nestjs/common");
const transfer_service_1 = require("./transfer.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const create_quote_dto_1 = require("./dto/create-quote.dto");
let TransferController = class TransferController {
    constructor(transferService) {
        this.transferService = transferService;
    }
    async createQuote(body, req) {
        try {
            console.log('🔍 [TransferController] Incoming Request User:', req.user);
            if (!body.amount || !body.targetCurrency) {
                throw new common_1.BadRequestException('송금 금액과 대상 통화는 필수 입력값입니다.');
            }
            return await this.transferService.generateQuote(body.amount, body.targetCurrency, req.user);
        }
        catch (error) {
            console.error('🚨 [TransferController] Error:', error.message);
            if (error instanceof common_1.UnauthorizedException) {
                throw new common_1.UnauthorizedException('인증에 실패했습니다. 다시 로그인해 주세요.');
            }
            throw new common_1.BadRequestException(`오류 발생: ${error.message}`);
        }
    }
    async requestTransfer(body, req) {
        try {
            if (!req.user)
                throw new common_1.UnauthorizedException('인증되지 않은 사용자입니다.');
            return await this.transferService.requestTransfer(body.quoteId, req.user);
        }
        catch (error) {
            console.error('🚨 [TransferController] Error:', error.message);
            if (error instanceof common_1.UnauthorizedException) {
                throw new common_1.UnauthorizedException('인증되지 않은 사용자입니다.');
            }
            if (error instanceof common_1.BadRequestException) {
                throw new common_1.BadRequestException(error.message);
            }
            throw new common_1.InternalServerErrorException('알 수 없는 오류가 발생했습니다. (UNKNOWN_ERROR)');
        }
    }
    async getUserTransfers(req) {
        return this.transferService.getUserTransfers(req.user.id);
    }
};
exports.TransferController = TransferController;
__decorate([
    (0, common_1.Post)('quote'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_quote_dto_1.CreateQuoteDto, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "createQuote", null);
__decorate([
    (0, common_1.Post)('request'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "requestTransfer", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransferController.prototype, "getUserTransfers", null);
exports.TransferController = TransferController = __decorate([
    (0, common_1.Controller)('transfer'),
    __metadata("design:paramtypes", [transfer_service_1.TransferService])
], TransferController);
//# sourceMappingURL=transfer.controller.js.map