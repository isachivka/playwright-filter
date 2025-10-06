import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { CSSConfigService } from './css-config.service';
import { JSConfigService } from './js-config.service';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [CSSConfigService, JSConfigService],
  exports: [CSSConfigService, JSConfigService],
})
export class ConfigModule {}
