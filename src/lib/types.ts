export interface GoogleUser {
    email: string;
    name: string;
    picture: string;
}

export interface SpreadsheetRow {
    email: string;
    dataLink: string;
    [key: string]: string;
} 