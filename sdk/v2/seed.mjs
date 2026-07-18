import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./db.sqlite3');

console.log("Iniciando inyección de datos...");

try {
    // Limpiamos
    db.exec(`
        DELETE FROM permisos; DELETE FROM endpoints; DELETE FROM grupos; DELETE FROM usuarios;
    `);

    // Inyectamos datos de prueba
    db.exec(`
        INSERT INTO grupos (id, nombre) VALUES (1, 'Admins'), (2, 'Editores');
        
        INSERT INTO endpoints (id, ruta, metodo) VALUES 
        (1, '/usuarios', 'POST'), (2, '/grupos', 'POST');
        
        INSERT INTO permisos (id_grupo, id_endpoint) VALUES 
        (1, 1), (1, 2), (2, 2);
        
        INSERT INTO usuarios (username, password, id_grupo) VALUES 
        ('admin_principal', '1234', 1),
        ('editor_basico', '1234', 2);
    `);

    console.log("¡Datos inyectados! Probá en el HTML ingresar con usuario 'admin_principal' y clave '1234'");

} catch (error) {
    console.error("Error al insertar:", error.message);
}