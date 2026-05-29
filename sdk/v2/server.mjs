import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import * as handlers from './handlers.mjs';


function loadConfig() {
    return JSON.parse(readFileSync('./config.json', 'utf-8'));
}
const config = loadConfig();


const router = new Map();

router.set('/list', handlers.listarUsuariosHandler);
router.set('/', handlers.defaultHandler);
router.set('/register', handlers.registerHandler);
router.set('/login', handlers.loginHandler);
router.set('/showMessage', handlers.showMessageHandler);
router.set('/delete', handlers.deleteHandler);


router.set('/group/create', handlers.groupCreateHandler);
router.set('/group/delete', handlers.groupDeleteHandler);
router.set('/group/update', handlers.groupUpdateHandler);


router.set('/member/create', handlers.memberCreateHandler);
router.set('/member/delete', handlers.memberDeleteHandler);


router.set('/endpoint/create', handlers.endpointCreateHandler);
router.set('/endpoint/delete', handlers.endpointDeleteHandler);
router.set('/endpoint/update', handlers.endpointUpdateHandler);


async function requestDispatcher(request, response) {
    const url = new URL(request.url, `http://${config.server.ip}`);
    const handler = router.get(url.pathname);

    if (handler) {
        
        await handler(request, response);
    } else {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('Not Found');
    }
}

// 5. ENCENDEMOS EL SERVIDOR
const server = createServer(requestDispatcher);
server.listen(config.server.port, config.server.ip, () => {
    console.log("--------------------------------------------------");
    console.log(`Servidor v2 listo en http://${config.server.ip}:${config.server.port}`);
    console.log("--------------------------------------------------");
});