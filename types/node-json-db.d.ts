declare module "node-json-db" {
    export interface JsonDBOptions {
      password?: string;
      iterations?: number;
      digest?: string;
      algorithm?: string;
    }
  
    export interface Document {
      id?: number;
      [key: string]: any;
    }
  
    export interface ChangePasswordPayload {
      oldPassword: string;
      newPassword: string;
    }
  
    class JsonDB {
      constructor(dbFile: string, options?: JsonDBOptions);
      insert(document: Document): Document;
      find(query?: Partial<Document>): Document[];
      update(id: number, updates: Partial<Document>): Document | undefined;
      delete(id: number): boolean;
      changePassword(payload: ChangePasswordPayload): void;
    }
  
    export default JsonDB;
  }
  