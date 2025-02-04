import { existsSync, writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import {
  randomBytes,
  pbkdf2Sync,
  createCipheriv,
  createDecipheriv,
} from "crypto";

class JsonDB {
  /**
   * @param {string} dbFile - Path to the database file.
   * @param {object} [options] - Optional settings.
   * @param {string} [options.password] - A password to lock/unlock the db file.
   * @param {number} [options.iterations=100000] - Iterations for PBKDF2 key derivation.
   * @param {string} [options.digest='sha256'] - Digest algorithm for PBKDF2.
   * @param {string} [options.algorithm='aes-256-gcm'] - Encryption algorithm.
   */
  constructor(dbFile, options = {}) {
    this.dbFile = resolve(dbFile);
    this.password = options.password || null;
    this.iterations = options.iterations || 100000;
    this.digest = options.digest || "sha256";
    this.algorithm = options.algorithm || "aes-256-gcm";

    // Initialize file if it doesn't exist.
    if (!existsSync(this.dbFile)) {
      const initialData = JSON.stringify([]);
      if (this.password) {
        const salt = randomBytes(16).toString("hex");
        const key = this._deriveKey(this.password, salt);
        const encrypted = this._encryptWithKey(initialData, key);
        // File format: salt:iv:authTag:ciphertext
        const dataToStore = salt + ":" + encrypted;
        writeFileSync(this.dbFile, dataToStore);
      } else {
        writeFileSync(this.dbFile, initialData);
      }
    }
  }

  // Derives a 32-byte key using PBKDF2 from the password and salt.
  _deriveKey(password, salt) {
    return pbkdf2Sync(password, salt, this.iterations, 32, this.digest);
  }

  // Encrypts text using AES-256-GCM with the provided key.
  // Returns a string in the format: iv:authTag:ciphertext (all hex encoded).
  _encryptWithKey(text, key) {
    const iv = randomBytes(12); // 12-byte IV for GCM.
    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();
    return (
      iv.toString("hex") +
      ":" +
      authTag.toString("hex") +
      ":" +
      encrypted.toString("hex")
    );
  }

  // Decrypts text using AES-256-GCM with the provided key.
  // Expects the encryptedText format: iv:authTag:ciphertext.
  _decryptWithKey(encryptedText, key) {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const ciphertext = Buffer.from(parts[2], "hex");
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, undefined, "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  // Reads and decrypts the database file.
  _readDB() {
    let fileData = readFileSync(this.dbFile, "utf-8");
    if (this.password) {
      // File format: salt:iv:authTag:ciphertext.
      const firstColon = fileData.indexOf(":");
      if (firstColon === -1) throw new Error("Invalid file format");
      const salt = fileData.substring(0, firstColon);
      const encryptedPart = fileData.substring(firstColon + 1); // iv:authTag:ciphertext.
      const key = this._deriveKey(this.password, salt);
      fileData = this._decryptWithKey(encryptedPart, key);
    }
    return JSON.parse(fileData);
  }

  // Encrypts and writes the database file.
  _writeDB(data) {
    let stringData = JSON.stringify(data, null, 2);
    if (this.password) {
      // When writing, always generate a new salt for extra security.
      const salt = randomBytes(16).toString("hex");
      const key = this._deriveKey(this.password, salt);
      const encrypted = this._encryptWithKey(stringData, key);
      const dataToStore = salt + ":" + encrypted;
      writeFileSync(this.dbFile, dataToStore);
    } else {
      writeFileSync(this.dbFile, stringData);
    }
  }

  // Insert a new document.
  insert(document) {
    const db = this._readDB();
    document.id = Date.now(); // Simple unique ID.
    db.push(document);
    this._writeDB(db);
    return document;
  }

  // Find documents by query.
  find(query = {}) {
    const db = this._readDB();
    return db.filter((doc) =>
      Object.keys(query).every((key) => doc[key] === query[key])
    );
  }

  // Update a document by ID.
  update(id, updates) {
    let db = this._readDB();
    db = db.map((doc) => (doc.id === id ? { ...doc, ...updates } : doc));
    this._writeDB(db);
    return db.find((doc) => doc.id === id);
  }

  // Delete a document by ID.
  delete(id) {
    let db = this._readDB();
    const newDB = db.filter((doc) => doc.id !== id);
    this._writeDB(newDB);
    return db.length !== newDB.length;
  }

  /**
   * Change the password for accessing the database.
   * This method will:
   * 1. Decrypt the current data using the old password.
   * 2. Re-encrypt the data using the new password with a new salt.
   *
   * @param {string} oldPassword - The current password.
   * @param {string} newPassword - The new password to set.
   */
  changePassword(payload) {
    // Temporarily switch to the old password to read the data.
    const oldPassword = payload?.oldPassword;
    const newPassword = payload?.newPassword;
    const currentPassword = this.password;
    this.password = oldPassword;
    let data;
    try {
      data = this._readDB();
    } catch (err) {
      // Restore the original password if decryption fails.
      this.password = currentPassword;
      throw new Error("Invalid old password. Password change aborted.");
    }
    // Set the new password and re-encrypt the data.
    this.password = newPassword;
    this._writeDB(data);
  }
}

export default JsonDB;
