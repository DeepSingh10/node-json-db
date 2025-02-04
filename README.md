# node-json-db-manager

A lightweight, file-based JSON database with optional encryption, supporting basic CRUD operations and password protection.

## Features
- **Lightweight & Simple**: No external dependencies, just a JSON file as your database.
- **Encryption Support**: Secure your data with AES-256-GCM encryption.
- **CRUD Operations**: Insert, find, update, and delete documents easily.
- **File-Based Storage**: Data is stored in a JSON file, making it easy to manage.
- **Password Protection**: Optionally lock/unlock your database with a password.

## Installation

```sh
npm install node-json-db-manager
```

## Usage

### Importing the Library

```javascript
import JsonDB from "node-json-db-manager"
```

### Creating a Database Instance

```javascript
const db = new JsonDB("database.json");
```

With encryption:

```javascript
const db = new JsonDB("database.json", { password: "securepassword" });
```

### Insert Data

```javascript
db.insert({ name: "Alice", age: 25 });
```

### Find Data

```javascript
const results = db.find({ name: "Alice" });
console.log(results);
```

### Update Data

```javascript
const updatedUser = db.update(1701234567890, { age: 26 });
console.log(updatedUser);
```

### Delete Data

```javascript
const success = db.delete(1701234567890);
console.log(success ? "Deleted successfully" : "No record found");
```

### Change Password

```javascript
db.changePassword({ oldPassword: "securepassword", newPassword: "newpassword123" });
```

## API Reference

### `new JsonDB(dbFile: string, options?: JsonDBOptions)`
Creates a new database instance.
- `dbFile`: Path to the database file.
- `options`: Optional settings:
  - `password` (string): Encrypts the database with a password.
  - `iterations` (number): PBKDF2 iterations (default: `100000`).
  - `digest` (string): PBKDF2 digest algorithm (default: `sha256`).
  - `algorithm` (string): Encryption algorithm (default: `aes-256-gcm`).

### `insert(document: object): object`
Inserts a new document and returns it with an auto-generated `id`.

### `find(query?: object): object[]`
Finds documents that match the query.

### `update(id: number, updates: object): object | undefined`
Updates a document by `id` and returns the updated document.

### `delete(id: number): boolean`
Deletes a document by `id` and returns `true` if deleted, `false` otherwise.

### `changePassword(payload: { oldPassword: string, newPassword: string })`
Changes the encryption password.

## License

MIT License © 2024 node-json-db-manager

