import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(userId: string, password: string): Promise<any> {
    const user = await this.usersService.findByUserId(userId);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const { password: _, ...result } = user;
    return result;
  }

  async login(userId: string, password: string) {
    const user = await this.validateUser(userId, password);
  
    const payload = { userId: user.userId, sub: user.id };
    const secret = this.configService.get<string>('JWT_SECRET');
  
    if (!secret) {
      console.error('JWT_SECRET는 .env 파일에 정의되어 있지 않습니다!');
      throw new Error('내부 서버 오류: JWT_SECRET이 누락되었습니다');
    }
  
    const token = this.jwtService.sign(payload, {
      secret,
      expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '1800s', // 30분 기본값
    });
  
    console.log('✅ 시크릿 키 :', secret);
    console.log('✅ 생성된 토큰:', token);
  
    return {
      resultCode: 200,
      resultMsg: 'OK',
      token,
      // user: {
      //   userId: user.userId,
      //   type: user.type,
      // }
    };
  }  
}
