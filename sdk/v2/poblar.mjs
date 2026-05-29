import { db } from './db.mjs';

function poblarBaseDeDatos() {
    console.log("Iniciando la estructura y carga de datos masiva...");

    try {
        // =================================================================
        // 1. CREACIÓN DE TABLAS 
        // =================================================================
        
        // Tabla de Usuarios
        db.prepare(`
            CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
        `).run();

        // Tabla de Grupos 
        db.prepare(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            )
        `).run();

        // Tabla de Endpoints (Rutas protegidas)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS endpoint (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL UNIQUE,
                method TEXT NOT NULL
            )
        `).run();

        // Tabla Intermedia: Miembros (Relaciona Usuarios con Grupos)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS members (
                id_group INTEGER,
                id_user INTEGER,
                PRIMARY KEY (id_group, id_user),
                FOREIGN KEY (id_group) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (id_user) REFERENCES user(id) ON DELETE CASCADE
            )
        `).run();

        // Tabla Intermedia: Accesos / Permisos (Relaciona Grupos con Endpoints)
        db.prepare(`
            CREATE TABLE IF NOT EXISTS access (
                id_group INTEGER,
                id_endpoint INTEGER,
                PRIMARY KEY (id_group, id_endpoint),
                FOREIGN KEY (id_group) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (id_endpoint) REFERENCES endpoint(id) ON DELETE CASCADE
            )
        `).run();

        console.log("✔ Estructura de tablas verificada/creada.");
// =================================================================
        // 2. LIMPIEZA DE REGISTROS 
        // =================================================================
        // Borramos las tablas de permisos por completo para forzar su recreación limpia
        db.prepare("DROP TABLE IF EXISTS access").run();
        db.prepare("DROP TABLE IF EXISTS members").run();
        db.prepare("DROP TABLE IF EXISTS endpoint").run();
        
        
        db.prepare(`
            CREATE TABLE IF NOT EXISTS endpoint (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL UNIQUE,
                method TEXT NOT NULL
            )
        `).run();

        db.prepare(`
            CREATE TABLE IF NOT EXISTS members (
                id_group INTEGER,
                id_user INTEGER,
                PRIMARY KEY (id_group, id_user),
                FOREIGN KEY (id_group) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (id_user) REFERENCES user(id) ON DELETE CASCADE
            )
        `).run();

        db.prepare(`
            CREATE TABLE IF NOT EXISTS access (
                id_group INTEGER,
                id_endpoint INTEGER,
                PRIMARY KEY (id_group, id_endpoint),
                FOREIGN KEY (id_group) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (id_endpoint) REFERENCES endpoint(id) ON DELETE CASCADE
            )
        `).run();

        
        db.prepare("DELETE FROM groups").run();
        db.prepare("DELETE FROM user").run();
        db.prepare("DELETE FROM sqlite_sequence").run(); 

        console.log("✔ Estructura vieja eliminada y tablas limpiadas correctamente.");
        // =================================================================
        // 2. LIMPIEZA DE REGISTROS (Para evitar duplicados)
        // =================================================================
        db.prepare("DELETE FROM access").run();
        db.prepare("DELETE FROM members").run();
        db.prepare("DELETE FROM endpoint").run();
        db.prepare("DELETE FROM groups").run();
        db.prepare("DELETE FROM user").run();
        db.prepare("DELETE FROM sqlite_sequence").run(); 

        console.log("✔ Tablas limpiadas correctamente.");

        // =================================================================
        // 3. INSERCIÓN MASIVA DE USUARIOS (15 registros)
        // =================================================================
        const usuarios = [
            ['admin', 'admin123'], ['juan.perez', 'juan2026'], ['maria.gomez', 'maria@@'],
            ['lucas.rodriguez', 'lucas99'], ['ana.martinez', 'anaSecure!'], ['carlos.lopez', 'charles123'],
            ['sofia.diaz', 'sofiPass'], ['diego.sanchez', 'dieguito'], ['laura.alvarez', 'lau9876'],
            ['nicolas.conti', 'nicoC99'], ['belen.ingeniera', 'beluChem'], ['nahuel.electronica', 'nahuElec'],
            ['nazarena.sistemas', 'nazaSys'], ['thiago.tec', 'thiago16'], ['invitado', 'invitado123']
        ];

        const stmtUser = db.prepare("INSERT INTO user (username, password) VALUES (?, ?)");
        for (const u of usuarios) {
            stmtUser.run(u[0], u[1]);
        }
        console.log(`✔ ${usuarios.length} Usuarios insertados.`);

        // =================================================================
        // 4. INSERCIÓN DE GRUPOS
        // =================================================================
        const grupos = [
            ['Administradores', 'Acceso total al sistema y gestión de permisos.'],
            ['Desarrolladores', 'Acceso a entornos de desarrollo y endpoints técnicos.'],
            ['Auditores', 'Solo lectura de logs y reportes de seguridad.'],
            ['Operadores', 'Usuarios estándar con acceso a funciones comerciales básicas.'],
            ['Invitados', 'Acceso restringido de solo lectura a la página de inicio.']
        ];

        const stmtGroup = db.prepare("INSERT INTO groups (name, description) VALUES (?, ?)");
        for (const g of grupos) {
            stmtGroup.run(g[0], g[1]);
        }
        console.log(`✔ ${grupos.length} Grupos creados.`);

        // =================================================================
        // 5. INSERCIÓN DE ENDPOINTS
        // =================================================================
        const endpoints = [
            ['/', 'GET'], ['/register', 'POST'], ['/login', 'POST'], 
            ['/delete', 'POST'], ['/showMessage', 'POST'],
            ['/group/create', 'POST'], ['/group/delete', 'POST'], ['/group/update', 'POST'],
            ['/member/create', 'POST'], ['/member/delete', 'POST'],
            ['/endpoint/create', 'POST'], ['/endpoint/delete', 'POST'], ['/endpoint/update', 'POST'],
            ['/admin/dashboard', 'GET'], ['/admin/logs', 'GET'], ['/api/v2/metrics', 'GET']
        ];

        const stmtEndpoint = db.prepare("INSERT INTO endpoint (path, method) VALUES (?, ?)");
        for (const e of endpoints) {
            stmtEndpoint.run(e[0], e[1]);
        }
        console.log(`✔ ${endpoints.length} Endpoints registrados.`);

        // =================================================================
        // 6. ASIGNACIÓN DE MIEMBROS A GRUPOS (Mapeo por ID)
        // =================================================================
        const miembros = [
            [1, 1],   // admin es Administrador
            [1, 11],  // belen.ingeniera es Administradora
            [2, 2],   // juan.perez es Desarrollador
            [2, 12],  // nahuel.electronica es Desarrollador
            [2, 13],  // nazarena.sistemas es Desarrollador
            [3, 3],   // maria.gomez es Auditora
            [4, 4],   // lucas.rodriguez es Operador
            [4, 5],   // ana.martinez es Operador
            [4, 14],  // thiago.tec es Operador
            [5, 15]   // invitado es Invitado
        ];

        const stmtMember = db.prepare("INSERT INTO members (id_group, id_user) VALUES (?, ?)");
        for (const m of miembros) {
            stmtMember.run(m[0], m[1]);
        }
        console.log(`✔ ${miembros.length} Miembros asignados.`);

        // =================================================================
        // 7. GESTIÓN DE ACCESOS (Relación Grupos y Endpoints)
        // =================================================================
        const accesos = [
            // Administradores: Acceso total a rutas críticas
            [1, 4], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10], [1, 11], [1, 12], [1, 13], [1, 14], [1, 15], [1, 16],
            // Desarrolladores
            [2, 11], [2, 12], [2, 13], [2, 16],
            // Auditores
            [3, 15],
            // Rutas comunes
            [1, 1], [1, 2], [1, 3], [1, 5],
            [2, 1], [2, 2], [2, 3], [2, 5],
            [3, 1], [3, 2], [3, 3], [3, 5],
            [4, 1], [4, 2], [4, 3], [4, 5],
            [5, 1]
        ];

        const stmtAccess = db.prepare("INSERT INTO access (id_group, id_endpoint) VALUES (?, ?)");
        for (const a of accesos) {
            stmtAccess.run(a[0], a[1]);
        }
        console.log(`✔ ${accesos.length} Permisos cruzados.`);
        console.log("--------------------------------------------------");
        console.log("¡Tablas creadas y base de datos poblada con éxito!");
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ Error crítico al procesar la base de datos:", error.message);
    }
}

poblarBaseDeDatos();