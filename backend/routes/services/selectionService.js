const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;





let getNameBySelectionId = async (selection_id,match_id) => {
	try {
		let marketName = await MysqlPool.query('select name,liability_type from market_selection where selection_id=? and match_id=?', [selection_id, match_id]);
		if (marketName === null) {

			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		} else {
			return resultdb(CONSTANTS.SUCCESS, marketName[0]);
		}
	} catch (error) {
        logger.errorlog.error("getNameBySelectionId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getSelectionByMarketId = async (marketId) => {
    try {
        let selections = await MysqlPool.query('select *,0 stack from market_selection where market_id=?',[marketId]);
        if (selections === null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        } else {
            return resultdb(CONSTANTS.SUCCESS, selections);
        }
    } catch (error) {
        logger.errorlog.error("getSelectionByMarketId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let getSelectionByMatchId = async (matchId) => {
    try {
        let selections = await MysqlPool.query('select *,0 stack from market_selection where match_id=?',[matchId]);
        if (selections === null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        } else {
            return resultdb(CONSTANTS.SUCCESS, selections);
        }
    } catch (error) {
        logger.errorlog.error("getSelectionByMatchId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getAlternativeByMatchId = async (matchId,skipRows) => {
    try {
        let selections = await MysqlPool.query(`select *,SUBSTRING_INDEX(name,' ',1) as name
            from (select* , ROW_NUMBER() over () as srNo from market_selection) t
            where t.match_id= ? and  (t.srNo % ?) = 1
            `,[matchId,skipRows]);
        if (selections === null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        } else {
            return resultdb(CONSTANTS.SUCCESS, selections);
        }
    } catch (error) {
        logger.errorlog.error("getAlternativeByMatchId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};






module.exports = {
	getNameBySelectionId,
    getSelectionByMarketId,
    getSelectionByMatchId,
    getAlternativeByMatchId,
};
