import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🔍 [JwtAuthGuard] Authorization Header:', authHeader);

    if (!authHeader) {
      console.log('🚨 Authorization header is missing');
      throw new UnauthorizedException('인증 토큰이 없습니다.');
    }

    try {
      const token = authHeader.split(' ')[1]; // "Bearer <TOKEN>"
      console.log('🔍 [JwtAuthGuard] Extracted Token:', token);

      // ✅ 토큰 검증 시 ConfigService에서 JWT_SECRET을 다시 가져옴
      const secret = this.configService.get<string>('JWT_SECRET');
      console.log('✅ [JwtAuthGuard] Using JWT_SECRET for Verification:', secret);

      const decoded = this.jwtService.verify(token, { secret });

      // ✅ 토큰이 검증되었을 경우 request.user에 저장
      request.user = decoded;
      console.log('✅ [JwtAuthGuard] Decoded User:', decoded);

      return true;
    } catch (error) {
      console.error('🚨 Invalid Token Error:', error.message);
      throw new UnauthorizedException('토큰이 유효하지 않습니다. 다시 로그인해주세요.');
    }
  }
}
