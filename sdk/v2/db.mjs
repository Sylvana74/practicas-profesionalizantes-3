import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

export const db = new DatabaseSync(resolve(config.database.path));