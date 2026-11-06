-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "receipt_url" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_charge_id_fkey" FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
