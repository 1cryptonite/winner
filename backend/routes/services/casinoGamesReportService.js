'use strict';
const settings = require('../../config/settings');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const MysqlPool = require('../../db');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

let plReport = async (user_id, user_type_id, game_type, from_date, to_date, page) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;

		let calc = '';
		if(page == 1){
			calc += ' SQL_CALC_FOUND_ROWS ';
		}

		let whereCond = ' user_id = ? ';
		let plField = ' user_pl ';
		switch (user_type_id) {
			case 1:
				whereCond = ' admin_id = ? ';
				plField = ' admin_pl ';
				break;
			case 2:
				whereCond = ' master_id = ? ';
				plField = ' master_pl ';
				break;
			case 3:
				whereCond = ' super_agent_id = ? ';
				plField = ' super_agent_pl ';
				break;
			case 4:
				whereCond = ' agent_id = ? ';
				plField = ' agent_pl ';
				break;
		}

		let params = [user_id];
		if(from_date !== "" && typeof from_date != 'undefined'){
			whereCond += " AND DATE(FROM_UNIXTIME(created_at)) >= ? "
			params.push(from_date);
		}
		if(to_date !== "" && typeof from_date != 'undefined'){
			whereCond += " AND DATE(FROM_UNIXTIME(created_at)) <= ? "
			params.push(to_date);
		}

		params.push(game_type);
		params.push(offset);
		params.push(limit);
		let qry = `SELECT ${calc} market_id, SUM(stack) AS stack, SUM(${plField}) AS pl, reffered_name, created_at FROM user_profit_loss WHERE ${whereCond} AND game_type = ? GROUP BY market_id ORDER BY id DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS total;`;
		let resFromDB1 = await MysqlPool.query(qry, params);

		return resultdb(CONSTANTS.SUCCESS, resFromDB1);
	} catch (e) {
		logger.errorlog.error("plReport",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	plReport
};
