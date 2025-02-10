export declare class User {
    id: string;
    userId: string;
    password: string;
    name: string;
    idType: string;
    idValue: string;
    type: string;
    encryptIdValue(): Promise<void>;
}
