const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const connConfig = require('../../db/indexTest');
const userService = require('./userService');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;





let saveUserSettings = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('INSERT INTO user_setting_sport_wise SET ?', [data]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("saveUserSettings",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let updateUserSettings = async function (parameter) {
	try {
		let bet_delay = parameter.bet_delay;
		let session_delay = parameter.session_delay;

		let resFromDB = await MysqlPool.query('UPDATE user_setting_sport_wise SET ? WHERE sport_id = ? AND user_id = ? AND id = ?', [parameter, parameter.sport_id, parameter.user_id, parameter.id]);

		let qry = 'UPDATE user_setting_sport_wise SET bet_delay = CASE WHEN(bet_delay < ?) THEN ? ELSE bet_delay END, session_delay = CASE WHEN(session_delay < ?) THEN ? ELSE session_delay END WHERE sport_id = ? AND user_id IN (WITH recursive chield (id) AS (SELECT id FROM users WHERE id = ? UNION ALL SELECT p.id FROM users p INNER JOIN chield ON p.parent_id = chield.id) SELECT id FROM chield WHERE id != ?)';

		await MysqlPool.query(qry, [bet_delay, bet_delay, session_delay, session_delay, parameter.sport_id, parameter.user_id, parameter.user_id]);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateUserSettings",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateUserSettingsAllSport = async function (globalInputArray, user_id) {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();

		let globalInputArrayData = globalInputArray.data;
		for (let i in globalInputArrayData){
			let element = globalInputArrayData[i];
			let userSetting = await getUserSettingBySportId(element.sport_id, user_id);

			if (userSetting.statusCode === CONSTANTS.SUCCESS && userSetting.data.length > 0) {
				let qry1 = 'UPDATE user_setting_sport_wise SET bet_delay = ?, session_delay = ?, match_commission = ?, session_commission = ?, super_admin_commission = ?, bookmaker_market_commission = ?, max_exposure = ?, max_profit = ?, min_exposure = ?, odds_max_stack = ?, odds_min_stack = ?, session_max_stack = ?, session_min_stack = ?, winning_limit = ?, pdc_charge=?, pdc_refund=?,max_session_liability=? WHERE sport_id = ? AND user_id = ? AND id = ?;';

				await conn.query(qry1,
					[
						element.bet_delay,
						element.session_delay,
						element.match_commission,
						element.session_commission,
						element.super_admin_commission,
						element.bookmaker_market_commission,
						element.max_exposure,
						element.max_profit,
						element.min_exposure,
						element.odds_max_stack,
						element.odds_min_stack,
						element.session_max_stack,
						element.session_min_stack,
						element.winning_limit,
						element.pdc_charge,
						element.pdc_refund,
						element.max_session_liability,
						element.sport_id, user_id, element.id]
				);
				let subStr = ``;
				if (element.user_type_id == 1) {
					subStr = subStr + `parent_admin_id = ?`;
				} else if (element.user_type_id == 2) {
					subStr = subStr + `parent_master_id = ?`;
				} else if (element.user_type_id == 3) {
					subStr = subStr + `parent_super_agent_id = ?`;
				} else if (element.user_type_id == 4) {
					subStr = subStr + `parent_agent_id = ?`;
				} else {
					subStr = 'user_id = ?';
				}
				let qry = `UPDATE user_setting_sport_wise SET 
				bet_delay = CASE WHEN(bet_delay IS NULL OR bet_delay < ? OR bet_delay = 0) THEN ? ELSE bet_delay END, 
				session_delay = CASE WHEN(session_delay IS NULL OR session_delay < ? OR session_delay = 0) THEN ? ELSE session_delay END, 
				odds_min_stack = CASE WHEN(odds_min_stack IS NULL OR odds_min_stack < ? OR odds_min_stack = 0) THEN ? ELSE odds_min_stack END, 
				session_min_stack = CASE WHEN(session_min_stack IS NULL OR session_min_stack < ? OR session_min_stack = 0) THEN ? ELSE session_min_stack END, 
				min_exposure = CASE WHEN(min_exposure IS NULL OR min_exposure < ? OR min_exposure = 0) THEN ? ELSE min_exposure END, 
				winning_limit = CASE WHEN(winning_limit IS NULL OR winning_limit < ? OR winning_limit = 0) THEN ? ELSE winning_limit END, 
				match_commission = CASE WHEN(match_commission IS NULL OR match_commission < ? OR match_commission = 0) THEN ? ELSE match_commission END, 
				bookmaker_market_commission = CASE WHEN(bookmaker_market_commission IS NULL OR bookmaker_market_commission < ? OR bookmaker_market_commission = 0) THEN ? ELSE bookmaker_market_commission END, 
				session_commission = CASE WHEN(session_commission IS NULL OR session_commission > ? OR session_commission = 0) THEN ? ELSE session_commission END, 
				odds_max_stack = CASE WHEN(odds_max_stack IS NULL OR odds_max_stack > ? OR odds_max_stack = 0) THEN ? ELSE odds_max_stack END, 
				session_max_stack = CASE WHEN(session_max_stack IS NULL OR session_max_stack > ? OR session_max_stack = 0) THEN ? ELSE session_max_stack END, 
				max_profit = CASE WHEN(max_profit IS NULL OR max_profit > ? OR max_profit = 0) THEN ? ELSE max_profit END, 
				max_session_liability = CASE WHEN(max_session_liability IS NULL OR max_session_liability > ? OR max_session_liability = 0) THEN ? ELSE max_session_liability END, 
				max_exposure = CASE WHEN(max_exposure IS NULL OR max_exposure > ? OR max_exposure = 0) THEN ? ELSE max_exposure END 
				WHERE sport_id = ? and user_id IN(SELECT id
FROM users
WHERE ${subStr})`;

				let parArr = [element.bet_delay, element.bet_delay,
					element.session_delay, element.session_delay,
					element.odds_min_stack, element.odds_min_stack,
					element.session_min_stack, element.session_min_stack,
					element.min_exposure, element.min_exposure,
					element.winning_limit, element.winning_limit,
					element.match_commission, element.match_commission,
					element.bookmaker_market_commission, element.bookmaker_market_commission,
					element.session_commission, element.session_commission,
					element.odds_max_stack, element.odds_max_stack,
					element.session_max_stack, element.session_max_stack,
					element.max_profit, element.max_profit,
					element.max_session_liability, element.max_session_liability,
					element.max_exposure, element.max_exposure,
					element.sport_id, user_id];
				await conn.query(qry, parArr);

			}
		}
		await conn.commit();
        conn.release();
		return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');
	} catch (error) {
		logger.errorlog.error("updateUserSettingsAllSport",error);
		await conn.rollback();
        conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getUserSetting = async (user_id) => {
	try {

		let userDetail = await MysqlPool.query('SELECT user_type_id FROM users WHERE id = ? LIMIT 1;', [user_id]);
		if (userDetail.length > 0) {
			let user_type_id = userDetail[0].user_type_id;
			if(user_type_id == 1){
				let fancyQuery = 'select a.*, ? AS user_type_id, b.name AS sport_name, b.is_super_admin_commission, b.is_allow_bookmaker_market, d.match_commission AS parent_match_commission, d.session_commission AS parent_session_commission, d.super_admin_commission AS parent_super_admin_commission, d.bookmaker_market_commission AS parent_bookmaker_market_commission, d.bet_delay AS parent_bet_delay, d.session_delay AS parent_session_delay, d.odds_max_stack AS parent_odds_max_stack, d.odds_min_stack AS parent_odds_min_stack, d.session_max_stack AS parent_session_max_stack, d.session_min_stack AS parent_session_min_stack, d.max_profit AS parent_max_profit, d.max_loss AS parent_max_loss, d.min_exposure AS parent_min_exposure, d.max_exposure AS parent_max_exposure, d.winning_limit AS parent_winning_limit, '+ CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE +' AS super_admin_commission_type, a.pdc_charge, a.pdc_refund from user_setting_sport_wise AS a INNER JOIN sports AS b ON (a.sport_id = b.sport_id) LEFT JOIN user_setting_sport_wise d ON (a.parent_id = d.user_id AND a.sport_id = d.sport_id) where b.is_active = "1" AND a.user_id = ? ORDER BY b.order_by ASC;';

				let resFromDB = await MysqlPool.query(fancyQuery, [user_type_id, user_id]);
				return resultdb(CONSTANTS.SUCCESS, resFromDB);
			}else {
				let parent_ids = await userService.getParesntsIds(user_id);
				parent_ids = parent_ids.data.ids;
				let fancyQuery = 'select a.*, ? AS user_type_id, b.name AS sport_name, b.is_super_admin_commission, b.is_allow_bookmaker_market, d.match_commission AS parent_match_commission, d.session_commission AS parent_session_commission, d.super_admin_commission AS parent_super_admin_commission, d.bookmaker_market_commission AS parent_bookmaker_market_commission, d.bet_delay AS parent_bet_delay, d.session_delay AS parent_session_delay, d.odds_max_stack AS parent_odds_max_stack, d.odds_min_stack AS parent_odds_min_stack, d.session_max_stack AS parent_session_max_stack, d.session_min_stack AS parent_session_min_stack, d.max_profit AS parent_max_profit, d.max_loss AS parent_max_loss, d.min_exposure AS parent_min_exposure, d.max_exposure AS parent_max_exposure, d.winning_limit AS parent_winning_limit, '+ CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE +' AS super_admin_commission_type, a.pdc_charge, a.pdc_refund from user_setting_sport_wise AS a INNER JOIN sports AS b ON (a.sport_id = b.sport_id) LEFT JOIN deactive_sport AS c ON(b.sport_id = c.sport_id AND c.user_id IN(?)) LEFT JOIN user_setting_sport_wise d ON (a.parent_id = d.user_id AND a.sport_id = d.sport_id) where b.is_active = "1" AND a.user_id = ? AND c.id IS NULL ORDER BY b.order_by ASC;';

				let resFromDB = await MysqlPool.query(fancyQuery, [user_type_id, parent_ids.split(','), user_id]);
				return resultdb(CONSTANTS.SUCCESS, resFromDB);
			}
		}else{
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}

	} catch (error) {
		logger.errorlog.error("getUserSetting",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getUserSettingBySportId = async (sport_id, user_id) => {
	try {
		let fancyQuery = 'SELECT * FROM user_setting_sport_wise WHERE sport_id = ? AND user_id = ? LIMIT 1';
		let resFromDB = await MysqlPool.query(fancyQuery, [sport_id, user_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("getUserSettingBySportId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let validateUserSettings = async (parent_id, element, user_type_id) => {



	try {
		let msg = '';

		if(element.bet_delay === '' || element.bet_delay === null){
			msg += 'Enter bet delay for ' + element.sport_name + ' !\n';
		}
		if(element.session_delay === '' || element.session_delay === null){
			msg += 'Enter session delay for ' + element.sport_name + ' !\n';
		}
		if(element.odds_min_stack === '' || element.odds_min_stack === null){
			msg += 'Enter minimum odds stack for ' + element.sport_name + ' !\n';
		}
		if(element.session_min_stack === '' || element.session_min_stack === null){
			msg += 'Enter minimum session stack for ' + element.sport_name + ' !\n';
		}
		if(element.min_exposure === '' || element.min_exposure === null){
			msg += 'Enter minimum exposure for ' + element.sport_name + ' !\n';
		}
		if(element.winning_limit === '' || element.winning_limit === null){
			msg += 'Enter winning limit for ' + element.sport_name + ' !\n';
		}
		if(element.match_commission === '' || element.match_commission === null){
			msg += 'Enter match commission for ' + element.sport_name + ' !\n';
		}
		if(element.session_commission === '' || element.session_commission === null){
			msg += 'Enter session commission for ' + element.sport_name + ' !\n';
		}
		if(element.bookmaker_market_commission === '' || element.bookmaker_market_commission === null){
			msg += 'Enter bookmaker market commission for ' + element.sport_name + ' !\n';
		}
		if(element.odds_max_stack === '' || element.odds_max_stack === null){
			msg += 'Enter maximum odds stack for ' + element.sport_name + ' !\n';
		}
		if(element.session_max_stack === '' || element.session_max_stack === null){
			msg += 'Enter maximum session stack for ' + element.sport_name + ' !\n';
		}
		if(element.max_profit === '' || element.max_profit === null){
			msg += 'Enter maximum profit for ' + element.sport_name + ' !\n';
		}
		if(element.max_exposure === '' || element.max_exposure === null){
			msg += 'Enter maximum exposure for ' + element.sport_name + ' !\n';
		}

		if(msg == '') {

			if(/*parent_id != 1 && */ parent_id != 0) {

				let qry = 'SELECT * FROM user_setting_sport_wise AS a WHERE a.user_id = ? AND a.sport_id = ? AND (a.bet_delay > ? OR a.session_delay > ? OR odds_min_stack > ? OR session_min_stack > ? OR min_exposure > ? OR winning_limit > ? OR match_commission > ? OR (session_commission < ? AND ? != 1) OR (session_commission > ? AND ? = 1) OR bookmaker_market_commission > ? OR odds_max_stack < ? OR session_max_stack < ? OR max_exposure < ? OR a.bet_delay IS NULL OR a.session_delay IS NULL OR odds_min_stack IS NULL OR session_min_stack IS NULL OR min_exposure IS NULL OR winning_limit IS NULL OR match_commission IS NULL OR session_commission IS NULL OR bookmaker_market_commission IS NULL OR odds_max_stack < ? OR session_max_stack < ? OR max_profit < ? OR max_session_liability < ? OR max_exposure < ? ) LIMIT 1';

				let resFromDB = await MysqlPool.query(qry, [parent_id, element.sport_id, element.bet_delay, element.session_delay, element.odds_min_stack, element.session_min_stack, element.min_exposure, element.winning_limit, element.match_commission, element.session_commission, CONSTANTS.IS_SESSION_COMMISSION_TO_ADMIN, element.session_commission, CONSTANTS.IS_SESSION_COMMISSION_TO_ADMIN, element.bookmaker_market_commission, element.odds_max_stack, element.session_max_stack, element.max_exposure, element.odds_max_stack, element.session_max_stack, element.max_profit,element.max_session_liability, element.max_exposure]);

				if (resFromDB.length == 0) {
					return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');
				} else {
					if (resFromDB[0]['bet_delay'] === null) {
						msg += 'Bet delay not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['bet_delay'] > element.bet_delay && resFromDB[0]['bet_delay'] != 0) {
						msg += 'Bet delay ' + resFromDB[0]['bet_delay'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['session_delay'] === null) {
						msg += 'Session delay not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['session_delay'] > element.session_delay && resFromDB[0]['session_delay'] != 0) {
						msg += 'Session delay ' + resFromDB[0]['session_delay'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['odds_min_stack'] === null) {
						msg += 'Minimum odds stack not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['odds_min_stack'] > element.odds_min_stack && resFromDB[0]['odds_min_stack'] != 0) {
						msg += 'Minimum odds stack ' + resFromDB[0]['odds_min_stack'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['session_min_stack'] === null) {
						msg += 'Minimum session stack not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['session_min_stack'] > element.session_min_stack && resFromDB[0]['session_min_stack'] != 0) {
						msg += 'Minimum session stack ' + resFromDB[0]['session_min_stack'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['min_exposure'] === null) {
						msg += 'Minimum exposure not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['min_exposure'] > element.min_exposure && resFromDB[0]['min_exposure'] != 0) {
						msg += 'Minimum exposure ' + resFromDB[0]['min_exposure'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['winning_limit'] === null) {
						msg += 'Winning limit not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['winning_limit'] > element.winning_limit && resFromDB[0]['winning_limit'] != 0) {
						msg += 'Winning limit ' + resFromDB[0]['winning_limit'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['match_commission'] === null) {
						msg += 'Match commission not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['match_commission'] > element.match_commission && resFromDB[0]['match_commission'] != 0) {
						msg += 'Match commission ' + resFromDB[0]['match_commission'] + ' required for ' + element.sport_name + ' !\n';
					}

					if (resFromDB[0]['session_commission'] === null) {
						msg += 'Session commission not available of parent for ' + element.sport_name + ' !\n';
					} else if ((resFromDB[0]['session_commission'] < element.session_commission && CONSTANTS.IS_SESSION_COMMISSION_TO_ADMIN != 1) || (resFromDB[0]['session_commission'] > element.session_commission && CONSTANTS.IS_SESSION_COMMISSION_TO_ADMIN == 1)) {
						msg += 'Session commission ' + resFromDB[0]['session_commission'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['bookmaker_market_commission'] === null) {
						msg += 'Bookmaker market commission not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['bookmaker_market_commission'] > element.bookmaker_market_commission && resFromDB[0]['bookmaker_market_commission'] != 0) {
						msg += 'Bookmaker market commission ' + resFromDB[0]['bookmaker_market_commission'] + ' required for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['odds_max_stack'] === null) {
						msg += 'Maximum odds stack not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['odds_max_stack'] < element.odds_max_stack && resFromDB[0]['odds_max_stack'] != 0) {
						msg += 'Maximum odds stack ' + resFromDB[0]['odds_max_stack'] + ' allowed for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['session_max_stack'] === null) {
						msg += 'Maximum session stack not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['session_max_stack'] < element.session_max_stack && resFromDB[0]['session_max_stack'] != 0) {
						msg += 'Maximum session stack ' + resFromDB[0]['session_max_stack'] + ' allowed for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['max_profit'] === null) {
						msg += 'Maximum profit not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['max_profit'] < element.max_profit && resFromDB[0]['max_profit'] != 0) {
						msg += 'Maximum profit ' + resFromDB[0]['max_profit'] + ' allowed for ' + element.sport_name + ' !\n';
					}
					if (resFromDB[0]['max_session_liability'] === null) {
						msg += 'Maximum profit not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['max_session_liability'] < element.max_session_liability && resFromDB[0]['max_session_liability'] != 0) {
						msg += 'Maximum profit ' + resFromDB[0]['max_session_liability'] + ' allowed for ' + element.sport_name + ' !\n';
					}

					if (resFromDB[0]['max_exposure'] === null) {
						msg += 'Maximum exposure not available of parent for ' + element.sport_name + ' !\n';
					} else if (resFromDB[0]['max_exposure'] < element.max_exposure && resFromDB[0]['max_exposure'] != 0) {
						msg += 'Maximum exposure ' + resFromDB[0]['max_exposure'] + ' allowed for ' + element.sport_name + ' !\n';
					}

					if(msg == '') {
						return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');
					}else{
						return resultdb(CONSTANTS.VALIDATION_ERROR, msg);
					}
				}
			}else{
				return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');
			}
		}else{
			return resultdb(CONSTANTS.VALIDATION_ERROR, msg);
		}
	} catch (error) {
		logger.errorlog.error("validateUserSettings",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}

};


module.exports = {
	saveUserSettings,
	updateUserSettings,
	getUserSetting,
	getUserSettingBySportId,
	validateUserSettings,
	updateUserSettingsAllSport
};
