export class CaseAnalysisNotFoundError extends Error {
    constructor(identifier: string) {
        super(`Case analysis "${identifier}" not found.`);
    }
}