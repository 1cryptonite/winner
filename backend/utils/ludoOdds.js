const interval = require('interval-promise');
const MysqlPool = require('../db');
const mssql = require('../db/mssql');
const settings = require('./../config/settings');
const redis = require('../db/redis');
const axios = require('axios');


let currentDate = Date.now()/1000;

const match_prefix='LUDO_';
let golabBetfairOddsFormate= settings.golabBetfairOddsFormate;

let autotime = golabBetfairOddsFormate.autotime;
let global_market_id = 0 ;
global.globel_local_odds_data = 0 ;
async function getMatchDetails() {

	//MysqlPool.query("");

	let marketData = {
		"subcription_id":settings.SUBCRIPTION_ID,
		"c_player_id":1, // 1,2
		"dice_no":6,
		"pin_open":0, // 0,1,2
		"pin_in_home":1, // 0,1,2
		"pin_bet":0, // 0,1,2
		"winner":1, // 0,1,2
		"completed":0, // 0,1
		"suspended":0 // 0,1
	};





	try {
		const pool = await mssql;

		const result = await pool.request().query("select top 1 *  from Tbl_MarketBet where SubscriptionId='"+marketData.subcription_id+"'  order by id desc");


		const  match_data = {
			sport_id: -6,
			series_id: -6,
			match_id: -8,
			name: "Match Odds",
			is_manual: 0,
			create_at: currentDate,
			update_at: currentDate,
		};

		if(result.recordset.length > 0){

			if(result.recordset[0].IsCompleted ==true){
				match_data.market_id = match_prefix+(parseInt(result.recordset[0]['Id'])+1);
				marketData.market_id  =match_data.market_id;
				match_data.runner_json = JSON.stringify([
					{
						selectionId: 1,
						name: "Player A",
						back: settings.backdefault,
						lay: settings.layDefault
					},
					{
						selectionId: 2,
						name: "Player B",
						back: settings.backdefault,
						lay: settings.layDefault
					}
				]);
				axios.post(settings.BASE_URL + "api/v1/autoCreateMarket", match_data);

			}else{
				marketData.market_id = result.recordset[0]['MarketId'];
			}
		}else{
			marketData.market_id = match_prefix+'0';
		}

		 await pool.request().query('exec Usp_MarketBet "'+marketData.subcription_id+'","'+marketData.market_id+'",'+marketData.c_player_id+','+marketData.dice_no+','+marketData.pin_open+','+marketData.pin_in_home+','+marketData.pin_bet+','+marketData.winner);

		golabBetfairOddsFormate.runners = [
			{
				"totalMatched": 0,
				"selectionId": 1,
				"name": "Player A",
				"status": "1",
				"handicap": 0,
				"ex": {
					"availableToBack": [{"size":  0, "price": 1.98,"status": "1"}],
					"availableToLay": [{"size":  0, "price": 1.98,"status": "1"}]
				}
			},
			{
				"totalMatched": 0,
				"selectionId": 2,
				"name": "Player B",
				"status": "1",
				"handicap": 0,
				"ex": {
					"availableToBack": [{"size":  0, "price": 1.98,"status": "1"}],
					"availableToLay": [{"size":  0, "price": 1.98,"status": "1"}]
				}
			}

		];
		//golabBetfairOddsFormate.autotime =autotime;
		golabBetfairOddsFormate.marketId = marketData.market_id;
		global_market_id = marketData.market_id;
		global.globel_local_odds_data =  golabBetfairOddsFormate;
		await redis.localClient.set("ODDS_" + marketData.market_id, JSON.stringify(globel_local_odds_data));

	} catch (err) {
		console.log(err)
	}


}



async function oddsGlobal() {
	await getMatchDetails();
	interval(async () => {
		await getMatchDetails();
	}, 5000);

	interval(async () => {
		console.log("sdhfkjds");
		global.globel_local_odds_data.autotime = autotime = autotime==0 ? 30: autotime-1;
		if(autotime < 4){
			global.globel_local_odds_data.runners = [
				{
					"totalMatched": 0,
					"selectionId": 1,
					"name": "Player A",
					"status": "0",
					"handicap": 0,
					"ex": {
						"availableToBack": [{"size":  0, "price": 0,"status": "0"}],
						"availableToLay": [{"size":  0, "price": 0,"status": "0"}]
					}
				},
				{
					"totalMatched": 0,
					"selectionId": 2,
					"name": "Player B",
					"status": "0",
					"handicap": 0,
					"ex": {
						"availableToBack": [{"size":  0, "price": 0,"status": "0"}],
						"availableToLay": [{"size":  0, "price": 0,"status": "0"}]
					}
				}

			];
			global.globel_local_odds_data.status = 'SUSPENDED';
		}else{
			global.globel_local_odds_data.runners = [
				{
					"totalMatched": 0,
					"selectionId": 1,
					"name": "Player A",
					"status": "1",
					"handicap": 0,
					"ex": {
						"availableToBack": [{"size":  0, "price": 1.98,"status": "1"}],
						"availableToLay": [{"size":  0, "price": 1.98,"status": "1"}]
					}
				},
				{
					"totalMatched": 0,
					"selectionId": 2,
					"name": "Player B",
					"status": "1",
					"handicap": 0,
					"ex": {
						"availableToBack": [{"size":  0, "price": 1.98,"status": "1"}],
						"availableToLay": [{"size":  0, "price": 1.98,"status": "1"}]
					}
				}

			];
			global.globel_local_odds_data.status = 'OPEN';
		}
		await redis.localClient.set("ODDS_" + global_market_id, JSON.stringify(global.globel_local_odds_data));
	}, 1000);
}
//oddsGlobal();
module.exports = oddsGlobal;