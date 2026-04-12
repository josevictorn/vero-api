-- CreateTable
CREATE TABLE "screening_flows" (
    "id" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screening_flows_pkey" PRIMARY KEY ("id")
);
