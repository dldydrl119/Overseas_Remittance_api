import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    if (!payload) {
      console.error('🚨 [JwtStrategy] Invalid Payload:', payload);
      throw new UnauthorizedException('토큰이 유효하지 않습니다.');
    }

    console.log('✅ [JwtStrategy] Decoded Payload:', payload);
    return payload;
  }
}
