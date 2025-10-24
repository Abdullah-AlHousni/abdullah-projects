-- CreateEnum
CREATE TYPE "FactCheckStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "FactCheckVerdict" AS ENUM ('VERIFIED', 'DISPUTED', 'NEEDS_CONTEXT', 'INSUFFICIENT_EVIDENCE');

-- CreateTable
CREATE TABLE "FactCheck" (
    "id" TEXT NOT NULL,
    "chirpId" TEXT NOT NULL,
    "status" "FactCheckStatus" NOT NULL DEFAULT 'PENDING',
    "verdict" "FactCheckVerdict",
    "confidence" DOUBLE PRECISION,
    "summary" TEXT,
    "citationsJson" JSONB,
    "checkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FactCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FactCheck_chirpId_key" ON "FactCheck"("chirpId");

-- AddForeignKey
ALTER TABLE "FactCheck" ADD CONSTRAINT "FactCheck_chirpId_fkey" FOREIGN KEY ("chirpId") REFERENCES "Chirp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
