import { procesarBody } from './utils.js';
import { login } from './model.js';

export async function manejarAuth(request, response) {
    if (request.url === '/auth/login' && request.method === 'POST') {
        try {
            const data = await procesarBody(request);
            const user = login(data.username, data.password);
            response.writeHead(200, { 'Content-Type': 'application/json' });
            if (user) {
                return response.end(JSON.stringify({ message: 'Login exitoso', usuario: user.username }));
            } else {
                return response.end(JSON.stringify({ message: 'Credenciales inválidas' }));
            }
        } catch (error) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            return response.end(JSON.stringify({ message: 'Error en el servidor' }));
        }
    }
    response.writeHead(404, { 'Content-Type': 'application/json' });
    return response.end(JSON.stringify({ message: 'Ruta no encontrada' }));
}