const http = require('http');
const { handler } = require('./lambda_code/index.js');

const PORT = process.env.PORT || 5000;

const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key,Accept,Origin,X-Requested-With');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const urlObj = new URL(req.url, `http://localhost:${PORT}`);
    let bodyData = '';
    
    req.on('data', chunk => {
        bodyData += chunk.toString();
    });

    req.on('end', async () => {
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        const event = {
            requestContext: {
                http: {
                    method: req.method,
                    path: urlObj.pathname
                }
            },
            rawPath: urlObj.pathname,
            path: urlObj.pathname,
            httpMethod: req.method,
            queryStringParameters: queryParams,
            headers: req.headers,
            body: bodyData || null
        };

        try {
            const result = await handler(event);
            const status = result.statusCode || 200;
            const respHeaders = result.headers || {};
            
            // Set response headers
            for (const [key, val] of Object.entries(respHeaders)) {
                res.setHeader(key, val);
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.writeHead(status);
            res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body || {}));
        } catch (err) {
            console.error('[SERVER ERROR]', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error', message: err.message }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 LandLens Backend Server is running LIVE on http://localhost:${PORT}`);
    console.log(`📊 Connected to MySQL Database (srv1117.hstgr.io) & NVIDIA AI Services`);
});
