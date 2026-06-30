-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('COURT_FEE', 'PROCESS_FEE', 'TRAVEL', 'PHOTOCOPY', 'POSTAGE', 'STAMP_PAPER', 'EXPERT_FEE', 'CLERICAL', 'MISC');

-- CreateTable
CREATE TABLE "case_expenses" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'MISC',
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isReimbursable" BOOLEAN NOT NULL DEFAULT true,
    "reimbursed" BOOLEAN NOT NULL DEFAULT false,
    "receiptRef" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_expenses_caseId_idx" ON "case_expenses"("caseId");

-- CreateIndex
CREATE INDEX "case_expenses_expenseDate_idx" ON "case_expenses"("expenseDate");

-- AddForeignKey
ALTER TABLE "case_expenses" ADD CONSTRAINT "case_expenses_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_expenses" ADD CONSTRAINT "case_expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
