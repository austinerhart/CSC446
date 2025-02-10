const mysql = require('mysql2/promise');

async function connectWithRetry(config, maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const connection = await mysql.createConnection(config);
            console.log('Successfully connected to MySQL database');
            return connection;
        } catch (err) {
            if (attempt === maxAttempts) {
                console.error('Max connection attempts reached. Could not connect to MySQL:', err);
                throw err;
            }
            console.log(`Connection attempt ${attempt} failed. Retrying in 5 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

const dbConfig = {
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASS,
    database: "users"
};

async function initializeDatabase() {
    try {
        const connection = await connectWithRetry(dbConfig);
        
        connection.on('error', async (err) => {
            console.error('Database connection error:', err);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log('Lost connection to MySQL. Attempting to reconnect...');
                await initializeDatabase();
            } else {
                throw err;
            }
        });

        return connection;
    } catch (err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }
}

module.exports = { initializeDatabase };