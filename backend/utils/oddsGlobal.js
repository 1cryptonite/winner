const interval = require('interval-promise');
const MysqlPool = require('../db');
const redis = require('../db/redis');

let matchDetails=[];

async function getMatchDetails() {
	let query='SELECT market_id as id,match_id, name FROM markets where is_active="1" and sport_id > 0 ';
	let marketList = await MysqlPool.query(query);
	matchDetails=JSON.parse(JSON.stringify(marketList));
}



async function oddsGlobal() {
    interval(async () => {
        await getMatchDetails();

    }, 5000);

	interval(async () => {
		if (matchDetails && matchDetails.length>0){
			for (let j in matchDetails){
				let matchDetail = matchDetails[j];
                //console.log(matchDetail.id,await  redis.get('ODDS_'+matchDetail.id));
			}
		}
	}, 1000);
}

module.exports = oddsGlobal;