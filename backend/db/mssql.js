const mssql = require('mssql');
const util = require('util');
var config = {
    user: 'sa',
    password: 'SqlServer@2019#',
    server: '74.208.210.225',
    database: 'LudoBetting'
}

const mssqlPoolPromise = new mssql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL')
        return pool
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));



//mssqlPool.query = util.promisify(mssqlPool.query); // Magic happens here.
module.exports = mssqlPoolPromise;
