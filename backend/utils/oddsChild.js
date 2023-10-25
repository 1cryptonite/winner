let axios = require('axios');
const interval = require('interval-promise');
const redis = require('redis');
const client = redis.createClient(6379, '127.0.0.1');
let i=0;

const getCricketDataOdds = async (marketid) => {
	try {
		const urlcricket = 'http://178.79.178.166/api/?marketid=' + marketid + '&apikey=ieyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InNoYWt0aXNoYXJtYSIsImlhd';
		const response = await axios.get(urlcricket);
		const data = response.data;
		return data;

	} catch (error) {
		//console.log(error);
	}
};


