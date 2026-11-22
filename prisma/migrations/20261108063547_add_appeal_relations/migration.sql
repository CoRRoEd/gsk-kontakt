-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
