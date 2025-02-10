import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    validateUser(userId: string, password: string): Promise<any>;
    login(userId: string, password: string): Promise<{
        resultCode: number;
        resultMsg: string;
        token: string;
    }>;
}
