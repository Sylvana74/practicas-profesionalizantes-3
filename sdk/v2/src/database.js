import { DatabaseSync } from 'node:sqlite';

// Conectamos a la base de datos 
const db = new DatabaseSync('./db.sqlite3');

// Creamos las tablas si no existen (estructura básica)
db.exec(`
    CREATE TABLE IF NOT EXISTS grupos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT);
    CREATE TABLE IF NOT EXISTS permisos (id_grupo INTEGER, id_endpoint INTEGER);
    CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, id_grupo INTEGER);
    CREATE TABLE IF NOT EXISTS endpoints (id INTEGER PRIMARY KEY AUTOINCREMENT, ruta TEXT, metodo TEXT);
`);

export { db };