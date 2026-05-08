import { readFileSync } from 'node:fs';
import { user_create, user_login } from './db.mjs'; 

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

// Handler para el registro (Alta)
export async function register_handler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request); 
            // Usamos user_create para ser consistentes con la v2
            const result = await user_create(input.username, input.password);
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

// Handler para mostrar mensaje (El que faltaba para el botón)
export function show_message_handler(request, response) {
    console.log("¡Botón presionado! El servidor recibió la señal correctamente.");
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end("Mensaje impreso en la terminal del servidor");
}

// NUEVO: Handler para Login (Autenticación v2)
export async function login_handler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request);
            // Esta función la definiremos en db.mjs para validar credenciales
            const user = await user_login(input.username, input.password);
            
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
    }
}

export function default_handler(request, response, config) {
    const html = readFileSync(config.server.default_path, 'utf-8');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
}