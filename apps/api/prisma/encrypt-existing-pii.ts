/**
 * One-off migration: encrypt any existing plaintext KYC PII (Aadhaar, PAN,
 * bank account no.) in Claimant and Owner rows. Idempotent — already-encrypted
 * values are skipped. Uses a raw PrismaClient (no middleware) so it reads the
 * true stored value.
 *
 * Run:  ENCRYPTION_KEY=<hex> DATABASE_URL=<url> npx ts-node prisma/encrypt-existing-pii.ts
 */
import { PrismaClient } from '@prisma/client';
import { encrypt, isEncrypted } from '../src/common/crypto/pii-crypto';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is required to run this migration.');
  }
  let updated = 0;

  const claimants = await prisma.claimant.findMany({
    select: { id: true, aadhaar: true, pan: true, bankAccountNo: true },
  });
  for (const c of claimants) {
    const data: Record<string, string> = {};
    if (c.aadhaar && !isEncrypted(c.aadhaar)) data.aadhaar = encrypt(c.aadhaar);
    if (c.pan && !isEncrypted(c.pan)) data.pan = encrypt(c.pan);
    if (c.bankAccountNo && !isEncrypted(c.bankAccountNo))
      data.bankAccountNo = encrypt(c.bankAccountNo);
    if (Object.keys(data).length) {
      await prisma.claimant.update({ where: { id: c.id }, data });
      updated++;
    }
  }

  const owners = await prisma.owner.findMany({
    select: { id: true, aadhaar: true, pan: true },
  });
  for (const o of owners) {
    const data: Record<string, string> = {};
    if (o.aadhaar && !isEncrypted(o.aadhaar)) data.aadhaar = encrypt(o.aadhaar);
    if (o.pan && !isEncrypted(o.pan)) data.pan = encrypt(o.pan);
    if (Object.keys(data).length) {
      await prisma.owner.update({ where: { id: o.id }, data });
      updated++;
    }
  }

  console.log(`Encrypted PII on ${updated} row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
