export interface GoogleUser {
    email: string;
    name: string;
    picture: string;
    dataLink?: string;
}

export interface SpreadsheetRow {
    email: string;
    dataLink: string;
    [key: string]: string;
}

export interface ServerSession {
    user: GoogleUser | null;
    token: string | null;
} 