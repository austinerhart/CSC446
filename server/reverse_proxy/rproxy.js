// CREDIT TO: https://dev.to/avinash_tare/how-i-build-a-scratch-proxy-server-using-nodejs-55d9\
const http = require('http');
const net = require('net');
const url = require('url');

const targetHost = process.env.HOST || '0.0.0.0';
const targetPort = parseInt(process.env.PORT || '5000');
const proxyPort = parseInt(process.env.RP_PORT || '8001');

console.log(`Reverse proxy config:
- Target Host: ${targetHost}
- Target Port: ${targetPort}
- Proxy Port: ${proxyPort}
`);

const server = http.createServer((clientReq, clientRes) => {
    console.log(`${new Date().toISOString()} - ${clientReq.method} ${clientReq.url}`);
    
    const options = {
        hostname: targetHost,
        port: targetPort,
        path: clientReq.url,
        method: clientReq.method,
        headers: {
            ...clientReq.headers,
            host: `${targetHost}:${targetPort}`
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        proxyRes.pipe(clientRes, {
            end: true
        });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        clientRes.writeHead(502);
        clientRes.end('Proxy Error');
    });

    clientReq.pipe(proxyReq, {
        end: true
    });
});

server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${proxyPort} is already in use`);
        process.exit(1);
    }
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Shutting down...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

server.listen(proxyPort, () => {
    console.log(`Reverse proxy server is listening on port ${proxyPort}`);
});