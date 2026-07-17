import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { manejarGrupos } from './src/grupos.js'; 
import { manejarAuth } from './src/auth.js';
import { manejarPermisos } from './src/permisos.js';

async function serverHandler(request, response) {
    // Configuración CORS
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejo de preflight para CORS
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    // Único HTML permitido (Interfaz gráfica unificada)
    if (request.url === '/' || request.url === '/index.html') {
        try {
            const html = await readFile('./index.html');
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.end(html);
        } catch (err) {
            response.writeHead(500);
            response.end("Error al leer index.html");
        }
        return;
    }

    // --- DELEGACIÓN A MÓDULOS DE SRC (Enrutador) ---
    
    if (request.url.startsWith('/grupos')) {
        return manejarGrupos(request, response);
    }
    if (request.url.startsWith('/auth')) {
        return manejarAuth(request, response);
    }
    if (request.url.startsWith('/permisos')) {
        return manejarPermisos(request, response);
    }

    // Respuesta por defecto si no encuentra la ruta
    response.writeHead(404);
    response.end("Ruta no encontrada");
}

const server = createServer(serverHandler);

server.listen(3000, '127.0.0.1', function() {
    console.log('Servidor V2 corriendo en puerto 3000 con todos los ABM integrados');
});