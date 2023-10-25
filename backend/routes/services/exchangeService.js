const client = require('../../db/redis');
const lodash = require('lodash');
const	globalFunction = require('../../utils/globalFunction');
const	CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

let getOddsByMarketId = async (market_id, is_manual_odds='0') => {
	try {
        let odds;
        if(is_manual_odds == '1') {
            odds = await client.localClient.get('ODDS_' + market_id);
        }else{
            odds = await client.client.get('ODDS_' + market_id);
        }

		return resultdb(CONSTANTS.SUCCESS,JSON.parse(odds));
	} catch (e) {
        logger.errorlog.error("getOddsByMarketId",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

/**
 *
 * @param market_id
 * @param selection_id
 * @param is_back
 * @returns {Promise<{statusCode, data}>}
 */
let getOddsRate = async (market_id,selection_id,is_back,is_live_sport,is_manual_odds='0') => {

    try {
        let status = 0;
        let currentOdss = 0;
        let selectionData = [];
        let odds;
        if(is_manual_odds == '1') {
            odds = await client.localClient.get('ODDS_' + market_id);
        }else{
            odds = await client.client.get('ODDS_' + market_id);
        }
        odds  = JSON.parse(odds);
        //console.log(odds)
        if(odds.selectionType=='outer'){

            selectionData = odds.runners_org.filter(function (data) {
                return data.selectionId==selection_id
            });

        }else{
             selectionData = odds.runners.filter(function (data) {
                return data.selectionId==selection_id
            });

        }

        if (is_back == 1) {

            currentOdss = selectionData[0].ex.availableToBack[0].price;
            if(is_manual_odds == '1') {
                status = selectionData[0].status;
            }
            else if (is_live_sport == 1) {


                status = selectionData[0].ex.availableToBack[0].status;
            }
            else {
                status = odds.status
            }
        } else {
            currentOdss = selectionData[0].ex.availableToLay[0].price;
            if(is_manual_odds == '1') {
                status = selectionData[0].status;
            }
            else if (is_live_sport == 1) {
                status = selectionData[0].ex.availableToLay[0].status;
            }
            else {
                status = odds.status
            }
        }

        return resultdb(CONSTANTS.SUCCESS,{
            odds:currentOdss,
            status:status
        });

    } catch (error) {
        logger.errorlog.error("getOddsRate",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};



let getOddsByMarketIds = async (market_ids, market_ids_manual = []) => {
    try {
        let tempData = {};
    	let data=[];
    	let data_manual=[];
        let odds = [];
        let odds_manual = [];
        market_ids.forEach(function (market_id) {
            data.push('ODDS_'+market_id);
        });

        market_ids_manual.forEach(function (market_id) {
            data_manual.push('ODDS_'+market_id);
        });


        if(data.length > 0){
            odds = await client.client.mget(data);
        }
        if(data_manual.length > 0){
            odds_manual = await client.localClient.mget(data_manual);
        }

        let final_odds = odds.concat(odds_manual);

        final_odds.map(function (o) {
            if(o!=null){
                let oddsTemp = JSON.parse(o);
                tempData[oddsTemp.marketId] = oddsTemp;
            }

        });


        return resultdb(CONSTANTS.SUCCESS,tempData);

    } catch (error) {
        logger.errorlog.error("getOddsByMarketIds",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getOddsByMarketIdsWithOutKeyValuePair = async (market_ids) => {
    try {
        let tempData = [];
        let data=[];
        market_ids.forEach(function (market_id) {
            data.push('ODDS_'+market_id);
        });

        let odds=await client.client.mget(data);
        odds.map(function (o) {
            if(o!=null){
                tempData.push(JSON.parse(o));
            }

        });
        return resultdb(CONSTANTS.SUCCESS,tempData);


    } catch (error) {
        logger.errorlog.error("getOddsByMarketIdsWithOutKeyValuePair",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getFancyByFancyIds = async (fancy_ids, fancy_ids_manual = []) => {
    try {
        let tempData = {};
        let data=[];
        let data_manual=[];
        let odds = [];
        let odds_manual = [];
        fancy_ids.forEach(function (fancy_id) {
            data.push(fancy_id);
        });

        fancy_ids_manual.forEach(function (fancy_id) {
            data_manual.push(fancy_id);
        });

        if(data.length > 0){
            odds = await client.client.mget(data);
        }
        if(data_manual.length > 0){
            odds_manual = await client.localClient.mget(data_manual);
        }

        let final_odds = odds.concat(odds_manual);
        let all_fancy_ids = fancy_ids.concat(fancy_ids_manual);

        final_odds.map(function (o,i) {
            if(o!=null){
                let oddsTemp = JSON.parse(o);
                tempData[all_fancy_ids[i]] = oddsTemp;
            }

        });
        return resultdb(CONSTANTS.SUCCESS,tempData);

    } catch (error) {
        logger.errorlog.error("getFancyByFancyIds",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};




let getFancyByFancyId = async (fancy_id, is_manual_odds = '0') => {
	try {
        let odds;
        if(is_manual_odds == '1') {
            odds = await client.localClient.get(fancy_id);
        }else{
            odds=await client.client.get(fancy_id);
        }
        return resultdb(CONSTANTS.SUCCESS,JSON.parse(odds));
    } catch (error) {
        logger.errorlog.error("getFancyByFancyId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


module.exports = {
	getOddsByMarketId,
    getOddsByMarketIds,
    getFancyByFancyIds,
    getFancyByFancyId,
    getOddsByMarketIdsWithOutKeyValuePair,
    getOddsRate
};
