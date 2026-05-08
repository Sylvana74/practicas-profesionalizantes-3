import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

// Conexión a la base de datos en la carpeta v2
const db = new DatabaseSync(resolve('./db.sqlite3'));

// Guardamos el SQL en una variable de texto (usando comillas invertidas `)
const sql = `
-- 1. Limpiar datos viejos
DELETE FROM access;
DELETE FROM members;
DELETE FROM endpoint;
DELETE FROM "group";
DELETE FROM user;

-- 2. Insertar Grupos
INSERT INTO "group" (id, name) VALUES (1, 'admin'), (2, 'editor'), (3, 'guest');

-- 3. Insertar Endpoints
INSERT INTO "endpoint" (id, path) VALUES (1, '/'), (2, '/register'), (3, '/dashboard');

-- 4. Insertar Usuarios (Alta)
INSERT INTO "user" (id, username, password) VALUES (1, 'admin_syl', '1234'), (2, 'invitado', '5678');

-- 5. Relacionar Usuarios con Grupos
INSERT INTO "members" (id_user, id_group) VALUES (1, 1), (2, 3);

-- 6. Definir Accesos
INSERT INTO "access" (id_group, id_endpoint) VALUES (1, 1), (1, 2), (1, 3), (3, 1);
`;

try {
    // Ejecutamos la cadena de texto SQL
    db.exec(sql);
    console.log("¡Éxito! La base de datos v2 ya tiene registros de prueba.");
} catch (e) {
    console.error("Error al ejecutar el SQL:", e.message);
}