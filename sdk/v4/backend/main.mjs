import { createServer } from 'node:http';
import { URL }          from 'node:url';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve }      from 'node:path';
import { createHash }   from 'node:crypto'; // AGREGADO: necesario para hash SHA256 en el seed

function default_config()
{
    return {
        server:
        {
            ip:   '127.0.0.1',
            port: 8080
        },
        database:
        {
            path: './db.sqlite3' 
        }
    };
}

function load_config()
{
    let config = null;
    try
    {
        const data = readFileSync('./config.json', 'utf-8');
        config = JSON.parse(data);
        console.log('Configuración cargada correctamente.');
    }
    catch (error)
    {
        console.error('Error cargando config.json. Usando valores por defecto.');
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
        throw new Error('Error al conectar a la base de datos: ' + err.message);
    }
}

const db = connect_db(config.database.path);


db.exec(`
    CREATE TABLE IF NOT EXISTS user (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        username      TEXT NOT NULL,
        password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS "group" (
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS members (
        id_user  INTEGER NOT NULL,
        id_group INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS endpoint (
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS access (
        id_group    INTEGER NOT NULL,
        id_endpoint INTEGER NOT NULL
    );
`);

//función que hashea la contraseña con SHA256
// Las contraseñas no se guardan en texto plano en la BD
// El campo se llama password_hash 
function hash_password(password)
{
    return createHash('sha256').update(password).digest('hex');
}


// Se ejecuta al iniciar el servidor solo si la BD está vacía
// Carga el escenario de la consigna: usuario en grupo con acceso a /log pero no a /sayHello
function seed()
{
    const count = db.prepare('SELECT COUNT(*) AS n FROM user').get().n;
    if (count > 0) return;

    db.prepare('INSERT INTO user (username, password_hash) VALUES (?, ?)').run('admin', hash_password('1234'));

    db.prepare('INSERT INTO "group" (name) VALUES (?)').run('grupo_g');

    const user  = db.prepare('SELECT id FROM user WHERE username = ?').get('admin');
    const group = db.prepare('SELECT id FROM "group" WHERE name = ?').get('grupo_g');
    db.prepare('INSERT INTO members (id_user, id_group) VALUES (?, ?)').run(user.id, group.id);

    const paths = ['/log', '/sayHello'];
    const insert_ep = db.prepare('INSERT OR IGNORE INTO endpoint (path) VALUES (?)');
    for (const p of paths) insert_ep.run(p);

    // Solo /log tiene acceso, /sayHello no
    const ep_log = db.prepare('SELECT id FROM endpoint WHERE path = ?').get('/log');
    db.prepare('INSERT INTO access (id_group, id_endpoint) VALUES (?, ?)').run(group.id, ep_log.id);

    console.log('Datos de prueba cargados.');
    console.log('  Usuario: admin / 1234');
    console.log('  Tiene permiso en:    /log');
    console.log('  No tiene permiso en: /sayHello');
}

seed();

// ─── Sesión ───────────────────────────────────────────────────────────────────

let userSessions = new Map();

class UserSession
{
    constructor()
    {
        this.status = 'disabled';
    }
}

// ─── Helpers de respuesta ─────────────────────────────────────────────────────

function respond_ok(response, data)
{
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(data));
}


function respond_error(response, code, exception, detail)
{
    response.writeHead(code, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ exception, detail }));
}

// ─── Autenticador ─────────────────────────────────────────────────────────────

function authenticate(username, password_hash)
{
    
    const sql  = 'SELECT COUNT(*) AS total FROM user WHERE username = ? AND password_hash = ?';
    const stmt = db.prepare(sql);
    const row  = stmt.get(username, password_hash);
    return row.total === 1;
}

// ─── Autorizador ──────────────────────────────────────────────────────────────

function authorize(username, endpointPath)
{
    
    const sql = `
        SELECT COUNT(*) AS total
        FROM   access   a
        JOIN   members  m ON a.id_group    = m.id_group
        JOIN   user     u ON m.id_user     = u.id
        JOIN   endpoint e ON a.id_endpoint = e.id
        WHERE  u.username = ?
          AND  e.path     = ?
    `;
    const stmt = db.prepare(sql);
    const row  = stmt.get(username, endpointPath);
    return row.total > 0;
}

// ─── Login / Logout ───────────────────────────────────────────────────────────

function login(username, password_hash)
{
    
    let isAuthenticated = authenticate(username, password_hash);

    if (isAuthenticated)
    {
        let previousSession = userSessions.get(username);

        if (!previousSession)
        {
            let newSession    = new UserSession();
            newSession.status = 'enabled';
            userSessions.set(username, newSession);
            return newSession;
        }
        else
        {
            if (previousSession.status === 'disabled')
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

// ─── Lógica de negocio ────────────────────────────────────────────────────────

function createUser(username, password_hash)
{
    
    // se guarda password_hash en lugar de password
    const sql  = 'INSERT INTO user (username, password_hash) VALUES (?, ?) RETURNING id';
    const stmt = db.prepare(sql);
    const row  = stmt.get(username, password_hash);
    return { id: row.id, username };
}

// ─── Manejadores ──────────────────────────────────────────────────────────────

function login_handler(request, response)
{
    let body = '';

    request.on('data', function(chunk)
    {
        body += chunk.toString();
    });

    request.on('end', function()
    {
        try
        {
            const input = JSON.parse(body);

            //el login ahora lee x-user-id y x-api-key desde las cabeceras
            
            const username      = request.headers['x-user-id'];
            const password_hash = request.headers['x-api-key'];

            const session = login(username, password_hash);

            if (session === null)
            {
                return respond_error(response, 401, 'Unauthorized', ['Credenciales incorrectas.']);
            }

            respond_ok(response, { session });
        }
        catch (err)
        {
            respond_error(response, 400, 'BadRequest', ['El cuerpo de la petición no tiene formato JSON válido.']);
        }
    });
}

function register_handler(request, response)
{
    // El cuerpo queda libre para datos propios del caso de uso
    const username      = request.headers['x-user-id'];
    const password_hash = request.headers['x-api-key'];

    if (!username || !password_hash)
    {
        return respond_error(response, 400, 'BadRequest', ['Cabeceras x-user-id y x-api-key requeridas.']);
    }

    try
    {
        const output = createUser(username, password_hash);
        respond_ok(response, output);
    }
    catch (err)
    {
        respond_error(response, 500, 'ServerError', [err.message]);
    }
}

function show_message_handler(request, response)
{
    console.log('Petición recibida: Mostrando mensaje en el servidor!');
    respond_ok(response, { message: 'Mensaje procesado satisfactoriamente' });
}

// ─── Router ───────────────────────────────────────────────────────────────────

let router = new Map();
router.set('/login',      login_handler);
router.set('/register',   register_handler);
router.set('/showMessage', show_message_handler);
router.set('/log',        show_message_handler);
router.set('/sayHello',   show_message_handler);

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function request_dispatcher(request, response)
{
    // ── CORS ──────────────────────────────────────────────────────────────────
    response.setHeader('Access-Control-Allow-Origin',  '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, x-api-key');
    
    

    if (request.method === 'OPTIONS')
    {
        response.writeHead(204);
        response.end();
        return;
    }

    if (request.method !== 'POST')
    {
        return respond_error(response, 400, 'BadRequest', ['Método ' + request.method + ' no soportado. Usá POST.']);
    }

    try
    {
        const url     = new URL(request.url, 'http://' + config.server.ip);
        const path    = url.pathname;
        const handler = router.get(path);

        if (!handler)
        {
            return respond_error(response, 400, 'BadRequest', ['Endpoint no encontrado: ' + path]);
        }

        if (path === '/log' || path === '/sayHello')
        {
            const username = request.headers['x-user-id'];
            const key      = request.headers['x-api-key'];

            if (!username || !key)
            {
                return respond_error(response, 400, 'BadRequest', ['Cabeceras x-user-id y x-api-key requeridas.']);
            }

            // Verificar que la sesión esté activa
            const session = userSessions.get(username);
            if (!session || session.status !== 'enabled')
            {
                return respond_error(response, 401, 'Unauthorized', ['Sesión inactiva o inexistente.']);
            }

            // Verificar que el usuario tenga permiso sobre el endpoint
            const allowed = authorize(username, path);
            if (!allowed)
            {
                return respond_error(response, 401, 'Unauthorized', ['Acceso denegado al endpoint: ' + path]);
            }
        }

        return await handler(request, response);
    }
    catch (err)
    {
        console.error(err);
        return respond_error(response, 500, 'ServerError', [err.message]);
    }
}

function start()
{
    console.log('Servidor ejecutándose en http://' + config.server.ip + ':' + config.server.port);
}

let server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, start);
