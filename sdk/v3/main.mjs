import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

// --- CONFIGURACIÓN ---
function default_config() {
    return {
        server: { ip: '127.0.0.1', port: 3000, default_path: './default.html' },
        database: { path: './db.sqlite3' }
    };
}

function load_config() {
    try {
        const data = readFileSync('./config.json', 'utf-8');
        console.log("Configuración cargada correctamente.");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error cargando config.json. Usando valores por defecto.");
        return default_config();
    }
}

const config = load_config();
const db = connect_db(config.database.path);

function connect_db(path) {
    const dbPath = resolve(path);
    try {
        return new DatabaseSync(dbPath);
    } catch (err) {
        throw new Error("Error al conectar a la base de datos: " + err.message);
    }
}

// --- GESTOR DE SESIONES (Diseño Estructural en Memoria) ---
class UserSession {
    constructor(username) {
        this.username = username;
        this.status = 'disabled';
        this.createdAt = new Date();
    }
}

const SessionManager = {
    sessions: new Map(),

    createOrEnable(username) {
        let session = this.sessions.get(username);
        if (!session) {
            session = new UserSession(username);
            this.sessions.set(username, session);
        }
        session.status = 'enabled';
        return session;
    },

    disable(username) {
        const session = this.sessions.get(username);
        if (session) {
            session.status = 'disabled';
            return true;
        }
        return false;
    },

    isValid(username) {
        const session = this.sessions.get(username);
        return session && session.status === 'enabled';
    }
};

// --- AUTENTICACIÓN Y AUTORIZACIÓN ---
function authenticate(username, password) {
    const sql = "SELECT count(*) as total FROM `user` WHERE username=? AND password=?";
    try {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, password);
        return (row.total === 1);
    } catch (err) {
        console.error("Error en autenticación:", err);
        return false;
    }
}

// El Autorizador encargado de habilitar/denegar accesos
function authorize(username, endpointPath) {
    const sql = `
        SELECT count(*) as total
        FROM access a
        JOIN members m ON a.id_group = m.id_group
        JOIN user u ON m.id_user = u.id
        JOIN endpoint e ON a.id_endpoint = e.id
        WHERE u.username = ? 
          AND e.path = ?
    `;
    try {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, endpointPath); // Corregido: antes decía path
        return row.total > 0;
    } catch (err) {
        console.error("Error consultando permisos para " + endpointPath + ":", err);
        return false;
    }
}

// --- LÓGICA DE NEGOCIO (Login / Logout / Registro) ---
function login(username, password) {
    if (authenticate(username, password)) {
        return SessionManager.createOrEnable(username);
    }
    return null;
}

function logout(username, password) {
    if (authenticate(username, password)) {
        return SessionManager.disable(username);
    }
    return false;
}

async function createUser(username, password) {
    const sql = "INSERT INTO user (username, password) VALUES (?, ?) RETURNING id";
    try {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, password);
        return { id: row.id, username, password };
    } catch (err) {
        throw err;
    }
}

// --- MANEJADORES DE RUTA (CONTROLS) ---
function default_handler(request, response) {
    try {
        const html = readFileSync(config.server.default_path, 'utf-8');
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(html);
    } catch (error) {
        response.writeHead(500);
        response.end('Error interno: No se pudo cargar la vista principal.');
    }
}

async function login_handler(request, response) {
    if (request.method !== "POST") {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Método no permitido. Usa POST.' }));
        return;
    }

    let body = '';
    request.on('data', chunk => { body += chunk.toString(); });
    request.on('end', () => {
        try {
            const input = JSON.parse(body);
            const session = login(input.username, input.password);

            if (session) {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ message: "Login exitoso", session }));
            } else {
                response.writeHead(401, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: "Credenciales inválidas" }));
            }
        } catch (err) {
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Formato JSON inválido' }));
        }
    });
}

async function register_handler(request, response) {
    const url = new URL(request.url, 'http://' + config.server.ip);
    const input = Object.fromEntries(url.searchParams);

    if (!input.username || !input.password) {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: "Faltan parámetros username o password" }));
        return;
    }

    try {
        const output = await createUser(input.username, input.password);
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(output));
    } catch (err) {
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: err.message }));
    }
}

// Endpoints simulados para la prueba de autorización
function generic_endpoint_handler(request, response) {
    const url = new URL(request.url, 'http://' + config.server.ip);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ 
        status: "Éxito", 
        message: `Acceso concedido al endpoint: ${url.pathname}` 
    }));
}

// --- ENRUTADOR ---
let router = new Map();
router.set('/', default_handler);
router.set('/login', login_handler);
router.set('/register', register_handler);

// Rutas protegidas del ítem 1
router.set('/print', generic_endpoint_handler);
router.set('/log', generic_endpoint_handler);
router.set('/help', generic_endpoint_handler);
router.set('/sayHello', generic_endpoint_handler);
router.set('/sayBye', generic_endpoint_handler);

// --- DESPACHADOR CENTRAL (Middleware de Autorización integrado) ---
async function request_dispatcher(request, response) {
    const url = new URL(request.url, 'http://' + config.server.ip);
    const path = url.pathname;
    const handler = router.get(path);

    if (!handler) {
        response.writeHead(404);
        response.end('Ruta no encontrada');
        return;
    }

    // Lista de rutas públicas que no requieren validación de permisos
    const publicRoutes = ['/', '/login', '/register'];
    
    if (publicRoutes.includes(path)) {
        return await handler(request, response);
    }

    // MIDDLEWARE DE SEGURIDAD: Obtenemos el usuario simulado desde los headers de la petición
    const username = request.headers['x-current-user'];

    // 1. Validar si el usuario tiene una sesión activa en el SessionManager
    if (!username || !SessionManager.isValid(username)) {
        response.writeHead(401, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: "No autorizado. Inicie sesión primero." }));
        return;
    }

    // 2. Operación del Autorizador: Verificar permisos en la base de datos para ese path
    const hasAccess = authorize(username, path);

    if (hasAccess) {
        return await handler(request, response); // Pasa al controlador
    } else {
        response.writeHead(403, { 'Content-Type': 'application/json' }); // Forbidden
        response.end(JSON.stringify({ 
            error: `Acceso Denegado. El usuario '${username}' no tiene permisos para el endpoint '${path}'.` 
        }));
    }
}

function start() {
    console.log('Servidor ejecutándose en http://' + config.server.ip + ':' + config.server.port);
}

let server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, start);