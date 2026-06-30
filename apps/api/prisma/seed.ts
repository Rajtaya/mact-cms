/**
 * Seed: one user per role, master data, and a demo case so the dashboard,
 * search and reports have something to render on first run.
 *
 * Run: npm run db:seed   (idempotent — upserts by natural keys)
 */
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Seed password comes from the environment. Falls back to a dev-only default
// for LOCAL use; never ship this default to a reachable environment.
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'Password@123';

async function user(email: string, fullName: string, role: Role) {
  const passwordHash = await argon2.hash(SEED_PASSWORD);
  // Update passwordHash too, so re-running the seed rotates credentials.
  return prisma.user.upsert({
    where: { email },
    update: { role, fullName, passwordHash },
    create: { email, fullName, role, passwordHash },
  });
}

async function main() {
  console.log('Seeding users…');
  const admin = await user('admin@mact.local', 'System Administrator', Role.ADMINISTRATOR);
  const advocate = await user('advocate@mact.local', 'Sr. Adv. R. Sharma', Role.ADVOCATE);
  await user('junior@mact.local', 'Jr. Adv. P. Verma', Role.JUNIOR_ADVOCATE);
  await user('staff@mact.local', 'Office Staff — Ramesh', Role.OFFICE_STAFF);
  await user('readonly@mact.local', 'Auditor (Read Only)', Role.READ_ONLY);

  console.log('Seeding master data…');
  const court = await prisma.court.upsert({
    where: { name_courtNumber: { name: 'MACT, Kurukshetra', courtNumber: '1' } },
    update: {},
    create: {
      name: 'MACT, Kurukshetra',
      courtNumber: '1',
      district: 'Kurukshetra',
      state: 'Haryana',
      presidingOfficer: 'Sh. A. K. Singh, PO',
    },
  });

  const insurer = await prisma.insuranceCompany.upsert({
    where: { name: 'The New India Assurance Co. Ltd.' },
    update: {},
    create: { name: 'The New India Assurance Co. Ltd.', shortName: 'NIA' },
  });

  const ps = await prisma.policeStation.upsert({
    where: { name_district: { name: 'PS City Kurukshetra', district: 'Kurukshetra' } },
    update: {},
    create: { name: 'PS City Kurukshetra', district: 'Kurukshetra', state: 'Haryana' },
  });

  await prisma.hospital.upsert({
    where: { name_city: { name: 'LNJP Hospital', city: 'Kurukshetra' } },
    update: {},
    create: { name: 'LNJP Hospital', city: 'Kurukshetra', state: 'Haryana' },
  });

  console.log('Seeding a demo case…');
  const existing = await prisma.case.findFirst({ where: { caseRef: 'MACT-DEMO-0001' } });
  if (!existing) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 30, 0, 0);

    await prisma.case.create({
      data: {
        caseRef: 'MACT-DEMO-0001',
        mactCaseNumber: 'MACT/124/2026',
        courtId: court.id,
        courtNumber: '1',
        presidingOfficer: 'Sh. A. K. Singh, PO',
        physicalFileLocation: 'Shelf B / Cabinet 3',
        filingDate: new Date('2026-02-10'),
        nextHearingDate: tomorrow,
        leadAdvocateId: advocate.id,
        priority: 'HIGH',
        caseSummary: 'Fatal accident on NH-44; claim by dependents of deceased.',
        claimPetition: {
          create: { petitionNumber: 'CP/124/2026', claimAmount: 5000000, interestRate: 7.5 },
        },
        accident: {
          create: {
            accidentDate: new Date('2026-01-15'),
            location: 'NH-44, near Pipli',
            district: 'Kurukshetra',
            state: 'Haryana',
            firNumber: 'FIR 45/2026',
            policeStationId: ps.id,
          },
        },
        claimants: {
          create: [
            {
              name: 'Sunita Devi',
              guardianName: 'W/o Late Mohan Lal',
              mobile: '9812345678',
              aadhaar: '234512347890',
              occupation: 'Homemaker',
              bankAccountNo: '50100123456789',
              bankIfsc: 'HDFC0000123',
            },
          ],
        },
        victims: {
          create: [
            { type: 'DECEASED', name: 'Mohan Lal', age: 38, monthlyIncome: 25000, occupation: 'Driver', dateOfDeath: new Date('2026-01-15') },
          ],
        },
        vehicles: {
          create: [
            {
              role: 'OFFENDING',
              registrationNo: 'HR65A1234',
              vehicleType: 'Truck',
              make: 'Tata',
              owner: { create: { name: 'Rajbir Singh', mobile: '9876500000' } },
              driver: { create: { name: 'Karan', licenceNumber: 'HR-0420110012345', licenceCategory: 'HMV' } },
              insurance: {
                create: {
                  insuranceCompanyId: insurer.id,
                  policyNumber: 'NIA/2025/998877',
                  policyExpiryDate: new Date('2026-12-31'),
                  isThirdParty: true,
                },
              },
            },
          ],
        },
        respondents: {
          create: [
            { type: 'OWNER', name: 'Rajbir Singh' },
            { type: 'INSURER', name: 'The New India Assurance Co. Ltd.', insurerId: insurer.id },
          ],
        },
        fee: {
          create: {
            feeType: 'PERCENTAGE',
            percentage: 10,
            agreedAmount: 100000,
            payments: { create: { amount: 25000, paymentMode: 'UPI', receiptNumber: 'RCPT-2026-00001' } },
          },
        },
        activities: { create: { userId: admin.id, verb: 'seeded demo case' } },
      },
    });
  }

  console.log('Seed complete. Admin: admin@mact.local (password from $SEED_PASSWORD).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
