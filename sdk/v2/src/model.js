import { db } from './database.js';

// --- USUARIOS ---
export function crearUsuario(username, password) {
    const stmt = db.prepare('INSERT INTO usuarios (username, password) VALUES (?, ?)');
    stmt.run(username, password);
}
export function editarUsuario(id, username, password) {
    const stmt = db.prepare('UPDATE usuarios SET username = ?, password = ? WHERE id = ?');
    stmt.run(username, password, id);
}
export function borrarUsuario(id) {
    const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
    stmt.run(id);
}

// --- GRUPOS ---
export function crearGrupo(nombre) {
    const stmt = db.prepare('INSERT INTO grupos (nombre) VALUES (?)');
    stmt.run(nombre);
}
export function obtenerGrupos() {
    const stmt = db.prepare('SELECT * FROM grupos');
    return stmt.all();
}
export function borrarGrupo(id) {
    const stmt = db.prepare('DELETE FROM grupos WHERE id = ?');
    stmt.run(id);
}

// --- PERMISOS / ENDPOINTS ---
export function crearPermiso(id_grupo, id_endpoint) {
    const stmt = db.prepare('INSERT INTO permisos (id_grupo, id_endpoint) VALUES (?, ?)');
    stmt.run(id_grupo, id_endpoint);
}
export function crearEndpoint(ruta) {
    const stmt = db.prepare('INSERT INTO endpoints (ruta) VALUES (?)');
    stmt.run(ruta);
}
export function borrarEndpoint(id) {
    const stmt = db.prepare('DELETE FROM endpoints WHERE id = ?');
    stmt.run(id);
}
export function asignarPermiso(id_group, id_endpoint) {
    const stmt = db.prepare('INSERT INTO permisos (id_grupo, id_endpoint) VALUES (?, ?)');
    stmt.run(id_group, id_endpoint);
}
export function revocarPermiso(id_group, id_endpoint) {
    const stmt = db.prepare('DELETE FROM permisos WHERE id_grupo = ? AND id_endpoint = ?');
    stmt.run(id_group, id_endpoint);
}

// --- AUTH ---
export function login(username, password) {
    const stmt = db.prepare('SELECT * FROM usuarios WHERE username = ? AND password = ?');
    return stmt.get(username, password);
}