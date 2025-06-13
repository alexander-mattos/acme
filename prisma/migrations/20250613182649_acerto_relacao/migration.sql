-- DropIndex
DROP INDEX "invoices_status_key";

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'pending';
