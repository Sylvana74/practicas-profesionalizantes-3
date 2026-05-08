import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

// Cargamos la configuración
const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

// Exportamos la conexión directamente
export const db = new DatabaseSync(resolve(config.database.path));

// ... (el resto de tus funciones: user_create, user_login, etc.)

// ALTA: Crear un nuevo usuario
export async function user_create(username, password) {
    const sql = "INSERT INTO user (username, password) VALUES (?, ?)";
    const stmt = db.prepare(sql);
    return stmt.run(username, password);
}

// LOGIN: Validar credenciales (La que te faltaba)
export async function user_login(username, password) {
    const sql = "SELECT id, username FROM user WHERE username = ? AND password = ?";
    const stmt = db.prepare(sql);
    return stmt.get(username, password);
}

// GESTIÓN DE PERMISOS: Verificar si el usuario tiene acceso a una ruta
export async function user_has_access(userId, path) {
    const sql = `
        SELECT 1 FROM access a
        JOIN members m ON a.id_group = m.id_group
        JOIN endpoint e ON a.id_endpoint = e.id
        WHERE m.id_user = ? AND e.path = ?
    `;
    const stmt = db.prepare(sql);
    const result = stmt.get(userId, path);
    return result !== undefined;
}

// BAJA: Eliminar un usuario
export async function user_delete(id) {
    const sql = "DELETE FROM user WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(id);
}

// MODIFICACIÓN: Actualizar contraseña
export async function user_update(id, newPassword) {
    const sql = "UPDATE user SET password = ? WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(newPassword, id);
}