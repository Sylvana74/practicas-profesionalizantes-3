import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { db } from './db.mjs'; 
import * as handlers from './handlers.mjs';

// 1. Cargamos la configuración
function load_config() {
    return JSON.parse(readFileSync('./config.json', 'utf-8'));
}
const config = load_config();

// 2. CREAMOS EL ROUTER (Esto DEBE ir aquí, antes de los .set)
const router = new Map();

// 3. CONFIGURAMOS LAS RUTAS (Ahora sí podés usar router.set)
router.set('/', handlers.default_handler);
router.set('/register', handlers.register_handler);
router.set('/login', handlers.login_handler);
router.set('/showMessage', handlers.show_message_handler);
router.set('/delete', handlers.delete_handler); // <--- Esta es la línea nueva

// 4. EL DESPACHADOR
async function request_dispatcher(request, response) {
    const url = new URL(request.url, `http://${config.server.ip}`);
    const handler = router.get(url.pathname);

    if (handler) {
        await handler(request, response, config);
    } else {
        response.writeHead(404);
        response.end('Not Found');
    }
}

// 5. ENCENDEMOS EL SERVIDOR
const server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, () => {
    console.log("--------------------------------------------------");
    console.log(`Servidor v2 en http://${config.server.ip}:${config.server.port}`);
    console.log("--------------------------------------------------");
});