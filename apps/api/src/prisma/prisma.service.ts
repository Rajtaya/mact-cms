import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { decryptDeep, encryptDeep } from '../common/crypto/pii-crypto';

/**
 * Thin wrapper exposing the generated Prisma client as an injectable,
 * lifecycle-managed singleton. Installs middleware that transparently
 * encrypts KYC PII (Aadhaar/PAN/bank) on write and decrypts it on read.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
    this.$use(async (params, next) => {
      if (params.args?.data) encryptDeep(params.args.data);
      const result = await next(params);
      if (result && typeof result === 'object') decryptDeep(result);
      return result;
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
