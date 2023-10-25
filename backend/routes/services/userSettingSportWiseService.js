const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;


let getUserSettingBySport = async (sport_id,user_id) => {
	try {
		let sql = 'SELECT match_commission, session_commission, super_admin_commission, bookmaker_market_commission, IFNULL(bet_delay, 0) bet_delay, IFNULL(session_delay, 0) session_delay, odds_max_stack, odds_min_stack, session_max_stack,session_min_stack, max_profit, max_loss, min_exposure, max_exposure, winning_limit, pdc_charge, pdc_refund,max_session_liability FROM user_setting_sport_wise WHERE user_id =? AND sport_id=? LIMIT 0, 1;';

		let getResult = await MysqlPool.query(sql, [user_id,sport_id]);
		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (e) {
		logger.errorlog.error("getUserSettingBySport",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getSuperAdminCommissionBySport = async (sport_id, user_ids) => {
	try {
		let sql = 'SELECT CONCAT("{", commission_json, "}") AS super_admin_commission_json FROM(SELECT GROUP_CONCAT(CONCAT(\'"\',user_id, \'"\', ":", super_admin_commission) SEPARATOR "," ) AS commission_json FROM user_setting_sport_wise WHERE sport_id=? AND user_id IN(?)) AS final_json;';
		let getResult = await MysqlPool.query(sql, [sport_id, user_ids]);
		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (e) {
		logger.errorlog.error("getSuperAdminCommissionBySport",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getPDCBySportAndUsers = async (sport_id, user_ids) => {
	try {
		let sql = 'SELECT GROUP_CONCAT(user_id, "||", pdc_charge, "||", pdc_refund) AS pdc_data from user_setting_sport_wise WHERE sport_id = ? AND user_id IN(?);';
		let getResult = await MysqlPool.query(sql, [sport_id, user_ids]);

		let data = getResult[0].pdc_data.split(',');
		let final_data = {};

		data.forEach(async (element) => {
			let val = element.split('||');
			final_data[val[0]] = {
				pdc_charge: val[1],
				pdc_refund: val[2]
			}
		});

		return resultdb(CONSTANTS.SUCCESS, final_data);
	} catch (e) {
		logger.errorlog.error("getPDCBySportAndUsers",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
    getUserSettingBySport,
	getSuperAdminCommissionBySport,
	getPDCBySportAndUsers
};
