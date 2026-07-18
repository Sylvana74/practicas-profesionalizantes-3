import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

// --- CONFIGURACIÓN Y BD ---
function load_config() {
    try {
        const data = readFileSync('./config.json', 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return { server: { ip: '127.0.0.1', port: 8080 }, database: { path: './database.db' } };
    }
}

const config = load_config();
const db = new DatabaseSync(resolve(config.database.path));

// --- SESIONES ---
const sessionTokens = new Map();
const userSessions = new Map();

class UserSession {
    constructor() { this.status = 'disabled'; }
}

// --- HANDLERS  ---
function login_handler(request, response) {
    let body = '';
    request.on('data', function(chunk) { body += chunk.toString(); });
    request.on('end', function() {
        try {
            const input = JSON.parse(body);
            // Lógica de login aquí...
            const session = { token: 'token-ejemplo-' + Date.now() }; 
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ token: session.token }));
        } catch (e) { response.writeHead(400); response.end(); }
    });
}

function show_message_handler(request, response) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: "Mensaje procesado satisfactoriamente" }));
}

// --- ROUTER Y DISPATCHER ---
const router = new Map();

router.set('/login', { handler: login_handler, public: true });
router.set('/log', { handler: show_message_handler, public: false, authRequired: true });
router.set('/sayhello', { handler: show_message_handler, public: false, authRequired: true }); // <--- Agrégala aquíe });

async function request_dispatcher(request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return; }

    const url = new URL(request.url, 'http://' + config.server.ip);
    const route = router.get(url.pathname);

    if (!route) { response.writeHead(404); response.end(); return; }
    
    return await route.handler(request, response);
}

// --- INICIO ---
const server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, function() {
    console.log('Servidor corriendo en puerto ' + config.server.port);
});