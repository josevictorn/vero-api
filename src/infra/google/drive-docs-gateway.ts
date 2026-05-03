export interface CopyTemplateAndReplaceInput {
	accessToken: string;
	documentName: string;
	folderId?: string;
	replacements: Record<string, string>;
	templateId?: string;
}

export interface CopyTemplateAndReplaceResult {
	documentId: string;
	documentUrl: string;
}

export interface DriveDocsGateway {
	copyTemplateAndReplace(
		input: CopyTemplateAndReplaceInput
	): Promise<CopyTemplateAndReplaceResult>;
}
