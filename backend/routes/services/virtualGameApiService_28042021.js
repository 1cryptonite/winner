'use strict';
const settings = require('../../config/settings');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const MysqlPool = require('../../db');
const connConfig = require('../../db/indexTest');
let resultdb = globalFunction.resultdb;

let getPlayerInfoVirtualGame = async (userId) => {
	try {
		let userData = await MysqlPool.query(`SELECT user_name, balance FROM users WHERE id = ? AND user_type_id = 5 LIMIT 1;`, [userId]);
		if (userData.length > 0) {
			return resultdb(CONSTANTS.SUCCESS, userData[0]);
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getBalanceVirtualGame = async (userId) => {
	try {
		let userData = await MysqlPool.query(`SELECT balance FROM users WHERE id = ? AND user_type_id = 5 LIMIT 1;`, [userId]);
		if (userData.length > 0) {
			return resultdb(CONSTANTS.SUCCESS, userData[0]);
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

/*let bet = async (userId, data) => {
	try {
		let userData = await MysqlPool.query(`SELECT u.id, u.parent_agent_id, u.parent_super_agent_id, u.parent_master_id, u.parent_admin_id, GREATEST(u.self_lock_user, u.parent_lock_user) lock_user, GREATEST(u.self_lock_betting, u.parent_lock_betting) lock_betting, GREATEST(u.self_close_account,u.parent_close_account) close_account, p.agent, p.super_agent, p.master, p.admin FROM users AS u INNER JOIN partnerships AS p ON(u.id = p.user_id AND p.sport_id = '4') WHERE u.id = ? AND u.user_type_id = 5 LIMIT 1;`, [userId]);
		if (userData.length > 0) {
			if (userData[0].close_account == '1') {
				return resultdb(CONSTANTS.NOT_FOUND, 'User Account Closed !');
			}
			else if (userData[0].lock_user == '1') {
				return resultdb(CONSTANTS.NOT_FOUND, 'User Locked !');
			}
			else if (userData[0].lock_betting == '1') {
				return resultdb(CONSTANTS.NOT_FOUND, 'Bet Locked !');
			} else {
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					let resp = await conn.query(`INSERT INTO bets_brino_casino(user_id, agent_id, super_agent_id, master_id, admin_id, stack, game, round_id, pn, p_l, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, [userId, userData[0].parent_agent_id, userData[0].parent_super_agent_id, userData[0].parent_master_id, userData[0].parent_admin_id, data.stack, data.game, data.roundId, data.pn, data.pl, globalFunction.currentDate()]);

					if (resp[0]["affectedRows"] > 0) {
						let lastID = resp[0]['insertId'];
						let description = 'Brino Casino: ' + data.game + ((data.pl >= 0) ? '[Profit]' : '[Loss]');
						let referredName = 'Brino Casino -> ' + data.game;
						let agentPl = (data.pl < 0) ? ((Math.abs(data.pl) * userData[0].agent) / 100) : -((Math.abs(data.pl) * userData[0].agent) / 100);
						let superAgentPl = (data.pl < 0) ? ((Math.abs(data.pl) * userData[0].super_agent) / 100) : -((Math.abs(data.pl) * userData[0].super_agent) / 100);
						let masterPl = (data.pl < 0) ? ((Math.abs(data.pl) * userData[0].master) / 100) : -((Math.abs(data.pl) * userData[0].master) / 100);
						let adminPl = (data.pl < 0) ? ((Math.abs(data.pl) * userData[0].admin) / 100) : -((Math.abs(data.pl) * userData[0].admin) / 100);

						await conn.query(`INSERT INTO user_profit_loss (user_id, agent_id, super_agent_id, master_id, admin_id, sport_id, match_id, market_id, type, bet_result_id, stack, description, reffered_name, created_at, game_type, game_type_reference_id, user_pl, agent_pl, super_agent_pl, master_pl, admin_pl) VALUES(?, ?, ?, ?, ?, NULL, NULL, ?, '1', NULL, ?, ?, ?, UNIX_TIMESTAMP(), '1', ?, ?, ?, ?, ?, ?);`, [userId, userData[0].parent_agent_id, userData[0].parent_super_agent_id, userData[0].parent_master_id, userData[0].parent_admin_id, data.roundId, data.stack, description, referredName, lastID, data.pl, agentPl, superAgentPl, masterPl, adminPl]);

						await conn.query(`UPDATE users SET balance = balance + ?, total_balance = total_balance + ?, profit_loss = profit_loss + ? WHERE id = ? AND user_type_id = 5;

  UPDATE users SET balance = balance + ? WHERE id = ?;
  UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
  UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;
  
  UPDATE users SET balance = balance + ? WHERE id = ?;
  UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
  UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

  UPDATE users SET balance = balance + ? WHERE id = ?;
  UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
  UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

  UPDATE users SET balance = balance + ? WHERE id = ?; 
  UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?; 
  
  UPDATE user_profit_loss AS a 
  INNER JOIN users b ON (b.id = a.user_id) 
  LEFT JOIN users c ON (c.id = a.agent_id) 
  LEFT JOIN users d ON (d.id = a.super_agent_id) 
  LEFT JOIN users e ON (e.id = a.master_id) 
  LEFT JOIN users f ON (f.id = a.admin_id) 
  SET 
  a.user_available_balance = ROUND((b.balance - b.liability), 6),
  a.agent_available_balance = ROUND((c.balance - c.liability), 6),
  a.super_agent_available_balance = ROUND((d.balance - d.liability), 6),
  a.master_available_balance = ROUND((e.balance - e.liability), 6),
  a.admin_available_balance = ROUND((f.balance - f.liability), 6)
  WHERE a.user_id = ? AND a.market_id = ? AND a.game_type = '1';`, [data.pl, data.pl, data.pl, userId,
							agentPl, userData[0].parent_agent_id, userData[0].parent_agent_id, userData[0].parent_agent_id,
							superAgentPl, userData[0].parent_super_agent_id, userData[0].parent_super_agent_id, userData[0].parent_super_agent_id,
							masterPl, userData[0].parent_master_id, userData[0].parent_master_id, userData[0].parent_master_id,
							adminPl, userData[0].parent_admin_id, userData[0].parent_admin_id,
							userId, data.roundId]);

						await conn.commit();
						conn.release();
						return resultdb(CONSTANTS.SUCCESS, 'Success');
					} else {
						await conn.rollback();
						conn.release();
						return resultdb(CONSTANTS.NOT_FOUND, 'Error In Save Bet !');
					}
				} catch (err) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, err.code);
				}
			}
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Token !');
		}
	} catch (error) {
		return resultdb(CONSTANTS.SERVER_ERROR, 'Error In Save Bet !');
	}
};*/
let brinoPlaceBet = async (userId, data) => {
	let returnData = {
		"message": 'Bet Place Failed !',
		"amount": 0.0
	};
	try {
		let validateBet = await MysqlPool.query(`SELECT id FROM bets_brino_casino WHERE (transaction_id = ? AND txn_type = '1') OR (round_id = ? AND user_id = ? AND txn_type IN ('2','3')) LIMIT 1;`, [data.transactionId, data.roundId, userId]);
		if (validateBet.length > 0) {
			let userBalance = await getBalanceVirtualGame(userId);
			if (userBalance.statusCode === CONSTANTS.SUCCESS) {
				returnData = {
					"message": "Bet Placed",
					"amount": userBalance.data.balance
				};
				return resultdb(CONSTANTS.SUCCESS, returnData);
			} else {
				returnData = {
					"message": "Bet Placed",
					"amount": 0.0
				};
				return resultdb(CONSTANTS.SUCCESS, returnData);
			}
		} else {
			let userData = await MysqlPool.query(`SELECT id, parent_id, balance, GREATEST(self_lock_user,parent_lock_user) lock_user, GREATEST(self_lock_betting,parent_lock_betting) lock_betting,GREATEST(self_close_account,parent_close_account) close_account FROM users WHERE id = ? AND user_type_id = 5 LIMIT 1;`, [userId]);
			if (userData.length > 0) {
				if (userData[0].close_account == '1') {
					returnData = {
						"message": "User Account Closed !",
						"amount": userData[0].balance
					};
					return resultdb(CONSTANTS.NOT_FOUND, returnData);
				}
				else if (userData[0].lock_user == '1') {
					returnData = {
						"message": "User Locked !",
						"amount": userData[0].balance
					};
					return resultdb(CONSTANTS.NOT_FOUND, returnData);
				}
				else if (userData[0].lock_betting == '1') {
					returnData = {
						"message": "Bet Locked !",
						"amount": userData[0].balance
					};
					return resultdb(CONSTANTS.NOT_FOUND, returnData);
				}

				let getOldLiability = await MysqlPool.query(`SELECT liability FROM bets_brino_casino WHERE user_id = ? AND round_id = ? AND txn_type = '1' ORDER BY id DESC LIMIT 1;`, [userId, data.roundId]);

				let oldLiability = 0;
				if (getOldLiability.length > 0) {
					oldLiability = getOldLiability[0].liability;
				}

				if ((userData[0].balance - oldLiability) < -data.expo) {
					returnData = {
						"message": "Insufficient Balance !",
						"amount": userData[0].balance
					};
					return resultdb(CONSTANTS.NOT_FOUND, returnData);
				}

				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					let data1 = {
						user_id: userId,
						amount: data.stack,
						liability: data.expo,
						game: data.game,
						round_id: data.roundId,
						pn: data.pn,
						transaction_id: data.transactionId,
						txn_type: '1',
						created_at: globalFunction.currentDate()
					};
					await conn.query('INSERT INTO bets_brino_casino SET ?', [data1]);
					await conn.query('UPDATE users set balance = balance + ? - ?, liability = liability + ? - ? WHERE id = ?', [data.expo, oldLiability, data.expo, oldLiability, userId]);
					let getUpdatedUserBalance = await conn.query('SELECT balance FROM users where id = ?', [userId]);

					await conn.commit();
					conn.release();
					returnData = {
						"message": "Bet Placed",
						"amount": getUpdatedUserBalance[0][0].balance
					};
					return resultdb(CONSTANTS.SUCCESS, returnData);
				} catch (error) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, returnData);
				}
			} else {
				return resultdb(CONSTANTS.NOT_FOUND, returnData);
			}
		}
	} catch (error) {
		return resultdb(CONSTANTS.SERVER_ERROR, returnData);
	}
};
let brinoResult = async (data) => {
	let returnData = {
		"message": 'Result Failed !',
		"amount": 0.0
	};
	try {
		let userData = await MysqlPool.query(`SELECT u.id, u.balance, u.parent_id, u.parent_agent_id, u.parent_super_agent_id, u.parent_master_id, u.parent_admin_id, p.agent, p.super_agent, p.master, p.admin FROM users AS u INNER JOIN partnerships AS p ON(u.id = p.user_id AND p.sport_id = '4') WHERE u.user_name = ? AND u.user_type_id = 5 LIMIT 1;`, [data.userName]);
		if (userData.length > 0) {
			let userId = userData[0].id;
			let validateBet = await MysqlPool.query(`SELECT id FROM bets_brino_casino WHERE user_id = ? AND txn_type IN ('2','3') AND round_id = ? LIMIT 1;`, [userId, data.roundId]);
			if (validateBet.length > 0) {
				let userBalance = await getBalanceVirtualGame(userId);
				if (userBalance.statusCode === CONSTANTS.SUCCESS) {
					returnData = {
						"message": "Result Declared",
						"amount": userBalance.data.balance
					};
					return resultdb(CONSTANTS.SUCCESS, returnData);
				} else {
					returnData = {
						"message": "Result Declared",
						"amount": 0.0
					};
					return resultdb(CONSTANTS.SUCCESS, returnData);
				}
			} else {
				let getLatestLiability = await MysqlPool.query(`SELECT liability FROM bets_brino_casino WHERE user_id = ? AND round_id = ? AND txn_type = '1' ORDER BY id DESC LIMIT 1;`, [userId, data.roundId]);

				let liability = 0;
				if (getLatestLiability.length > 0) {
					liability = getLatestLiability[0].liability;
				}

				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					// Insert Bet Result------------------
					let data1 = {
						user_id: userId,
						amount: data.pl,
						liability: liability,
						game: data.game,
						round_id: data.roundId,
						pn: data.pn,
						txn_type: '2',
						created_at: globalFunction.currentDate()
					};
					let resp = await conn.query('INSERT INTO bets_brino_casino  SET ?', [data1]);
					// Insert Bet------------------END
					if (resp[0]["affectedRows"] > 0) {
						let lastID = resp[0]['insertId'];
						// set PL -------------------
						// let userpl = -data.stack + data.pl
						let userpl = data.pl
						let agentPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].agent) / 100) : -((Math.abs(userpl) * userData[0].agent) / 100);
						let superAgentPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].super_agent) / 100) : -((Math.abs(userpl) * userData[0].super_agent) / 100);
						let masterPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].master) / 100) : -((Math.abs(userpl) * userData[0].master) / 100);
						let adminPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].admin) / 100) : -((Math.abs(userpl) * userData[0].admin) / 100);
						// set PL -------------------END
						// set description----------------
						let description = 'Brino Casino: ' + data.game + ((userpl >= 0) ? '[Profit]' : '[Loss]');
						// set description----------------END

						// set reffered_name----------------
						let referredName = 'Brino Casino -> ' + data.game;

						// set reffered_name----------------END
						await conn.query(`INSERT INTO user_profit_loss (user_id, agent_id, super_agent_id, master_id, admin_id, sport_id, match_id, market_id, type, bet_result_id, stack, description, reffered_name, created_at, user_pl, agent_pl, super_agent_pl, master_pl, admin_pl, game_type, game_type_reference_id) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, '1', NULL, ?, ?, ?, UNIX_TIMESTAMP(), ?, ?, ?, ?, ?, '1',?)`, [userId, userData[0].parent_agent_id, userData[0].parent_super_agent_id, userData[0].parent_master_id, userData[0].parent_admin_id, data.roundId, data.stack, description, referredName, userpl, agentPl, superAgentPl, masterPl, adminPl, lastID]);

						await conn.query(`UPDATE users SET balance = balance + ? - ?, total_balance = total_balance + ?, profit_loss = profit_loss + ?, liability = liability - ? WHERE id = ? AND user_type_id = 5;

UPDATE users SET balance = balance + ? WHERE id = ?;
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

UPDATE users SET balance = balance + ? WHERE id = ?;
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

UPDATE users SET balance = balance + ? WHERE id = ?;
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

UPDATE users SET balance = balance + ? WHERE id = ?; 
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?; 

UPDATE user_profit_loss AS a 
INNER JOIN users b ON (b.id = a.user_id) 
LEFT JOIN users c ON (c.id = a.agent_id) 
LEFT JOIN users d ON (d.id = a.super_agent_id) 
LEFT JOIN users e ON (e.id = a.master_id) 
LEFT JOIN users f ON (f.id = a.admin_id) 
SET 
a.user_available_balance = ROUND((b.balance - b.liability), 6),
a.agent_available_balance = ROUND((c.balance - c.liability), 6),
a.super_agent_available_balance = ROUND((d.balance - d.liability), 6),
a.master_available_balance = ROUND((e.balance - e.liability), 6),
a.admin_available_balance = ROUND((f.balance - f.liability), 6)
WHERE a.user_id = ? AND a.market_id = ? AND a.game_type = '1';`, [userpl, liability, userpl, userpl, liability, userId,
							agentPl, userData[0].parent_agent_id, userData[0].parent_agent_id, userData[0].parent_agent_id,
							superAgentPl, userData[0].parent_super_agent_id, userData[0].parent_super_agent_id, userData[0].parent_super_agent_id,
							masterPl, userData[0].parent_master_id, userData[0].parent_master_id, userData[0].parent_master_id,
							adminPl, userData[0].parent_admin_id, userData[0].parent_admin_id,
							userId, data.roundId]);
						let getUpdatedUserBalance = await conn.query('SELECT balance FROM users where id = ?;', [userId]);
						await conn.commit();
						conn.release();
						returnData = {
							"message": "Result Declared",
							"amount": getUpdatedUserBalance[0][0].balance,
						};
						return resultdb(CONSTANTS.SUCCESS, returnData);
					} else {
						await conn.rollback();
						conn.release();
						return resultdb(CONSTANTS.NOT_FOUND, returnData);
					}
				} catch (error) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, returnData);
				}
			}
		} else {
			return resultdb(CONSTANTS.SERVER_ERROR, returnData);
		}
	} catch (error) {
		return returnData;
	}
};
let brinoCancelGame = async (data) => {
	let returnData = {
		"message": 'Failed !',
		"amount": 0.0
	};
	try {
		let userData = await MysqlPool.query(`SELECT id, parent_id, balance FROM users WHERE user_name = ? AND user_type_id = 5 LIMIT 1;`, [data.userName]);
		let userId = userData[0].id;
		if (userData.length > 0) {
			let validateBet = await MysqlPool.query(`SELECT id FROM bets_brino_casino WHERE user_id = ? AND txn_type IN ('2','3') AND round_id = ? LIMIT 1;`, [userId, data.roundId]);
			if (validateBet.length > 0) {
				let userBalance = await getBalanceVirtualGame(userId);
				if (userBalance.statusCode === CONSTANTS.SUCCESS) {
					returnData = {
						"message": "Success",
						"amount": userBalance.data.balance
					};
					return resultdb(CONSTANTS.SUCCESS, returnData);
				} else {
					returnData = {
						"message": "Success",
						"amount": 0.0
					};
					return resultdb(CONSTANTS.SUCCESS, returnData);
				}
			} else {
				// let userBets = await MysqlPool.query(`SELECT id FROM bets_brino_casino WHERE game_key = ? AND user_id = ? LIMIT 1;`, [data.gamekey, userData[0].id]);
				// if (userBets.length > 0) {
				let getLatestLiability = await MysqlPool.query(`SELECT liability FROM bets_brino_casino WHERE user_id = ? AND round_id = ? AND txn_type = '1' ORDER BY id DESC LIMIT 1;`, [userId, data.roundId]);

				let liability = 0;
				if (getLatestLiability.length > 0) {
					liability = getLatestLiability[0].liability;
				}

				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					let data1 = {
						user_id: userId,
						amount: data.stack,
						liability: liability,
						game: data.game,
						round_id: data.roundId,
						pn: data.pn,
						txn_type: '3',
						created_at: globalFunction.currentDate()
					};
					await conn.query('DELETE FROM bets_brino_casino Where round_id = ? AND user_id = ?', [data.roundId, userId]);
					await conn.query('INSERT INTO bets_brino_casino SET ?', [data1]);
					await conn.query('UPDATE users set balance = balance - ?, liability = liability - ? WHERE id = ?', [liability, liability, userId]);
					let getUpdatedUserBalance = await conn.query('SELECT balance FROM users where id = ?', [userId]);
					await conn.commit();
					conn.release();

					returnData = {
						"message": "Success",
						"amount": getUpdatedUserBalance[0][0].balance
					};
					return resultdb(CONSTANTS.SUCCESS, returnData);
				} catch (error) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, returnData);
				}
				// } else {

				// }
			}
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, returnData);
		}
	} catch (error) {
		return resultdb(CONSTANTS.SERVER_ERROR, returnData);
	}
};

let fantasyJoinContest = async (userId, data) => {
	try {
		let userData = await MysqlPool.query(`SELECT id, parent_id, balance, GREATEST(self_lock_user, parent_lock_user, self_close_account, parent_close_account) AS inactive FROM users WHERE id = ? AND user_type_id = 5 LIMIT 1;`, [userId]);
		if (userData.length > 0) {
			if (userData[0].inactive == '1') {
				return {
					"code": 1,
					"error": true,
					"msg": "User account not active",
					"data": {
						"amount": 0
					}
				};
			}
			else if (userData[0].balance < data.amount) {
				return {
					"code": 1,
					"error": true,
					"msg": "Insufficient balance",
					"data": {
						"amount": userData[0].balance
					}
				};
			}
			else {
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					let data1 = {
						user_id: userId,
						match_id: data.matchId,
						contest_id: data.contestId,
						pool_contest_id: data.poolContestId,
						u_team_id: data.uTeamId,
						amount: data.amount,
						created_at: globalFunction.currentDate()
					};
					await conn.query('INSERT INTO brino_fantasy_contests SET ?', [data1]);
					await conn.query('UPDATE users SET balance = balance - ?, total_balance = total_balance - ? WHERE id = ?', [data.amount, data.amount, userId]);
					await conn.commit();
					conn.release();
					return {
						"code": 0,
						"error": false,
						"msg": "Success",
						"data": {
							"amount": userData[0].balance - data.amount
						}
					};
				} catch (error) {
					await conn.rollback();
					conn.release();
					return {
						"code": 1,
						"error": true,
						"msg": "An error occurred",
						"data": {
							"amount": 0
						}
					};
				}
			}
		} else {
			return {
				"code": 1,
				"error": true,
				"msg": "Invalid token",
				"data": {
					"amount": 0
				}
			};
		}
	} catch (error) {
		return {
			"code": 1,
			"error": true,
			"msg": "An error occurred",
			"data": {
				"amount": 0
			}
		};
	}
};

let fantasyResult = async (data) => {
	try {
		let userId = parseInt(data.userId);
		let validateBet = await MysqlPool.query(`SELECT id, amount, IFNULL(win_amount, '') AS win_amount FROM brino_fantasy_contests WHERE user_id = ? AND match_id = ? AND contest_id = ? AND pool_contest_id = ? AND u_team_id = ? LIMIT 1;`, [userId, data.matchId, data.contestId, data.poolContestId, data.uTeamId]);
		if (validateBet.length > 0) {
			if (validateBet[0].win_amount != '') {
				let userData1 = await getBalanceVirtualGame(userId);
				if (userData1.statusCode === CONSTANTS.SUCCESS) {
					return {
						"code": 0,
						"error": false,
						"msg": "Success",
						"data": {
							"amount": userData1.data.balance,
						}
					};
				} else {
					return {
						"code": 0,
						"error": false,
						"msg": "Success",
						"data": {
							"amount": 0,
						}
					};
				}
			} else {
				let userData = await MysqlPool.query(`SELECT u.id, u.balance, u.parent_id, u.parent_agent_id, u.parent_super_agent_id, u.parent_master_id, u.parent_admin_id, p.agent, p.super_agent, p.master, p.admin FROM users AS u INNER JOIN partnerships AS p ON(u.id = p.user_id AND p.sport_id = '4') WHERE u.id = ? AND u.user_type_id = 5 LIMIT 1;`, [userId]);
				if (userData.length > 0) {
					const conn = await connConfig.getConnection();
					await conn.beginTransaction();
					try {
						// Insert Bet------------------
						await conn.query('UPDATE brino_fantasy_contests SET win_amount = ? WHERE id = ?', [data.amount, validateBet[0].id]);
						// set PL -------------------
						let userpl = -validateBet[0].amount + data.amount
						let agentPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].agent) / 100) : -((Math.abs(userpl) * userData[0].agent) / 100);
						let superAgentPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].super_agent) / 100) : -((Math.abs(userpl) * userData[0].super_agent) / 100);
						let masterPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].master) / 100) : -((Math.abs(userpl) * userData[0].master) / 100);
						let adminPl = (userpl < 0) ? ((Math.abs(userpl) * userData[0].admin) / 100) : -((Math.abs(userpl) * userData[0].admin) / 100);
						// set PL -------------------END
						// set description----------------
						let description = "BrinoFantasy [Profit -> MatchId: " + data.matchId + " -> ContestId: " + data.contestId + " -> PoolContestId: " + data.poolContestId + "]";
						if (userpl < 0) {
							description = "BrinoFantasy [Loss -> MatchId: " + data.matchId + " -> ContestId: " + data.contestId + " -> PoolContestId: " + data.poolContestId + "]";
						}
						// set description----------------END
						// set reffered_name----------------
						let refferedName = "BrinoFantasy [MatchId: " + data.matchId + "]";

						// set reffered_name----------------END
						await conn.query(`INSERT INTO user_profit_loss (user_id, agent_id, super_agent_id, master_id, admin_id, sport_id, match_id, market_id, type, bet_result_id, stack, description, reffered_name, created_at, user_pl, agent_pl, super_agent_pl, master_pl, admin_pl, game_type, game_type_reference_id) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, '1', NULL, ?, ?, ?, UNIX_TIMESTAMP(), ?, ?, ?, ?, ?, '6',?)`, [userData[0].id, userData[0].parent_agent_id, userData[0].parent_super_agent_id, userData[0].parent_master_id, userData[0].parent_admin_id, data.contestId, validateBet[0].amount, description, refferedName, userpl, agentPl, superAgentPl, masterPl, adminPl, validateBet[0].id]);

						await conn.query(`UPDATE users SET balance = balance + ?, total_balance = total_balance + ?, profit_loss = profit_loss + ? WHERE id = ? AND user_type_id = 5;

UPDATE users SET balance = balance + ? WHERE id = ?;
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

UPDATE users SET balance = balance + ? WHERE id = ?;
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

UPDATE users SET balance = balance + ? WHERE id = ?;
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?;
UPDATE users SET profit_loss = (total_balance - freechips) WHERE id = ?;

UPDATE users SET balance = balance + ? WHERE id = ?; 
UPDATE users AS b LEFT JOIN (SELECT SUM(d.total_balance) AS child_total_balance, d.parent_id FROM users AS d GROUP BY d.parent_id) AS e ON (e.parent_id = b.id) SET b.total_balance = (b.balance + IFNULL(e.child_total_balance, 0)) WHERE b.id = ?; 

UPDATE user_profit_loss AS a 
INNER JOIN users b ON (b.id = a.user_id) 
LEFT JOIN users c ON (c.id = a.agent_id) 
LEFT JOIN users d ON (d.id = a.super_agent_id) 
LEFT JOIN users e ON (e.id = a.master_id) 
LEFT JOIN users f ON (f.id = a.admin_id) 
SET 
a.user_available_balance = ROUND((b.balance - b.liability), 6),
a.agent_available_balance = ROUND((c.balance - c.liability), 6),
a.super_agent_available_balance = ROUND((d.balance - d.liability), 6),
a.master_available_balance = ROUND((e.balance - e.liability), 6),
a.admin_available_balance = ROUND((f.balance - f.liability), 6)
WHERE a.user_id = ? AND a.market_id = ? AND a.game_type = '6';`, [data.amount, data.amount, userpl, userData[0].id,
							agentPl, userData[0].parent_agent_id, userData[0].parent_agent_id, userData[0].parent_agent_id,
							superAgentPl, userData[0].parent_super_agent_id, userData[0].parent_super_agent_id, userData[0].parent_super_agent_id,
							masterPl, userData[0].parent_master_id, userData[0].parent_master_id, userData[0].parent_master_id,
							adminPl, userData[0].parent_admin_id, userData[0].parent_admin_id,
							userData[0].id, data.contestId]);

						let getUpdatedUserBalance = await conn.query('SELECT balance FROM users where id = ? LIMIT 1;', [userData[0].id]);
						await conn.commit();
						conn.release();
						return {
							"code": 0,
							"error": false,
							"msg": "Success",
							"data": {
								"amount": getUpdatedUserBalance[0][0].balance,
							}
						};
					} catch (error) {
						await conn.rollback();
						conn.release();
						console.log("error2", error);
						return {
							"code": 1,
							"error": true,
							"msg": "An error occurred",
							"data": {
								"amount": 0
							}
						};
					}
				} else {
					return {
						"code": 1,
						"error": true,
						"msg": "Invalid token",
						"data": {
							"amount": 0
						}
					};
				}
			}
		} else {
			return {
				"code": 1,
				"error": true,
				"msg": "Invalid input values",
				"data": {
					"amount": 0
				}
			};
		}


	} catch (error) {
		return {
			"code": 1,
			"error": true,
			"msg": "An error occurred",
			"data": {
				"amount": 0
			}
		};
	}
};

module.exports = {
	getPlayerInfoVirtualGame,
	getBalanceVirtualGame,
	brinoPlaceBet,
	brinoResult,
	brinoCancelGame,
	fantasyJoinContest,
	fantasyResult
};
