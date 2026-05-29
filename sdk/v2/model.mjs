import { db } from './db.mjs';


export function userCreate(username, password) {
    const sql = "INSERT INTO user (username, password) VALUES (?, ?)";
    const stmt = db.prepare(sql);
    return stmt.run(username, password);
}


export function userLogin(username, password) {
    const sql = "SELECT id, username FROM user WHERE username = ? AND password = ?";
    const stmt = db.prepare(sql);
    return stmt.get(username, password);
}


export function userDelete(username) {
    const sql = "DELETE FROM user WHERE username = ?";
    const stmt = db.prepare(sql);
    return stmt.run(username);
}


export function userUpdate(id, newPassword) {
    const sql = "UPDATE user SET password = ? WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(newPassword, id);
}


export function userHasAccess(userId, path) {
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
// ==========================================
// ABM GRUPOS (groups)
// ==========================================

// Alta de Grupo
export function groupCreate(name, description) {
    const sql = "INSERT INTO groups (name, description) VALUES (?, ?)";
    const stmt = db.prepare(sql);
    return stmt.run(name, description);
}

// Baja de Grupo
export function groupDelete(id) {
    const sql = "DELETE FROM groups WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(id);
}

// Modificación de Grupo
export function groupUpdate(id, newName, newDescription) {
    const sql = "UPDATE groups SET name = ?, description = ? WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(newName, newDescription, id);
}

// Listar Grupos 
export function groupList() {
    const sql = "SELECT * FROM groups";
    const stmt = db.prepare(sql);
    return stmt.all();
}

// ==========================================
// ABM MIEMBROS (members) - Relaciona usuarios con grupos
// ==========================================

// Alta de Miembro (Asignar usuario a un grupo)
export function memberCreate(idGroup, idUser) {
    const sql = "INSERT INTO members (id_group, id_user) VALUES (?, ?)";
    const stmt = db.prepare(sql);
    return stmt.run(idGroup, idUser);
}

// Baja de Miembro (Quitar usuario de un grupo)
export function memberDelete(idGroup, idUser) {
    const sql = "DELETE FROM members WHERE id_group = ? AND id_user = ?";
    const stmt = db.prepare(sql);
    return stmt.run(idGroup, idUser);
}


// ==========================================
// ABM ENDPOINTS (endpoint) - Rutas protegidas
// ==========================================

// Alta de Endpoint
export function endpointCreate(path, method) {
    const sql = "INSERT INTO endpoint (path, method) VALUES (?, ?)";
    const stmt = db.prepare(sql);
    return stmt.run(path, method);
}

// Baja de Endpoint
export function endpointDelete(id) {
    const sql = "DELETE FROM endpoint WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(id);
}

// Modificación de Endpoint
export function endpointUpdate(id, newPath, newMethod) {
    const sql = "UPDATE endpoint SET path = ?, method = ? WHERE id = ?";
    const stmt = db.prepare(sql);
    return stmt.run(newPath, newMethod, id);
}

export function dbObtenerUsuarios() {
    const sql = "SELECT username FROM user ORDER BY id ASC";
    try {
        const stmt = db.prepare(sql);
        return stmt.all(); // Trae todas las filas
    } catch (err) {
        throw new Error("Error al listar usuarios: " + err.message);
    }
}