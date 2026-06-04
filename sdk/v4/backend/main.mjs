import { createServer } from 'node:http';
import { URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

function default_config() 
{
    const config = 
    {
        server: 
        {
            ip: '127.0.0.1',
            port: 8080, 
            default_path: './index.html'
        },
        database: 
        {
            path: './database.db'
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

let userSessions = new Map();

class UserSession
{
    constructor()
    {
       this.status = 'disabled';
    }
}

function authenticate( username, password )
{
    const sql = "SELECT count(*) as total FROM `user` WHERE username=? AND password=?";
    try 
    {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, password);
            
        return (row.total === 1);
    } 
    catch (err) 
    {
        throw err;
    }
}

function authorize( username, endpointPath )
{
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

function login( username, password )
{
    let isAuthenticated = authenticate(username, password);

    if ( isAuthenticated )
    {
        let havePreviousSession = userSessions.get(username);

        if ( havePreviousSession != null )
        {
            let newSession = new UserSession();
            newSession.status = 'enabled';
            userSessions.set(username, newSession );
            return newSession;
        }
        else
        {
            let previusSession = userSessions.get(username);

            if ( previusSession.status == 'disabled')
            {
                previusSession.status = 'enabled';
            }
    
            return previusSession;
        }
    }
    else
    {
        return null;
    }
}

function logout(username, password)
{
    let isAuthenticated = authenticate(username, password);

    if ( isAuthenticated )
    {
        let currentSession = userSessions.get(username);
        currentSession.status = 'disabled';
    }
}

async function createUser(db, username, password) 
{
    const sql = "INSERT INTO user (username, password) VALUES (?, ?) RETURNING id";

    try 
    {
        const stmt = db.prepare(sql);
        const row = stmt.get(username, password);

        const result = 
        {
            id: row.id,
            username: username,
            password: password
        };
        
        return result;
    } 
    catch (err) 
    {
        throw err;
    }
}

const db = connect_db(config.database.path);

// Manejadores
async function login_handler(request, response)
{
    if ( request.method == "POST" )
    {
       let body = '';
        request.on('data', chunk => {
            body += chunk.toString();
        });

        request.on('end', async () => 
        {
            try 
            {
                const input = JSON.parse(body);
                const output = login(input.username, input.password);

                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(output));
            } 
            catch (err) 
            {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: 'Formato JSON inválido' }));
            }
        });
    }
    else
    {
        response.writeHead(405, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Método no permitido. Usa POST.' }));
        return;
    }
}

async function register_handler(request, response)
{
    try 
    {
        const output = await createUser(db, 'test', '123456789');
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(output));
    }
    catch (err)
    {
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: err.message }));
    }
}

function show_message_handler(request, response)
{
    console.log("Petición recibida: Mostrando mensaje en el servidor!");
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ message: "Mensaje procesado" }));
}

let router = new Map();
router.set('/login', login_handler);
router.set('/register', register_handler);
router.set('/showMessage', show_message_handler);
router.set('/log', show_message_handler);
router.set('/sayHello', show_message_handler);

async function request_dispatcher(request, response)
{
    
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Agregado para permitir JSON en las peticiones

    if (request.method === 'OPTIONS')
    {
        response.writeHead(204);
        response.end();
        return;
    }
    // ------------------------------------------------------------------

    const url = new URL(request.url, 'http://' + config.server.ip);
    const path = url.pathname;
    const handler = router.get(path);

    if (handler)
    {
        if (path === '/log' || path === '/sayHello') 
        {
            const usuarioSimulado = 'admin';
            const esAutorizado = authorize(usuarioSimulado, path);

            if (!esAutorizado) 
            {
                response.writeHead(403, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: `Acceso Denegado a el endpoint: ${path}` }));
                return; 
            }
        }

        return await handler(request, response);
    }
    else
    {
        response.writeHead(404, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Método o endpoint no encontrado' }));
    }
}

function start()
{
    console.log('Servidor ejecutándose en http://' + config.server.ip + ':' + config.server.port);
}

let server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, start);