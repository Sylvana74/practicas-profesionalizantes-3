import { procesarBody } from './utils.js';
import { asignarPermiso, revocarPermiso } from './model.js';

export async function manejarPermisos(request, response) {
    if (request.url === '/permisos/asignar' && request.method === 'POST') {
        try {
            const data = await procesarBody(request);
            asignarPermiso(data.id_group, data.id_endpoint);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Permiso asignado exitosamente.' }));
        } catch (error) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Error al asignar permiso' }));
        }
    }
    if (request.url === '/permisos/revocar' && request.method === 'POST') {
        try {
            const data = await procesarBody(request);
            revocarPermiso(data.id_group, data.id_endpoint);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Permiso revocado exitosamente.' }));
        } catch (error) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Error al revocar permiso' }));
        }
    }
}