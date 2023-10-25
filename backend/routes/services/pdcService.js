'use strict';
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const MysqlPool = require('../../db');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

const userSettingSportWiseService = require('../services/userSettingSportWiseService');
const betService = require('../services/betsService');
const sportsService = require('../services/sportsService');

let verifyPdcChargeMatchEntry = async (user_id, match_id, market_id, sport_id) => {
	try {
		let resFromDB= await MysqlPool.query('SELECT a.* FROM user_profit_loss AS a WHERE a.user_id = ? AND a.match_id = ? AND a.market_id = ? AND a.sport_id = ? LIMIT 1;', [user_id, match_id, market_id, sport_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("verifyPdcChargeMatchEntry",error);
		return resultdb(CONSTANTS.SERVER_ERROR, []);
	}
};

let checkPdcDeductedForMatch = async (user_id, match_id, sport_id) => {
	try {
		let resFromDB= await MysqlPool.query('SELECT a.* FROM user_profit_loss AS a WHERE a.user_id = ? AND a.match_id = ? AND a.sport_id = ? AND a.is_pdc_charged = "1" LIMIT 1;', [user_id, match_id, sport_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("checkPdcDeductedForMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, []);
	}
};

let deductPDC = async (data, is_not_verify_balance = 0) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();
		let is_pdc_charge = CONSTANTS.IS_PDC_CHARGE;
		if(is_pdc_charge == 1) {
			let is_pdc_distribute = CONSTANTS.IS_PDC_DISTRIBUTE;
			let user_pdc_charge = 0;
			let agent_pdc_charge = 0;
			let super_agent_pdc_charge = 0;
			let master_pdc_charge = 0;
			let admin_pdc_charge = 0;
			let agent_pdc_pl = 0;
			let super_agent_pdc_pl = 0;
			let master_pdc_pl = 0;
			let description = 'PDC Charge: ' + data.marketData.match_name;

			let reffered_name = data.marketData.series_name + '->' + data.marketData.match_name + '->' + data.marketData.market_name;

			let user_ids = [data.user_id, data.agent_id, data.super_agent_id, data.master_id, data.admin_id];
			let user_ids_ac_statement = [data.user_id, data.admin_id];

			if (is_pdc_distribute == 1) {
				let pdcSetting = await userSettingSportWiseService.getPDCBySportAndUsers(data.sport_id, user_ids);
				user_pdc_charge = -(pdcSetting.data[data.user_id].pdc_charge);
				agent_pdc_charge = -(pdcSetting.data[data.agent_id].pdc_charge);
				super_agent_pdc_charge = -(pdcSetting.data[data.super_agent_id].pdc_charge);
				master_pdc_charge = -(pdcSetting.data[data.master_id].pdc_charge);
				admin_pdc_charge = pdcSetting.data[data.master_id].pdc_charge;

				agent_pdc_pl = -(user_pdc_charge) + agent_pdc_charge;
				super_agent_pdc_pl = -(agent_pdc_charge) + super_agent_pdc_charge;
				master_pdc_pl = -(super_agent_pdc_charge) + master_pdc_charge;

				user_ids_ac_statement = [data.user_id, data.agent_id, data.super_agent_id, data.master_id, data.admin_id];
			} else {
				user_pdc_charge = -(data.pdc_charge);
				agent_pdc_charge = -(data.pdc_charge);
				super_agent_pdc_charge = -(data.pdc_charge);
				master_pdc_charge = -(data.pdc_charge);
				admin_pdc_charge = data.pdc_charge;
			}

			if (data.user_balance >= -(user_pdc_charge) || is_not_verify_balance == 1) {

				if(data.existingPDCData.length == 0) {
					await conn.query('INSERT INTO user_profit_loss (user_id, agent_id, super_agent_id, master_id, admin_id, sport_id, match_id, market_id, type, user_pdc_charge, agent_pdc_charge, super_agent_pdc_charge, master_pdc_charge, admin_pdc_charge, created_at, description, pdc_description, reffered_name, is_pdc_charged) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(NOW()), ?, ?, ?, ?)', [data.user_id, data.agent_id, data.super_agent_id, data.master_id, data.admin_id, data.sport_id, data.match_id, data.marketData.market_id, '1', user_pdc_charge, agent_pdc_charge, super_agent_pdc_charge, master_pdc_charge, admin_pdc_charge, description, description, reffered_name, '1']);
				}
				else if(data.existingPDCData[0].is_pdc_charged == '0'){
					await conn.query('UPDATE user_profit_loss SET user_pdc_charge = ?, agent_pdc_charge = ?, super_agent_pdc_charge = ?, master_pdc_charge = ?, admin_pdc_charge = ?, is_pdc_charged = ? WHERE id = ?;', [user_pdc_charge, agent_pdc_charge, super_agent_pdc_charge, master_pdc_charge, admin_pdc_charge, '1', data.existingPDCData[0].id]);
				}else{
					await conn.commit(); conn.release();
					return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');
				}

				let dataOut = {
					admin_pdc_pl : admin_pdc_charge,
					master_pdc_pl : master_pdc_pl,
					super_agent_pdc_pl : super_agent_pdc_pl,
					agent_pdc_pl : agent_pdc_pl,
					user_pdc_pl : user_pdc_charge,
					user_ids : user_ids,
					description : description,
					match_id : data.match_id,
					market_id : data.marketData.market_id,
					user_ids_ac_statement : user_ids_ac_statement
				}
				await pdcEntry(conn, dataOut);

			} else {
				await conn.rollback(); conn.release();
				return resultdb(CONSTANTS.SERVER_ERROR, 'Insufficient balance to view match !');
			}
		}
		await conn.commit(); conn.release();
		return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');

	} catch (error) {
		logger.errorlog.error("deductPDC",error);
		await conn.rollback(); conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, 'An error occurred !');
	}
};

let refundPDC = async (data) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();

		let is_pdc_charge = CONSTANTS.IS_PDC_CHARGE;
		let is_pdc_refund = CONSTANTS.IS_PDC_REFUND;
		let is_pdc_distribute = CONSTANTS.IS_PDC_DISTRIBUTE;
		let is_pdc_charge_on_first_bet = CONSTANTS.IS_PDC_CHARGE_ON_FIRST_BET;
		if(is_pdc_charge == 1 && is_pdc_refund == 1 && is_pdc_charge_on_first_bet == 0) {


			let sportSetting = await sportsService.getSportSetting(data.sport_id);
			if (sportSetting.data.is_pdc_charge == '1') {

				let pdc_refund = 0;
				if (is_pdc_distribute == 0) {
					pdc_refund = sportSetting.data.pdc_refund;
				}

				let checkPDCRefunded = await getChargedPDCData(data);

				if (checkPDCRefunded.data.length > 0) {
					let user_pdc_refund = 0;
					let agent_pdc_refund = 0;
					let super_agent_pdc_refund = 0;
					let master_pdc_refund = 0;
					let admin_pdc_refund = 0;
					let agent_pdc_pl = 0;
					let super_agent_pdc_pl = 0;
					let master_pdc_pl = 0;
					let market_id = checkPDCRefunded.data[0].market_id;

					let description = 'PDC Refund: ' + checkPDCRefunded.data[0].match_name;

					let user_ids = [data.user_id, data.agent_id, data.super_agent_id, data.master_id, data.admin_id];
					let user_ids_ac_statement = [data.user_id, data.admin_id];

					if (is_pdc_distribute == 1) {
						let pdcSetting = await userSettingSportWiseService.getPDCBySportAndUsers(data.sport_id, user_ids);
						user_pdc_refund = pdcSetting.data[data.user_id].pdc_refund;
						agent_pdc_refund = pdcSetting.data[data.agent_id].pdc_refund;
						super_agent_pdc_refund = pdcSetting.data[data.super_agent_id].pdc_refund;
						master_pdc_refund = pdcSetting.data[data.master_id].pdc_refund;
						admin_pdc_refund = -pdcSetting.data[data.master_id].pdc_refund;

						agent_pdc_pl = agent_pdc_refund - user_pdc_refund;
						super_agent_pdc_pl = super_agent_pdc_refund - agent_pdc_refund;
						master_pdc_pl = master_pdc_refund - super_agent_pdc_refund;

						user_ids_ac_statement = [data.user_id, data.agent_id, data.super_agent_id, data.master_id, data.admin_id];

					} else {
						user_pdc_refund = pdc_refund;
						agent_pdc_refund = pdc_refund;
						super_agent_pdc_refund = pdc_refund;
						master_pdc_refund = pdc_refund;
						admin_pdc_refund = -(pdc_refund);
					}

					await conn.query('UPDATE user_profit_loss SET user_pdc_refund = ?, agent_pdc_refund = ?, super_agent_pdc_refund = ?, master_pdc_refund = ?, admin_pdc_refund = ?, pdc_refunded_at =  UNIX_TIMESTAMP(NOW()) WHERE id = ?;', [user_pdc_refund, agent_pdc_refund, super_agent_pdc_refund, master_pdc_refund, admin_pdc_refund, checkPDCRefunded.data[0].id]);

					let dataOut = {
						admin_pdc_pl: admin_pdc_refund,
						master_pdc_pl: master_pdc_pl,
						super_agent_pdc_pl: super_agent_pdc_pl,
						agent_pdc_pl: agent_pdc_pl,
						user_pdc_pl: user_pdc_refund,
						user_ids: user_ids,
						description: description,
						match_id: data.match_id,
						market_id: market_id,
						user_ids_ac_statement: user_ids_ac_statement
					}
					await pdcEntry(conn, dataOut);

				}
			}
		}
		await conn.commit(); conn.release();
		return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');

	} catch (error) {
		logger.errorlog.error("refundPDC",error);
		await conn.rollback(); conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, 'An error occurred !');
	}
};

let refundPDCRollbackOnBetDelete = async (data) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();

		let is_pdc_charge = CONSTANTS.IS_PDC_CHARGE;
		let is_pdc_refund = CONSTANTS.IS_PDC_REFUND;
		let is_pdc_distribute = CONSTANTS.IS_PDC_DISTRIBUTE;
		let is_pdc_charge_on_first_bet = CONSTANTS.IS_PDC_CHARGE_ON_FIRST_BET;
		if(is_pdc_charge == 1 && is_pdc_refund == 1 && is_pdc_charge_on_first_bet == 0) {

			let tbl = 'bets_odds';
			if (data.is_fancy == 1) {
				tbl = 'bets_fancy';
			}

			let qry_res = await MysqlPool.query(`SELECT * FROM ${tbl} WHERE id = ? LIMIT 1;`, [data.bet_id]);
			if (qry_res.length > 0) {
				let sport_id = qry_res[0]['sport_id'];
				let match_id = qry_res[0]['match_id'];
				let user_id = qry_res[0]['user_id'];
				let agent_id = qry_res[0]['agent_id'];
				let super_agent_id = qry_res[0]['super_agent_id'];
				let master_id = qry_res[0]['master_id'];
				let admin_id = qry_res[0]['admin_id'];

				let sportSetting = await sportsService.getSportSetting(sport_id);
				if (sportSetting.data.is_pdc_charge == '1') {

					let user_bets = await betService.getBetCountByMatchAndUser(user_id, 5, match_id);
					if (user_bets.statusCode === CONSTANTS.SUCCESS) {
						if (user_bets.data[0].records == 0) {

							let checkPDCRefunded = await MysqlPool.query('select a.*, b.name AS match_name FROM user_profit_loss AS a INNER JOIN matches AS b ON(a.match_id = b.match_id AND a.sport_id = b.sport_id) WHERE a.user_id = ? AND a.sport_id = ? AND a.match_id = ? AND a.pdc_refunded_at IS NOT NULL AND a.is_pdc_charged = ? LIMIT 1;', [user_id, sport_id, match_id, '1']);

							if (checkPDCRefunded.length > 0) {

								let agent_pdc_refund = 0;
								let super_agent_pdc_refund = 0;
								let master_pdc_refund = 0;
								let agent_pdc_pl = 0;
								let super_agent_pdc_pl = 0;
								let master_pdc_pl = 0;
								let description = 'PDC Refund Rollback On Bet Delete: ' + checkPDCRefunded[0].match_name;
								let market_id = checkPDCRefunded[0].market_id;
								let user_ids = [user_id, agent_id, super_agent_id, master_id, admin_id];
								let user_ids_ac_statement = [user_id, admin_id];
								let user_pdc_refund = -(checkPDCRefunded[0].user_pdc_refund);
								let admin_pdc_refund = checkPDCRefunded[0].admin_pdc_refund;

								if (is_pdc_distribute == 1) {

									agent_pdc_refund = -(checkPDCRefunded[0].agent_pdc_refund);
									super_agent_pdc_refund = -(checkPDCRefunded[0].super_agent_pdc_refund);
									master_pdc_refund = -(checkPDCRefunded[0].master_pdc_refund);

									agent_pdc_pl = -(user_pdc_refund) + agent_pdc_refund;
									super_agent_pdc_pl = -(agent_pdc_refund) + super_agent_pdc_refund;
									master_pdc_pl = -(super_agent_pdc_refund) + master_pdc_refund;

									user_ids_ac_statement = [user_id, agent_id, super_agent_id, master_id, admin_id];
								}

								await conn.query('UPDATE user_profit_loss SET user_pdc_refund = 0, agent_pdc_refund = 0, super_agent_pdc_refund = 0, master_pdc_refund = 0, admin_pdc_refund = 0, pdc_refunded_at = NULL WHERE user_id = ? AND sport_id = ? AND match_id = ? AND market_id = ?;', [user_id, sport_id, match_id, market_id]);

								let dataOut = {
									admin_pdc_pl: admin_pdc_refund,
									master_pdc_pl: master_pdc_pl,
									super_agent_pdc_pl: super_agent_pdc_pl,
									agent_pdc_pl: agent_pdc_pl,
									user_pdc_pl: user_pdc_refund,
									user_ids: user_ids,
									description: description,
									match_id: match_id,
									market_id: market_id,
									user_ids_ac_statement: user_ids_ac_statement
								}
								await pdcEntry(conn, dataOut);
							}
						}
					}
				}
			}
		}
		await conn.commit(); conn.release();
		return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');

	} catch (error) {
		logger.errorlog.error("refundPDCRollbackOnBetDelete",error);
		await conn.rollback(); conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, 'An error occurred !');
	}
};

let pdcEntry = async (conn, data) => {

	/*await conn.query('INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, match_id, market_id, type, created_at) SELECT id AS user_id, parent_id AS parent_id, ? AS description, 9 AS statement_type, (CASE WHEN user_type_id = 1 THEN ? WHEN user_type_id = 2 THEN ? WHEN user_type_id = 3 THEN ? WHEN user_type_id = 4 THEN ? ELSE ? END) AS amount, balance + (CASE WHEN user_type_id = 1 THEN ? WHEN user_type_id = 2 THEN ? WHEN user_type_id = 3 THEN ? WHEN user_type_id = 4 THEN ? ELSE ? END) AS available_balance, ? AS match_id, ? AS market_id, 1 AS type, UNIX_TIMESTAMP(NOW()) AS created_at FROM users WHERE id IN(?);', [data.description, data.admin_pdc_pl, data.master_pdc_pl, data.super_agent_pdc_pl, data.agent_pdc_pl, data.user_pdc_pl, data.admin_pdc_pl, data.master_pdc_pl, data.super_agent_pdc_pl, data.agent_pdc_pl, data.user_pdc_pl, data.match_id, data.market_id, data.user_ids_ac_statement]);*/

	await conn.query('UPDATE users SET balance = balance + (CASE WHEN user_type_id = 1 THEN ? WHEN user_type_id = 2 THEN ? WHEN user_type_id = 3 THEN ? WHEN user_type_id = 4 THEN ? ELSE ? END), profit_loss = profit_loss + (CASE WHEN user_type_id = 1 THEN ? WHEN user_type_id = 2 THEN ? WHEN user_type_id = 3 THEN ? WHEN user_type_id = 4 THEN ? ELSE ? END) WHERE id IN(?);', [data.admin_pdc_pl, data.master_pdc_pl, data.super_agent_pdc_pl, data.agent_pdc_pl, data.user_pdc_pl, data.admin_pdc_pl, data.master_pdc_pl, data.super_agent_pdc_pl, data.agent_pdc_pl, data.user_pdc_pl, data.user_ids]);

	await conn.query('UPDATE user_profit_loss AS a INNER JOIN users b ON (b.id = a.user_id) INNER JOIN users c ON (c.id = a.agent_id) INNER JOIN users d ON (d.id = a.super_agent_id) INNER JOIN users e ON (e.id = a.master_id)  INNER JOIN users f ON (f.id = a.admin_id) SET a.user_available_balance = ROUND(b.balance, 6), a.agent_available_balance = ROUND(c.balance, 6), a.super_agent_available_balance = ROUND(d.balance, 6), a.master_available_balance = ROUND(e.balance, 6), a.admin_available_balance = ROUND(f.balance, 6) WHERE a.user_id IN (?) AND a.match_id = ? AND a.market_id = ? AND a.type = "1";', [data.user_ids, data.match_id, data.market_id]);

	return true;
};

let getChargedPDCData = async (data) => {
	try {
		let marketData = await MysqlPool.query('SELECT a.*, b.name AS match_name FROM user_profit_loss AS a INNER JOIN matches AS b ON(a.match_id = b.match_id AND a.sport_id = b.sport_id) WHERE a.pdc_refunded_at IS NULL AND a.user_id = ? AND a.sport_id = ? AND a.match_id = ? AND a.is_pdc_charged = ? LIMIT 1;', [data.user_id, data.sport_id, data.match_id, '1']);
		return resultdb(CONSTANTS.SUCCESS, marketData);
	} catch (error) {
		logger.errorlog.error("getChargedPDCData",error);
		return resultdb(CONSTANTS.SERVER_ERROR, []);
	}
};

let getMarketForPDC = async (match_id, sport_id) => {
	try {
		let resFromDB = await MysqlPool.query('SELECT a.*, a.name AS market_name, b.name AS match_name, c.name AS series_name FROM markets AS a INNER JOIN matches AS b ON(a.match_id = b.match_id) INNER JOIN series AS c ON(a.series_id = c.series_id) WHERE (a.name IN("Match Odds", "Winner") OR a.match_id IN ("-154", "-156", "-1001", "-1002", "-1003", "-1004", "-1005") or a.sport_id IN ("7", "4339") ) AND a.match_id = ? AND a.sport_id = ? LIMIT 1;', [match_id, sport_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("getMarketForPDC",error);
		return resultdb(CONSTANTS.SERVER_ERROR, []);
	}

};

module.exports = {
	verifyPdcChargeMatchEntry,
	checkPdcDeductedForMatch,
	deductPDC,
	refundPDC,
	refundPDCRollbackOnBetDelete,
	getChargedPDCData,
	getMarketForPDC
};
