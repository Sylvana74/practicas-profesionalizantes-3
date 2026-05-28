import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

// Cargamos la configuración global
const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

// ÚNICA RESPONSABILIDAD: Crear y exportar la conexión a la base de datos
export const db = new DatabaseSync(resolve(config.database.path));