import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { db } from './db.mjs'; // Aquí ya importamos la conexión lista
import * as handlers from './handlers.mjs';

// 1. Cargamos la configuración primero
function load_config() {
    return JSON.parse(readFileSync('./config.json', 'utf-8'));
}
const config = load_config();

// 2. Creamos el router (DEBE ir antes de los .set)
const router = new Map();

// 3. Configuramos las rutas
router.set('/', handlers.default_handler);
router.set('/register', handlers.register_handler);
router.set('/showMessage', handlers.show_message_handler);
router.set('/login', handlers.login_handler); // Ya lo dejamos listo para el login

// 4. El despachador de peticiones
async function request_dispatcher(request, response) {
    const url = new URL(request.url, `http://${config.server.ip}`);
    const handler = router.get(url.pathname);

    if (handler) {
        // Ejecutamos el handler pasando request, response y config
        await handler(request, response, config);
    } else {
        response.writeHead(404);
        response.end('Not Found');
    }
}

// 5. Creamos y encendemos el servidor
const server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, () => {
    console.log("--------------------------------------------------");
    console.log(`Servidor v2 en http://${config.server.ip}:${config.server.port}`);
    console.log("--------------------------------------------------");
});