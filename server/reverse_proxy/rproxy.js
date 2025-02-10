// CREDIT TO: https://dev.to/avinash_tare/how-i-build-a-scratch-proxy-server-using-nodejs-55d9\
const net = require("net");

const targetHost = process.env.HOST || '0.0.0.0';
const targetPort = parseInt(process.env.PORT || '5000');
const proxyPort = parseInt(process.env.RP_PORT || '8001');

console.log(`Reverse proxy config:
- Target Host: ${targetHost}
- Target Port: ${targetPort}
- Proxy Port: ${proxyPort}
`);

const server = net.createServer((clientSocket) => {
    console.log('New client connection');
    
    const targetSocket = net.createConnection({
        host: targetHost,
        port: targetPort
    }, () => {
        console.log(`Connected to target ${targetHost}:${targetPort}`);
        clientSocket.pipe(targetSocket);
        targetSocket.pipe(clientSocket);
    });

    targetSocket.on('error', (err) => {
        console.error('Error connecting to target:', err);
        clientSocket.end();
    });

    clientSocket.on('error', (err) => {
        console.error('Client socket error:', err);
        targetSocket.end();
    });
});

server.listen(proxyPort, () => {
    console.log(`Reverse proxy server is listening on port ${proxyPort}`);
});

server.on('error', (err) => {
    console.error('Server error:', err);
});