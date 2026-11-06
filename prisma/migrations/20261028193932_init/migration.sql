-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'accountant', 'chairman', 'admin', 'moderator', 'electrician');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'blocked', 'archived');

-- CreateEnum
CREATE TYPE "PhoneStatus" AS ENUM ('pending_confirmation', 'confirmed', 'disabled', 'archived');

-- CreateEnum
CREATE TYPE "MeteringType" AS ENUM ('single', 'dual');

-- CreateEnum
CREATE TYPE "MeterStatus" AS ENUM ('active', 'replaced', 'removed', 'under_check', 'inactive', 'faulty');

-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('submitted', 'verified', 'rejected', 'requires_check', 'pending');

-- CreateEnum
CREATE TYPE "ReadingSource" AS ENUM ('owner', 'admin', 'import', 'operator', 'system');

-- CreateEnum
CREATE TYPE "GarageStatus" AS ENUM ('active', 'archived', 'no_owner', 'disabled', 'inactive');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('owner', 'co_owner', 'tenant', 'family', 'other');

-- CreateEnum
CREATE TYPE "TariffType" AS ENUM ('single', 'dual');

-- CreateEnum
CREATE TYPE "TariffStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('electricity', 'debt_payment', 'debt_carryover', 'membership_fee', 'maintenance_fee', 'targeted_fee', 'penalty', 'adjustment');

-- CreateEnum
CREATE TYPE "ChargeSource" AS ENUM ('reading', 'average', 'norm', 'manual', 'adjustment', 'debt_carryover', 'debt_payment');

-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('pending', 'awaiting_payment', 'paid', 'overdue', 'cancelled', 'partial');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('yookassa', 'cloudpayments', 'sberbank', 'tinkoff', 'manual', 'other');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'canceled');

-- CreateEnum
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('created', 'pending', 'processing', 'succeeded', 'failed', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('surcharge', 'refund', 'transfer', 'reading_fix', 'tariff_fix', 'recalculation', 'correction', 'discount', 'penalty', 'write_off');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('general_meeting', 'board_report', 'board_decision', 'announcement', 'other');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'active', 'repealed');

-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('important', 'electricity', 'documents', 'meetings', 'improvement', 'announcements', 'other');

-- CreateEnum
CREATE TYPE "NewsPriority" AS ENUM ('normal', 'important', 'urgent');

-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('draft', 'scheduled', 'published', 'archived', 'unpublished');

-- CreateEnum
CREATE TYPE "AppealTopic" AS ENUM ('access', 'metering', 'payment', 'negative_reading', 'meter_replacement', 'other');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('new', 'in_progress', 'resolved', 'rejected');

-- CreateEnum
CREATE TYPE "AdCategory" AS ENUM ('parts_sale', 'parts_buy', 'services', 'rent', 'other');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('draft', 'pending', 'published', 'rejected', 'archived');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('sms', 'email', 'push', 'internal');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "ImportType" AS ENUM ('garages', 'owners', 'owner_garage', 'meters', 'debts');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('uploaded', 'processing', 'preview', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ImportRowStatus" AS ENUM ('success', 'error', 'warning', 'skipped');

-- CreateEnum
CREATE TYPE "ProblemType" AS ENUM ('negative_reading_attempts', 'no_readings_multiple_periods', 'repeated_payment_failures', 'other');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('new', 'in_progress', 'resolved', 'ignored');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "password_hash" TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_phones" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "PhoneStatus" NOT NULL DEFAULT 'pending_confirmation',
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_phones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owners" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garages" (
    "id" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "GarageStatus" NOT NULL DEFAULT 'active',
    "area_sqm" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_garage" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "ownership_type" "OwnershipType" NOT NULL,
    "share" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "owner_garage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meters" (
    "id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "metering_type" "MeteringType" NOT NULL,
    "initial_reading_t1" DECIMAL(12,2) NOT NULL,
    "initial_reading_t2" DECIMAL(12,2),
    "initial_reading_date" TIMESTAMP(3) NOT NULL,
    "installed_at" TIMESTAMP(3),
    "removed_at" TIMESTAMP(3),
    "status" "MeterStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readings" (
    "id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "reading_t1" DECIMAL(12,2) NOT NULL,
    "reading_t2" DECIMAL(12,2),
    "photo_url" TEXT,
    "source" "ReadingSource" NOT NULL DEFAULT 'owner',
    "status" "ReadingStatus" NOT NULL DEFAULT 'submitted',
    "is_first" BOOLEAN NOT NULL DEFAULT false,
    "submitted_by_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_attempts" (
    "id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,
    "entered_t1" DECIMAL(12,2) NOT NULL,
    "entered_t2" DECIMAL(12,2),
    "previous_t1" DECIMAL(12,2) NOT NULL,
    "previous_t2" DECIMAL(12,2),
    "calculated_consumption" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "resolution" TEXT,
    "appeal_id" TEXT,
    "corrected_reading_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reading_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariff_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payment_type" "PaymentType" NOT NULL DEFAULT 'electricity',
    "tariff_type" "TariffType" NOT NULL,
    "price_t1" DECIMAL(10,2) NOT NULL,
    "price_t2" DECIMAL(10,2),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "status" "TariffStatus" NOT NULL DEFAULT 'draft',
    "document_id" TEXT,
    "created_by_id" TEXT,
    "replaces_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tariff_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "meter_id" TEXT,
    "reading_id" TEXT,
    "period" TIMESTAMP(3) NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "consumption_t1" DECIMAL(12,2),
    "consumption_t2" DECIMAL(12,2),
    "tariff_t1" DECIMAL(10,2),
    "tariff_t2" DECIMAL(10,2),
    "amount" DECIMAL(12,2) NOT NULL,
    "tariff_set_id" TEXT,
    "source" "ChargeSource" NOT NULL,
    "is_provisional" BOOLEAN NOT NULL DEFAULT false,
    "recalculated_at" TIMESTAMP(3),
    "recalculated_by_reading_id" TEXT,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "attempt_in_progress" BOOLEAN NOT NULL DEFAULT false,
    "last_attempt_at" TIMESTAMP(3),
    "status" "ChargeStatus" NOT NULL DEFAULT 'pending',
    "previous_reading_id" TEXT,
    "previous_reading_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "charge_id" TEXT,
    "user_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_type" "PaymentType" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_payment_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_attempts" (
    "id" TEXT NOT NULL,
    "charge_id" TEXT,
    "user_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "idempotency_key" TEXT,
    "provider_payment_id" TEXT,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'created',
    "webhook_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "charge_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "charge_id" TEXT,
    "user_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjustments" (
    "id" TEXT NOT NULL,
    "charge_id" TEXT,
    "payment_id" TEXT,
    "type" "AdjustmentType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "period" TIMESTAMP(3),
    "author_id" TEXT,
    "document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_balances" (
    "owner_id" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "debt_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pending_refund_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last_charge_at" TIMESTAMP(3),
    "last_payment_at" TIMESTAMP(3),
    "last_reconciled_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owner_balances_pkey" PRIMARY KEY ("owner_id")
);

-- CreateTable
CREATE TABLE "garage_balances" (
    "garage_id" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "debt_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advance_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garage_balances_pkey" PRIMARY KEY ("garage_id")
);

-- CreateTable
CREATE TABLE "debt_settlements" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "months" INTEGER NOT NULL,
    "monthly_amount" DECIMAL(12,2) NOT NULL,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(12,2) NOT NULL,
    "start_period" TIMESTAMP(3) NOT NULL,
    "end_period" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "document_id" TEXT,
    "owner_consent_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_settlement_payments" (
    "id" TEXT NOT NULL,
    "settlement_id" TEXT NOT NULL,
    "period" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "charge_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "debt_settlement_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "debt_settlement_proposals" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "total_debt" DECIMAL(12,2) NOT NULL,
    "proposed_months" INTEGER NOT NULL,
    "proposed_monthly_amount" DECIMAL(12,2) NOT NULL,
    "proposed_start_period" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "board_decision_document_id" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "debt_settlement_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "card_details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "provider_refund_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "request_id" TEXT,
    "payment_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_refund_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "created_by_id" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_debts" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "period_from" TIMESTAMP(3) NOT NULL,
    "period_to" TIMESTAMP(3) NOT NULL,
    "court_case_number" TEXT,
    "court_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pre_trial',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_debts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "number" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'draft',
    "adopted_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "pdf_url" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "replaces_document_id" TEXT,
    "published_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "priority" "NewsPriority" NOT NULL DEFAULT 'normal',
    "status" "NewsStatus" NOT NULL DEFAULT 'draft',
    "requires_acknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "cover_url" TEXT,
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_acknowledgements" (
    "id" TEXT NOT NULL,
    "news_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "acknowledged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "AdCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "price" DECIMAL(12,2),
    "price_negotiable" BOOLEAN NOT NULL DEFAULT false,
    "contact_phone" TEXT,
    "contact_method" TEXT,
    "status" "AdStatus" NOT NULL DEFAULT 'draft',
    "moderation_comment" TEXT,
    "moderated_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_photos" (
    "id" TEXT NOT NULL,
    "ad_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "topic" "AppealTopic" NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "status" "AppealStatus" NOT NULL DEFAULT 'new',
    "assigned_to_id" TEXT,
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "template_code" TEXT,
    "payload" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'queued',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "type" "ImportType" NOT NULL,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "status" "ImportStatus" NOT NULL DEFAULT 'uploaded',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "warning_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "uploaded_by_id" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "confirmed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_rows" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_data" JSONB,
    "parsed_data" JSONB,
    "status" "ImportRowStatus" NOT NULL,
    "error_message" TEXT,
    "error_field" TEXT,
    "entity_id" TEXT,
    "entity_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problem_garages" (
    "id" TEXT NOT NULL,
    "garage_id" TEXT NOT NULL,
    "type" "ProblemType" NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "details" JSONB,
    "status" "ProblemStatus" NOT NULL DEFAULT 'new',
    "assigned_to_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problem_garages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooperative_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'ГСК «Контакт»',
    "address" TEXT,
    "inn" TEXT,
    "ogrn" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "chairman_user_id" TEXT,
    "average_months" INTEGER NOT NULL DEFAULT 3,
    "norm_kwh_per_month" DECIMAL(10,2) NOT NULL DEFAULT 200,
    "max_months_without_readings" INTEGER NOT NULL DEFAULT 3,
    "reading_period_start_day" INTEGER NOT NULL DEFAULT 25,
    "reading_period_end_day" INTEGER NOT NULL DEFAULT 5,
    "payment_due_days" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cooperative_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "user_phones_phone_key" ON "user_phones"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "owners_user_id_key" ON "owners"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "garages_block_row_number_key" ON "garages"("block", "row", "number");

-- CreateIndex
CREATE UNIQUE INDEX "meters_serial_number_key" ON "meters"("serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "readings_meter_id_period_key" ON "readings"("meter_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "charges_garage_id_period_payment_type_key" ON "charges"("garage_id", "period", "payment_type");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_attempts_idempotency_key_key" ON "payment_attempts"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_number_key" ON "receipts"("number");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_provider_refund_id_key" ON "refunds"("provider_refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "news_acknowledgements_news_id_user_id_key" ON "news_acknowledgements"("news_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_codes_phone_key" ON "auth_codes"("phone");

-- AddForeignKey
ALTER TABLE "user_phones" ADD CONSTRAINT "user_phones_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_garage" ADD CONSTRAINT "owner_garage_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_garage" ADD CONSTRAINT "owner_garage_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meters" ADD CONSTRAINT "meters_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readings" ADD CONSTRAINT "readings_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "meters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "readings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_balances" ADD CONSTRAINT "owner_balances_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garage_balances" ADD CONSTRAINT "garage_balances_garage_id_fkey" FOREIGN KEY ("garage_id") REFERENCES "garages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_acknowledgements" ADD CONSTRAINT "news_acknowledgements_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ad_photos" ADD CONSTRAINT "ad_photos_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "import_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
