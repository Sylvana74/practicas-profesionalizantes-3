import { readFileSync } from 'node:fs';
// Cambiamos las importaciones al nuevo archivo 'model.mjs' y a camelCase
import { userCreate, userLogin, userDelete } from './model.mjs'; 

// Cargamos de forma global el config para no pasarlo por parámetro
const config = JSON.parse(readFileSync('./config.json', 'utf-8'));

// Función auxiliar para leer datos del POST
function getBody(request) {
    return new Promise((resolve) => {
        let body = '';
        request.on('data', chunk => { body += chunk.toString(); });
        request.on('end', () => {
            const params = new URLSearchParams(body);
            resolve(Object.fromEntries(params));
        });
    });
}

// Handler por defecto - AHORA SOLO RECIBE 2 PARÁMETROS
export function defaultHandler(request, response) {
    const html = readFileSync(config.server.default_path, 'utf-8');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
}

// Handler para el registro (Alta)
export async function registerHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request); 
            const result = await userCreate(input.username, input.password);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", data: result }));
        } catch (err) {
            response.writeHead(500);
            response.end(JSON.stringify({ error: err.message }));
        }
    } else {
        response.writeHead(405);
        response.end("Debe usar POST");
    }
}

// Handler para mostrar mensaje
export function showMessageHandler(request, response) {
    console.log("¡Botón presionado! El servidor recibió la señal correctamente.");
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end("Mensaje impreso en la terminal del servidor");
}

// Handler para Login (Autenticación v2)
export async function loginHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            const user = await userLogin(input.username, input.password);
            
            if (user) {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ status: "success", message: `Bienvenido ${user.username}` }));
            } else {
                response.writeHead(401);
                response.end(JSON.stringify({ status: "error", message: "Credenciales incorrectas" }));
            }
        } catch (err) {
            response.writeHead(500);
            response.end(JSON.stringify({ error: err.message }));
        }
    } else {
        response.writeHead(405);
        response.end("Debe usar POST");
    }
}

// Handler para la Baja de usuarios
export async function deleteHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request); 
            await userDelete(input.id);
            
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                status: "success", 
                message: `Usuario '${input.id}' eliminado correctamente` 
                }));
        } catch (err) {
            response.writeHead(500);
            response.end(JSON.stringify({ error: err.message }));
        }
    } else {
        response.writeHead(405);
        response.end("Debe usar POST");
    }
}
// Primero, acordate de actualizar tu import inicial en handlers.mjs para incluir lo nuevo:
// import { userCreate, userLogin, userDelete, groupCreate, groupDelete, groupUpdate, memberCreate, memberDelete, endpointCreate, endpointDelete, endpointUpdate } from './model.mjs';

// ==========================================
// HANDLERS PARA GRUPOS
// ==========================================
export async function groupCreateHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            const result = groupCreate(input.name, input.description);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: "Grupo creado", data: result }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

export async function groupDeleteHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            groupDelete(input.id);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: `Grupo con ID ${input.id} eliminado` }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

export async function groupUpdateHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            groupUpdate(input.id, input.name, input.description);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: "Grupo actualizado con éxito" }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

// ==========================================
// HANDLERS PARA MIEMBROS
// ==========================================
export async function memberCreateHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            memberCreate(input.idGroup, input.idUser);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: "Usuario asignado al grupo correctamente" }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

export async function memberDeleteHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            memberDelete(input.idGroup, input.idUser);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: "Usuario removido del grupo correctamente" }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

// ==========================================
// HANDLERS PARA ENDPOINTS
// ==========================================
export async function endpointCreateHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            const result = endpointCreate(input.path, input.method);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: "Endpoint registrado", data: result }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

export async function endpointDeleteHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            endpointDelete(input.id);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: `Endpoint con ID ${input.id} eliminado` }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}

export async function endpointUpdateHandler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            endpointUpdate(input.id, input.path, input.method);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", message: "Endpoint modificado correctamente" }));
        } catch (err) {
            response.writeHead(500); response.end(JSON.stringify({ error: err.message }));
        }
    } else { response.writeHead(405); response.end("Debe usar POST"); }
}