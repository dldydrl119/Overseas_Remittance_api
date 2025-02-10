import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferService } from './transfer.service';
import { TransferController } from './transfer.controller';
import { Transfer } from './transfer.entity'; // 새로 추가된 엔티티
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity'; // ✅ User 엔티티 추가


@Module({
  imports: [
    TypeOrmModule.forFeature([Transfer, User]), // ✅ TypeORM 엔티티 등록
    HttpModule,
    JwtModule.register({}),
    ConfigModule,
    AuthModule,
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService],
})
export class TransferModule {}
