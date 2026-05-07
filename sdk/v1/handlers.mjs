import { readFileSync } from 'node:fs';
import { createUser } from './db.mjs';

// Función auxiliar para leer datos del POST
function getBody(request) {
    return new Promise((resolve) => {
        let body = '';
        request.on('data', chunk => { body += chunk.toString(); });
        request.on('end', () => {
            // Convierte 'username=valor&password=valor' en un objeto
            const params = new URLSearchParams(body);
            resolve(Object.fromEntries(params));
        });
    });
}

export async function register_handler(request, response) {
    if (request.method === 'POST') {
        try {
            const input = await getBody(request); // Obtiene datos del formulario 
            const result = await createUser(input.username, input.password);
            
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ status: "success", data: result }));
        } catch (err) {
            response.writeHead(500);
            response.end(JSON.stringify({ error: err.message }));
        }
    } else {
        response.writeHead(405); // Method Not Allowed
        response.end("Debe usar POST");
    }
}

export function default_handler(request, response, config) {
    const html = readFileSync(config.server.default_path, 'utf-8');
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end(html);
}