const mysql = require('mysql2/promise');


const connConfig = mysql.createPool({
    connectionLimit: 50000,
    host: '127.0.0.1',  
    user: 'root',
    password: 'Casino@123456',
    database: 'diamond',
    multipleStatements:true
});

/*const connConfig = mysql.createPool({
    connectionLimit: 1000,
    host: '176.58.125.113',
    user: 'betting',
    password: 'Pbetting',
    database: 'betting',
    multipleStatements:true,
    timezone: 'utc'
});*/

module.exports = connConfig;


