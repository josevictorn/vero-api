-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cellphone" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "lawyer_id" TEXT,
    "createdFromLeadId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_createdFromLeadId_key" ON "clients"("createdFromLeadId");

-- CreateIndex
CREATE INDEX "clients_workspace_id_idx" ON "clients"("workspace_id");

-- CreateIndex
CREATE INDEX "clients_lawyer_id_idx" ON "clients"("lawyer_id");

-- CreateIndex
CREATE INDEX "leads_workspace_id_idx" ON "leads"("workspace_id");

-- CreateIndex
CREATE INDEX "leads_lawyer_id_idx" ON "leads"("lawyer_id");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_lawyer_id_fkey" FOREIGN KEY ("lawyer_id") REFERENCES "lawyers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_createdFromLeadId_fkey" FOREIGN KEY ("createdFromLeadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
