import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  console.log("✅ Loaded JWT_SECRET in main.ts:", configService.get<string>('JWT_SECRET')); // 🔥 추가 로그
  await app.listen(3000);
}
bootstrap();
