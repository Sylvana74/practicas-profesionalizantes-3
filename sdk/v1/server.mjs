import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { connect_db } from './db.mjs';
import * as handlers from './handlers.mjs';

function load_config() {
    return JSON.parse(readFileSync('./config.json', 'utf-8'));
}

const config = load_config();
connect_db(config.database.path);

const router = new Map();
router.set('/', handlers.default_handler);
router.set('/register', handlers.register_handler);

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

const server = createServer(request_dispatcher);
server.listen(config.server.port, config.server.ip, () => {
    console.log(`Servidor en http://${config.server.ip}:${config.server.port}`);
});