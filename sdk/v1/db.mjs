import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

let db;

export function connect_db(path) {
    const dbPath = resolve(path);
    db = new DatabaseSync(dbPath);
    return db;
}

export async function createUser(username, password) {
    const sql = "INSERT INTO user (username, password) VALUES (?, ?) RETURNING id";
    const stmt = db.prepare(sql);
    const row = stmt.get(username, password);
    return {
        id: row.id,
        username: username,
        password: password
    };
}