export function procesarBody(req) {
    return new Promise(function(resolve, reject) {
        let body = '';
        req.on('data', function(chunk) {
            body += chunk.toString();
        });
        req.on('end', function() {
            try {
                // Si el body parece un JSON, lo parseamos como JSON
                if (body.trim().startsWith('{')) {
                    resolve(JSON.parse(body));
                } else {
                    // Si no, intentamos como formulario tradicional
                    const params = new URLSearchParams(body);
                    resolve(Object.fromEntries(params));
                }
            } catch (e) {
                reject(e);
            }
        });
    });
}