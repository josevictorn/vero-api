-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "vero";

-- CreateEnum
CREATE TYPE "vero"."Role" AS ENUM ('ADMIN', 'LAWYER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "vero"."LeadStatus" AS ENUM ('NEW_LEAD', 'INTERVIEWING', 'FORWARDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "vero"."AiSessionStatus" AS ENUM ('IDENTIFYING', 'INTERVIEWING', 'FORWARDED', 'BOOKING', 'BOOKED');

-- CreateTable
CREATE TABLE "vero"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "vero"."Role" NOT NULL DEFAULT 'ASSISTANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."lawyers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "oab" TEXT NOT NULL,
    "oab_state" TEXT NOT NULL,
    "pix_advogado" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lawyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."leads" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "name" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "email" TEXT,
    "lead_status" "vero"."LeadStatus" NOT NULL DEFAULT 'NEW_LEAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "marital_status" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "issuing_agency" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "createdFromLeadId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."screening_flows" (
    "id" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screening_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."google_calendar_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_email" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."calendar_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "google_event_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "hangout_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."ai_sessions" (
    "id" TEXT NOT NULL,
    "screening_flow_id" TEXT,
    "lead_id" TEXT,
    "chat_id" TEXT NOT NULL,
    "status" "vero"."AiSessionStatus" NOT NULL DEFAULT 'IDENTIFYING',
    "chat_state" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "is_third_party" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."case_analyses" (
    "id" TEXT NOT NULL,
    "ai_session_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "viability_label" TEXT NOT NULL,
    "analysis_text" TEXT NOT NULL,
    "estimated_complexity" TEXT NOT NULL,
    "main_legal_base" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vero"."password_reset_token" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "vero"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_cnpj_key" ON "vero"."workspaces"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_user_id_key" ON "vero"."lawyers"("user_id");

-- CreateIndex
CREATE INDEX "leads_workspace_id_idx" ON "vero"."leads"("workspace_id");

-- CreateIndex
CREATE INDEX "leads_lawyer_id_idx" ON "vero"."leads"("lawyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_createdFromLeadId_key" ON "vero"."clients"("createdFromLeadId");

-- CreateIndex
CREATE INDEX "clients_workspace_id_idx" ON "vero"."clients"("workspace_id");

-- CreateIndex
CREATE INDEX "clients_lawyer_id_idx" ON "vero"."clients"("lawyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_connections_user_id_key" ON "vero"."google_calendar_connections"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "vero"."calendar_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_user_id_google_event_id_key" ON "vero"."calendar_events"("user_id", "google_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "vero"."password_reset_token"("token");

-- CreateIndex
CREATE INDEX "password_reset_token_user_id_idx" ON "vero"."password_reset_token"("user_id");

-- AddForeignKey
ALTER TABLE "vero"."lawyers" ADD CONSTRAINT "lawyers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vero"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."lawyers" ADD CONSTRAINT "lawyers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "vero"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."leads" ADD CONSTRAINT "leads_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "vero"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."leads" ADD CONSTRAINT "leads_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "vero"."lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "vero"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."clients" ADD CONSTRAINT "clients_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "vero"."lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."clients" ADD CONSTRAINT "clients_createdFromLeadId_fkey" FOREIGN KEY ("createdFromLeadId") REFERENCES "vero"."leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vero"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vero"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."ai_sessions" ADD CONSTRAINT "ai_sessions_screening_flow_id_fkey" FOREIGN KEY ("screening_flow_id") REFERENCES "vero"."screening_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."case_analyses" ADD CONSTRAINT "case_analyses_ai_session_id_fkey" FOREIGN KEY ("ai_session_id") REFERENCES "vero"."ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."case_analyses" ADD CONSTRAINT "case_analyses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "vero"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vero"."password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "vero"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
