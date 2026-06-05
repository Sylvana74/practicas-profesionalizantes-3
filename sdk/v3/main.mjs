import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import crypto from 'node:crypto'; 


if (!globalThis.crypto) {
    globalThis.crypto = crypto;
}

function default_config() 
{
    const config = 
    {
        server: 
        {
            ip: '127.0.0.1',
            port: 3000,
            default_path: './default.html'
        },
        database: 
        {
            path: './db.sqlite3'
        }
    };

    return config;
}

function load_config() 
{
    let config = null;
    try 
    {
        const data = readFileSync('./config.json', 'utf-8');
        config = JSON.parse(data);
        console.log("Configuración cargada correctamente.");
    } 
    catch (error) 
    {
        console.error("Error cargando config.json. Usando valores por defecto.");
        config = default_config();
    }
    return config;
}

const config = load_config();

function connect_db(path) 
{
    const dbPath = resolve(path);
    try 
    {
        const db = new DatabaseSync(dbPath);
        return db;
    } 
    catch (err) 
    {
        throw new Error("Error al conectar a la base de datos: " + err.message);
    }
}


const db = connect_db(config.database.path);


const PUBLIC_ENDPOINTS = new Set([
    '/',
    '/login',
    '/register',
    '/favicon.ico'
]);

function isPublicEndpoint(endpointPath) {
    if (!endpointPath) return false;
    const normalizedPath = endpointPath.replace(/\/$/, ''); 
    return normalizedPath === '' ? PUBLIC_ENDPOINTS.has('/') : PUBLIC_ENDPOINTS.has(normalizedPath);
}


async function calcularHashSHA256(cadena) {
    const encoder = new TextEncoder(); 
    const data = encoder.encode(cadena); 
    
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data); 
    const hashArray = Array.from(new Uint8Array(hashBuffer)); 
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join(''); 
    
    return hashHex; 
}


let userSessions = new Map();  

class UserSession
{
    constructor()
    {
       this.status = 'disabled';
    }
}

async function authenticate( username, password )
{
    const passwordHash = await calcularHashSHA256(password);
    const sql = "SELECT count(*) as total FROM `user` WHERE username=? AND password=?";

    try 
    {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, passwordHash);
        return (row.total === 1);
    } 
    catch (err) 
    {
        throw err;
    }
}

function authorize( username, endpointPath )
{
    if (isPublicEndpoint(endpointPath)) {
        return true;
    }

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
        const row = stmt.get(username, endpointPath);
        return row.total > 0;
    } catch (err) {
        console.error("Error consultando permisos:", err);
        throw err;
    }
}

async function login( username, password )
{
    let isAuthenticated = await authenticate(username, password);

    if ( isAuthenticated )
    {
        let previousSession = userSessions.get(username);

        if ( previousSession == null )
        {
            let newSession = new UserSession();
            newSession.status = 'enabled';
            userSessions.set(username, newSession);
            return newSession;
        }
        else
        {
            if ( previousSession.status == 'disabled')
            {
                previousSession.status = 'enabled';
            }
            return previousSession;
        }
    }
    else
    {
        return null;
    }
}

async function logout(username, password)
{
    let isAuthenticated = await authenticate(username, password);

    if ( isAuthenticated )
    {
        let currentSession = userSessions.get(username);
        if (currentSession) {
            currentSession.status = 'disabled';
        }
    }
}


const server = createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${config.server.ip}:${config.server.port}`);
    const endpointPath = parsedUrl.pathname;

    console.log(`Petición recibida: [${req.method}] ${endpointPath}`);

    if (endpointPath === '/') {
        try {
            const html = readFileSync(config.server.default_path, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end("Error leyendo default.html");
            return;
        }
    }

    const usernameDummy = "testUser"; 
    const isAuthorized = authorize(usernameDummy, endpointPath);

    if (isAuthorized) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ message: `Acceso concedido a: ${endpointPath}` }));
    } else {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: `Acceso denegado a: ${endpointPath}` }));
    }
});

server.listen(config.server.port, config.server.ip, () => {
    console.log(`Servidor corriendo en http://${config.server.ip}:${config.server.port}`);
});