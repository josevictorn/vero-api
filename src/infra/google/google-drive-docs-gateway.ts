import { google } from "googleapis";
import { env } from "@/env";
import type {
	CopyTemplateAndReplaceInput,
	CopyTemplateAndReplaceResult,
	DriveDocsGateway,
} from "./drive-docs-gateway";

export class GoogleDriveDocsGateway implements DriveDocsGateway {
	async copyTemplateAndReplace(
		input: CopyTemplateAndReplaceInput
	): Promise<CopyTemplateAndReplaceResult> {
		const authClient = this.getOAuthClient(input.accessToken);
		const drive = google.drive({ version: "v3", auth: authClient });
		const docs = google.docs({ version: "v1", auth: authClient });

		const templateId = input.templateId ?? env.GOOGLE_TEMPLATE_ID;
		const folderId = input.folderId ?? env.GOOGLE_FOLDER_ID;

		const copyResponse = await drive.files.copy({
			fileId: templateId,
			requestBody: {
				name: input.documentName,
				parents: [folderId],
			},
			fields: "id, webViewLink",
		});

		const documentId = copyResponse.data.id;

		if (!documentId) {
			throw new Error("Google Docs template copy failed.");
		}

		const requests = Object.entries(input.replacements)
			.filter(([key, value]) => key.trim().length > 0 && value !== undefined)
			.map(([key, value]) => ({
				replaceAllText: {
					containsText: {
						text: `{${key}}`,
						matchCase: true,
					},
					replaceText: String(value ?? ""),
				},
			}));

		if (requests.length > 0) {
			try {
				await docs.documents.batchUpdate({
					documentId,
					requestBody: {
						requests,
					},
				});
			} catch (error) {
				const details = error instanceof Error ? error.message : String(error);
				throw new Error(`Google Docs batch update failed: ${details}`);
			}
		}

		const documentUrl =
			copyResponse.data.webViewLink ??
			`https://docs.google.com/document/d/${documentId}`;

		return {
			documentId,
			documentUrl,
		};
	}

	private getOAuthClient(accessToken: string) {
		const client = new google.auth.OAuth2(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			env.GOOGLE_OAUTH_REDIRECT_URI
		);
		client.setCredentials({ access_token: accessToken });
		return client;
	}
}
