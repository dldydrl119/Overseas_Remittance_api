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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
let JwtAuthGuard = class JwtAuthGuard {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        console.log('🔍 [JwtAuthGuard] Authorization Header:', authHeader);
        if (!authHeader) {
            console.log('🚨 Authorization header is missing');
            throw new common_1.UnauthorizedException('인증 토큰이 없습니다.');
        }
        try {
            const token = authHeader.split(' ')[1];
            console.log('🔍 [JwtAuthGuard] Extracted Token:', token);
            const secret = this.configService.get('JWT_SECRET');
            console.log('✅ [JwtAuthGuard] Using JWT_SECRET for Verification:', secret);
            const decoded = this.jwtService.verify(token, { secret });
            request.user = decoded;
            console.log('✅ [JwtAuthGuard] Decoded User:', decoded);
            return true;
        }
        catch (error) {
            console.error('🚨 Invalid Token Error:', error.message);
            throw new common_1.UnauthorizedException('토큰이 유효하지 않습니다. 다시 로그인해주세요.');
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map