import { procesarBody } from './utils.js';
import { crearGrupo, obtenerGrupos, borrarGrupo } from './model.js';

export async function manejarGrupos(request, response) {
    if (request.method === 'POST') {
        try {
            const data = await procesarBody(request);
            crearGrupo(data.nombre);
            response.writeHead(201, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Grupo creado exitosamente' }));
        } catch (error) {
            response.writeHead(500);
            return response.end(JSON.stringify({ message: 'Error al crear grupo' }));
        }
    }
    if (request.method === 'GET') {
        try {
            const grupos = obtenerGrupos();
            response.writeHead(200, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify(grupos));
        } catch (error) {
            response.writeHead(500);
            return response.end(JSON.stringify({ message: 'Error al obtener grupos' }));
        }
    }
    response.writeHead(405);
    return response.end(JSON.stringify({ message: 'Método no permitido' }));
}