-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'LAWYER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW_LEAD', 'INTERVIEWING', 'FORWARDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AiSessionStatus" AS ENUM ('IDENTIFYING', 'INTERVIEWING', 'FORWARDED', 'BOOKING', 'BOOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ASSISTANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
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
CREATE TABLE "lawyers" (
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
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "name" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "email" TEXT,
    "lead_status" "LeadStatus" NOT NULL DEFAULT 'NEW_LEAD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
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
CREATE TABLE "screening_flows" (
    "id" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screening_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_calendar_connections" (
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
CREATE TABLE "calendar_events" (
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
CREATE TABLE "ai_sessions" (
    "id" TEXT NOT NULL,
    "screening_flow_id" TEXT,
    "lead_id" TEXT,
    "chat_id" TEXT NOT NULL,
    "status" "AiSessionStatus" NOT NULL DEFAULT 'IDENTIFYING',
    "chat_state" JSONB NOT NULL,
    "name" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "is_third_party" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_analyses" (
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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_cnpj_key" ON "workspaces"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "lawyers_user_id_key" ON "lawyers"("user_id");

-- CreateIndex
CREATE INDEX "leads_workspace_id_idx" ON "leads"("workspace_id");

-- CreateIndex
CREATE INDEX "leads_lawyer_id_idx" ON "leads"("lawyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_createdFromLeadId_key" ON "clients"("createdFromLeadId");

-- CreateIndex
CREATE INDEX "clients_workspace_id_idx" ON "clients"("workspace_id");

-- CreateIndex
CREATE INDEX "clients_lawyer_id_idx" ON "clients"("lawyer_id");

-- CreateIndex
CREATE UNIQUE INDEX "google_calendar_connections_user_id_key" ON "google_calendar_connections"("user_id");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_idx" ON "calendar_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_user_id_google_event_id_key" ON "calendar_events"("user_id", "google_event_id");

-- AddForeignKey
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lawyers" ADD CONSTRAINT "lawyers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdFromLeadId_fkey" FOREIGN KEY ("createdFromLeadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "google_calendar_connections" ADD CONSTRAINT "google_calendar_connections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_sessions" ADD CONSTRAINT "ai_sessions_screening_flow_id_fkey" FOREIGN KEY ("screening_flow_id") REFERENCES "screening_flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_analyses" ADD CONSTRAINT "case_analyses_ai_session_id_fkey" FOREIGN KEY ("ai_session_id") REFERENCES "ai_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_analyses" ADD CONSTRAINT "case_analyses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
