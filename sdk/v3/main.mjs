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
            port: 3000,
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


let userSessions = new Map();  //clave-valor  -> clave: id_user,  valor: sessionObj

class UserSession
{
    constructor()
    {
       this.status = 'disabled';
    }

}


function authenticate( username, password )
{
    //Debería ir a la base de datos y buscar si existe (1) registro  username/password coincidente
    //Si es verdadero entonces significa que estoy autenticado, sino no.

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

        // Si el conteo es mayor a 0, tiene permiso
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
            //Significa que está ingresando por primera vez. Entonces, creo y persisto el objeto de sesión
            let newSession = new UserSession();
            newSession.status = 'enabled';
            userSessions.set(username, newSession );
            return newSession;
        }
        else
        {
            //Significa que ya ingresó en algún momento y tiene ya un objeto de sesión creado y guardado en el mapa.
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

    //El retorno de esta función está representando si se devuelve o no un objeto de sesión.
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