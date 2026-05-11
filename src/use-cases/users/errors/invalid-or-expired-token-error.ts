export class InvalidOrExpiredToken extends Error {
    constructor() {
        super("Token is invalid or has expired.");
    }
}
