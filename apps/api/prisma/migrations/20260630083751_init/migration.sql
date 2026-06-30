-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'ADVOCATE', 'JUNIOR_ADVOCATE', 'OFFICE_STAFF', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED_FOR_ORDER', 'DECIDED', 'DISPOSED', 'WITHDRAWN', 'ABATED', 'TRANSFERRED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "CaseOutcome" AS ENUM ('PENDING', 'ALLOWED', 'PARTLY_ALLOWED', 'DISMISSED', 'COMPROMISED');

-- CreateEnum
CREATE TYPE "CaseStage" AS ENUM ('FILING', 'SCRUTINY', 'ADMISSION', 'NOTICE_TO_RESPONDENTS', 'WRITTEN_STATEMENT', 'FRAMING_OF_ISSUES', 'CLAIMANT_EVIDENCE', 'RESPONDENT_EVIDENCE', 'FINAL_ARGUMENTS', 'AWARD', 'EXECUTION', 'APPEAL');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('CLAIMANT', 'RESPONDENT');

-- CreateEnum
CREATE TYPE "VictimType" AS ENUM ('DECEASED', 'INJURED');

-- CreateEnum
CREATE TYPE "VehicleRole" AS ENUM ('OFFENDING', 'VICTIM_VEHICLE', 'OTHER');

-- CreateEnum
CREATE TYPE "RespondentType" AS ENUM ('DRIVER', 'OWNER', 'INSURER', 'STATE', 'OTHER');

-- CreateEnum
CREATE TYPE "WitnessType" AS ENUM ('EYE_WITNESS', 'POLICE', 'MEDICAL', 'EXPERT', 'PANCH', 'OTHER');

-- CreateEnum
CREATE TYPE "HearingStatus" AS ENUM ('SCHEDULED', 'HELD', 'ADJOURNED', 'CANCELLED', 'PART_HEARD');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('FIR', 'INSURANCE', 'MEDICAL', 'COURT_ORDERS', 'PHOTOGRAPHS', 'VIDEOS', 'AADHAAR', 'RC', 'DRIVING_LICENCE', 'AWARD_COPY', 'POLICE_RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('PERCENTAGE', 'FIXED', 'HYBRID');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'CARD', 'DD', 'OTHER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('HEARING_TOMORROW', 'HEARING_TODAY', 'INSURANCE_EXPIRY', 'PENDING_DOCUMENT', 'PENDING_FEE', 'CASE_ASSIGNED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'UPLOAD', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'READ_ONLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courtNumber" TEXT,
    "district" TEXT,
    "state" TEXT,
    "presidingOfficer" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "judges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "courtId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "judges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "irdaCode" TEXT,
    "address" TEXT,
    "contactNo" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "police_stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "police_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hospitals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseRef" TEXT NOT NULL,
    "mactCaseNumber" TEXT,
    "courtId" TEXT,
    "courtNumber" TEXT,
    "presidingOfficer" TEXT,
    "benchDetails" TEXT,
    "physicalFileLocation" TEXT,
    "filingDate" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3),
    "institutionDate" TIMESTAMP(3),
    "nextHearingDate" TIMESTAMP(3),
    "prevHearingDate" TIMESTAMP(3),
    "status" "CaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "outcome" "CaseOutcome" NOT NULL DEFAULT 'PENDING',
    "stage" "CaseStage" NOT NULL DEFAULT 'FILING',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "caseSummary" TEXT,
    "internalNotes" TEXT,
    "leadAdvocateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_assignees" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_petitions" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "petitionNumber" TEXT,
    "petitionDate" TIMESTAMP(3),
    "claimAmount" DECIMAL(14,2),
    "compensationAwarded" DECIMAL(14,2),
    "interestRate" DECIMAL(5,2),
    "awardDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claim_petitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claimants" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guardianName" TEXT,
    "relationToVictim" TEXT,
    "address" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "aadhaar" TEXT,
    "pan" TEXT,
    "occupation" TEXT,
    "monthlyIncome" DECIMAL(12,2),
    "dateOfBirth" TIMESTAMP(3),
    "age" INTEGER,
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "bankIfsc" TEXT,
    "bankBranch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claimants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "victims" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "VictimType" NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "occupation" TEXT,
    "monthlyIncome" DECIMAL(12,2),
    "futureProspectsPct" DECIMAL(5,2),
    "disabilityPct" DECIMAL(5,2),
    "natureOfInjury" TEXT,
    "dateOfDeath" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "victims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "respondents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "type" "RespondentType" NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mobile" TEXT,
    "insurerId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "respondents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "witnesses" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mobile" TEXT,
    "type" "WitnessType" NOT NULL DEFAULT 'OTHER',
    "statement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "witnesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accident_details" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "accidentDate" TIMESTAMP(3),
    "accidentTime" TEXT,
    "location" TEXT,
    "district" TEXT,
    "state" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "policeStationId" TEXT,
    "firNumber" TEXT,
    "ddrNumber" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accident_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "role" "VehicleRole" NOT NULL DEFAULT 'OFFENDING',
    "registrationNo" TEXT,
    "vehicleType" TEXT,
    "make" TEXT,
    "model" TEXT,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "registrationDate" TIMESTAMP(3),
    "permitNumber" TEXT,
    "permitValidity" TIMESTAMP(3),
    "fitnessValidity" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "address" TEXT,
    "mobile" TEXT,
    "licenceNumber" TEXT,
    "licenceValidity" TIMESTAMP(3),
    "licenceCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "mobile" TEXT,
    "aadhaar" TEXT,
    "pan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "insuranceCompanyId" TEXT,
    "companyNameText" TEXT,
    "policyNumber" TEXT,
    "policyStartDate" TIMESTAMP(3),
    "policyExpiryDate" TIMESTAMP(3),
    "isThirdParty" BOOLEAN NOT NULL DEFAULT true,
    "surveyor" TEXT,
    "claimNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_details" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "hospitalId" TEXT,
    "hospitalNameText" TEXT,
    "doctorName" TEXT,
    "admissionDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "treatmentDetails" TEXT,
    "mlcNumber" TEXT,
    "disabilityPct" DECIMAL(5,2),
    "totalMedicalBills" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hearings" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "hearingDate" TIMESTAMP(3) NOT NULL,
    "status" "HearingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "proceedings" TEXT,
    "judgeRemarks" TEXT,
    "advocateNotes" TEXT,
    "nextHearingDate" TIMESTAMP(3),
    "orderDocumentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hearings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "tags" TEXT[],
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_arrangements" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "feeType" "FeeType" NOT NULL DEFAULT 'FIXED',
    "fixedAmount" DECIMAL(12,2),
    "percentage" DECIMAL(5,2),
    "agreedAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_arrangements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
    "receiptNumber" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compensation_estimates" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "label" TEXT,
    "age" INTEGER,
    "monthlyIncome" DECIMAL(12,2),
    "futureProspectsPct" DECIMAL(5,2),
    "disabilityPct" DECIMAL(5,2),
    "medicalExpenses" DECIMAL(12,2),
    "funeralExpenses" DECIMAL(12,2),
    "consortium" DECIMAL(12,2),
    "attendantCharges" DECIMAL(12,2),
    "transportCharges" DECIMAL(12,2),
    "specialDiet" DECIMAL(12,2),
    "painAndSuffering" DECIMAL(12,2),
    "multiplier" INTEGER,
    "dependencyDeduction" DECIMAL(5,2),
    "computedLossOfDependency" DECIMAL(14,2),
    "totalCompensation" DECIMAL(14,2),
    "breakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "userId" TEXT,
    "verb" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "courts_district_idx" ON "courts"("district");

-- CreateIndex
CREATE UNIQUE INDEX "courts_name_courtNumber_key" ON "courts"("name", "courtNumber");

-- CreateIndex
CREATE INDEX "judges_courtId_idx" ON "judges"("courtId");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_name_key" ON "insurance_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "police_stations_name_district_key" ON "police_stations"("name", "district");

-- CreateIndex
CREATE UNIQUE INDEX "hospitals_name_city_key" ON "hospitals"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "cases_caseRef_key" ON "cases"("caseRef");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_stage_idx" ON "cases"("stage");

-- CreateIndex
CREATE INDEX "cases_priority_idx" ON "cases"("priority");

-- CreateIndex
CREATE INDEX "cases_nextHearingDate_idx" ON "cases"("nextHearingDate");

-- CreateIndex
CREATE INDEX "cases_leadAdvocateId_idx" ON "cases"("leadAdvocateId");

-- CreateIndex
CREATE INDEX "cases_mactCaseNumber_idx" ON "cases"("mactCaseNumber");

-- CreateIndex
CREATE INDEX "case_assignees_userId_idx" ON "case_assignees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "case_assignees_caseId_userId_key" ON "case_assignees"("caseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "claim_petitions_caseId_key" ON "claim_petitions"("caseId");

-- CreateIndex
CREATE INDEX "claimants_caseId_idx" ON "claimants"("caseId");

-- CreateIndex
CREATE INDEX "claimants_mobile_idx" ON "claimants"("mobile");

-- CreateIndex
CREATE INDEX "victims_caseId_idx" ON "victims"("caseId");

-- CreateIndex
CREATE INDEX "respondents_caseId_idx" ON "respondents"("caseId");

-- CreateIndex
CREATE INDEX "respondents_type_idx" ON "respondents"("type");

-- CreateIndex
CREATE INDEX "witnesses_caseId_idx" ON "witnesses"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "accident_details_caseId_key" ON "accident_details"("caseId");

-- CreateIndex
CREATE INDEX "accident_details_firNumber_idx" ON "accident_details"("firNumber");

-- CreateIndex
CREATE INDEX "vehicles_caseId_idx" ON "vehicles"("caseId");

-- CreateIndex
CREATE INDEX "vehicles_registrationNo_idx" ON "vehicles"("registrationNo");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_vehicleId_key" ON "drivers"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "owners_vehicleId_key" ON "owners"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_vehicleId_key" ON "insurance_policies"("vehicleId");

-- CreateIndex
CREATE INDEX "insurance_policies_policyNumber_idx" ON "insurance_policies"("policyNumber");

-- CreateIndex
CREATE INDEX "insurance_policies_policyExpiryDate_idx" ON "insurance_policies"("policyExpiryDate");

-- CreateIndex
CREATE INDEX "medical_details_caseId_idx" ON "medical_details"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "hearings_orderDocumentId_key" ON "hearings"("orderDocumentId");

-- CreateIndex
CREATE INDEX "hearings_caseId_idx" ON "hearings"("caseId");

-- CreateIndex
CREATE INDEX "hearings_hearingDate_idx" ON "hearings"("hearingDate");

-- CreateIndex
CREATE INDEX "hearings_status_idx" ON "hearings"("status");

-- CreateIndex
CREATE INDEX "documents_caseId_idx" ON "documents"("caseId");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE INDEX "documents_tags_idx" ON "documents" USING GIN ("tags");

-- CreateIndex
CREATE UNIQUE INDEX "fee_arrangements_caseId_key" ON "fee_arrangements"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_receiptNumber_key" ON "fee_payments"("receiptNumber");

-- CreateIndex
CREATE INDEX "fee_payments_feeId_idx" ON "fee_payments"("feeId");

-- CreateIndex
CREATE INDEX "fee_payments_paymentDate_idx" ON "fee_payments"("paymentDate");

-- CreateIndex
CREATE INDEX "compensation_estimates_caseId_idx" ON "compensation_estimates"("caseId");

-- CreateIndex
CREATE INDEX "activities_caseId_idx" ON "activities"("caseId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_dueAt_idx" ON "notifications"("dueAt");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "judges" ADD CONSTRAINT "judges_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_leadAdvocateId_fkey" FOREIGN KEY ("leadAdvocateId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignees" ADD CONSTRAINT "case_assignees_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_assignees" ADD CONSTRAINT "case_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_petitions" ADD CONSTRAINT "claim_petitions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claimants" ADD CONSTRAINT "claimants_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "victims" ADD CONSTRAINT "victims_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respondents" ADD CONSTRAINT "respondents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "respondents" ADD CONSTRAINT "respondents_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "witnesses" ADD CONSTRAINT "witnesses_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_details" ADD CONSTRAINT "accident_details_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_details" ADD CONSTRAINT "accident_details_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "police_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_policies" ADD CONSTRAINT "insurance_policies_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_details" ADD CONSTRAINT "medical_details_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_details" ADD CONSTRAINT "medical_details_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_orderDocumentId_fkey" FOREIGN KEY ("orderDocumentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hearings" ADD CONSTRAINT "hearings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_arrangements" ADD CONSTRAINT "fee_arrangements_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "fee_arrangements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compensation_estimates" ADD CONSTRAINT "compensation_estimates_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
