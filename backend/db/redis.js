const asyncRedis = require('async-redis');
const client = asyncRedis.createClient(6380, '127.0.0.1'); // live redis
// const client = asyncRedis.createClient(6389, '134.122.107.23'); // local testing
const localClient = asyncRedis.createClient(6379, '127.0.0.1');
module.exports = {client, localClient};

