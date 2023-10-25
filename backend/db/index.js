const mysql = require('mysql');
const util = require('util');
const MysqlPool = mysql.createConnection({
    connectionLimit: 50000,
    host: '127.0.0.1',  
    user: 'root',
    password: 'Casino@123456',
    database: 'diamond',
    multipleStatements: true
});

MysqlPool.query = util.promisify(MysqlPool.query); // Promisify queries for async/await usage.

// Log a message when the connection pool is established.
MysqlPool.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.stack);
        console.log(err);
        return;
    }
    console.log('Connected to MySQL database as ID', MysqlPool.threadId);
});

module.exports = MysqlPool;

