import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) { }
  getDatabaseUrl(): string {
    const url = this.configService.get<string>('DB_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }
    return url;
  }
}
