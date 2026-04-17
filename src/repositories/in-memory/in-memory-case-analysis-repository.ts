import { randomUUID } from "node:crypto";
import type { CaseAnalysis, Prisma } from "@generated/prisma/client";
import type { CaseAnalysisRepository } from "@/repositories/case-analysis-repository";
import { ITEM_PER_PAGE } from "@/utils/constants";
import type { PaginationParams } from "@/utils/pagination-params";

export class InMemoryCaseAnalysisRepository implements CaseAnalysisRepository {
	private items: CaseAnalysis[] = [];

	async findById(id: string) {
		const caseAnalysis = this.items.find((item) => item.id === id);

		if (!caseAnalysis) {
			return null;
		}

		return caseAnalysis;
	}

	async create(data: Prisma.CaseAnalysisUncheckedCreateInput) {
		const caseAnalysis: CaseAnalysis = {
			id: randomUUID(),
			aiSessionId: data.aiSessionId,
			leadId: data.leadId,
			title: data.title,
			viabilityLabel: data.viabilityLabel,
			analysisText: data.analysisText,
			estimatedComplexity: data.estimatedComplexity,
			mainLegalBase: data.mainLegalBase,
			createdAt: new Date(),
		};

		this.items.push(caseAnalysis);

		return caseAnalysis;
	}

	async findMany(params: PaginationParams) {
		const caseAnalyses = this.items.slice(
			(params.page - 1) * ITEM_PER_PAGE,
			params.page * ITEM_PER_PAGE
		);

		return {
			items: caseAnalyses,
			total: this.items.length,
		};
	}

	async save(data: CaseAnalysis) {
		const index = this.items.findIndex((item) => item.id === data.id);

		if (index >= 0) {
			this.items[index] = data;
		}

		return data;
	}

	async delete(id: string) {
		this.items = this.items.filter((item) => item.id !== id);
	}
}
