/* eslint-disable indent */
const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let createAccStatementAndUpdateBalance = async (data) => {
	const conn = await connConfig.getConnection();
	try {
		let desc = '';
		if (data.crdr===CONSTANTS.DEBIT_TWO) {
			desc = 'Admin Self Debit';
		}else{
			desc = 'Admin Self Credit';
		}

		if(data.description != ''){
			desc = desc + ' || ' + data.description;
		}

		let accountdetails = {
			user_id: data.user_id,
			parent_id: data.parent_id,
			description: desc,
			statement_type: data.statement_type,
			created_at:globalFunction.currentDate()
		};
		let queryString='';
		if (data.crdr===CONSTANTS.DEBIT_TWO) {
			queryString='update users set balance=balance - ?, freechips=freechips - ?, freechips_balance=freechips_balance - ? where id=?';
			accountdetails.amount=-data.amount;
			accountdetails.available_balance = (parseInt(data.userCurrentBalance) - parseInt(data.amount));
		}else{
			queryString='update users set balance=balance + ?, freechips=freechips + ?, freechips_balance=freechips_balance + ? where id=?';
			accountdetails.amount = data.amount;
			accountdetails.available_balance = (parseInt(data.userCurrentBalance) + parseInt(data.amount));
		}
		await conn.beginTransaction();
		await conn.query(queryString, [data.amount, data.amount, data.amount, data.user_id]);
		await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [data.user_id, data.user_id]);
	
		await conn.query('insert into account_statements set ?', [accountdetails]);
		await conn.commit();conn.release();
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("createAccStatementAndUpdateBalance",error);
		await conn.rollback();conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let createAccStatementAndUpdateBalanceParentAndUser = async (data, userDetail) => {
	const conn = await connConfig.getConnection();
	try {

		let desc = '';
		let descParent = '';

		if (data.crdr === CONSTANTS.CREDIT_ONE) {

			desc = 'Chips credited from parent';
			descParent = 'Chips credited to ' + userDetail.data.name + '(' + userDetail.data.user_name + ')';

			if(data.description != ''){
				desc = desc + ' || ' + data.description;
				descParent = descParent + ' || ' + data.description;
			}

			let parent = {
				user_id: data.parent_id,
				parent_id: data.parentOfParentId,
				description: descParent,
				statement_type: data.statement_type,
				amount: -data.amount,
				available_balance: (parseInt(data.parentCurrentBalance) - parseInt(data.amount)),
				created_at:globalFunction.currentDate()
			};
			let child = {
				user_id: data.user_id,
				parent_id: data.parent_id,
				description: desc,
				statement_type: data.statement_type,
				amount: data.amount,
				available_balance: (parseInt(data.userCurrentBalance) + parseInt(data.amount)),
				created_at:globalFunction.currentDate()
			};

			await conn.beginTransaction(); 
			await conn.query('update users set balance=balance + ?,freechips=freechips + ?, freechips_balance=freechips_balance + ? where id=?', [data.amount, data.amount, data.amount, data.user_id]);

			if(userDetail.data.user_type_id==5){
				await conn.query('update users set total_balance= (balance - liability)  where id=?', [data.user_id]);
			}else{
				await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [data.user_id, data.user_id]);	
			}
			await conn.query('update users set balance=balance - ? where id=?', [data.amount,data.parent_id]);
			await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [data.parent_id, data.parent_id]);

			let queryOld = 'SELECT count(*) cnt FROM account_statements a where a.user_id = ? AND a.parent_id = ? AND a.amount = ? AND a.created_at > (? - 30)  order by a.id desc; ';
			let dataOld = await conn.query(queryOld, [child.user_id,child.parent_id,child.amount,child.created_at]);
			if(dataOld[0][0].cnt > 0){
				throw new Error('duplicate entry');
			}

			await conn.query('insert into account_statements set ?', [parent]);
			await conn.query('insert into account_statements set ?', [child]);
		
			await conn.commit();conn.release();
			return resultdb(CONSTANTS.SUCCESS);
		} else if (data.crdr === CONSTANTS.DEBIT_TWO) {

			desc = 'Chips debited from parent';
			descParent = 'Chips debited from ' + userDetail.data.name + '(' + userDetail.data.user_name + ')';

			if(data.description != ''){
				desc = desc + ' || ' + data.description;
				descParent = descParent + ' || ' + data.description;
			}

			let parent = {
				user_id: data.parent_id,
				parent_id: data.parentOfParentId,
				description: descParent,
				statement_type: data.statement_type,
				amount: data.amount,
				available_balance: (parseInt(data.parentCurrentBalance) + parseInt(data.amount)),
				created_at:globalFunction.currentDate()
			};
			let child = {
				user_id: data.user_id,
				parent_id: data.parent_id,
				description: desc,
				statement_type: data.statement_type,
				amount: -data.amount,
				available_balance: (parseInt(data.userCurrentBalance) - parseInt(data.amount)),
				created_at:globalFunction.currentDate()
			};
			await conn.beginTransaction();
            await conn.query('update users set balance=balance - ?,freechips=freechips - ?, freechips_balance=freechips_balance - ? where id=?', [data.amount, data.amount, data.amount, data.user_id]);
            if(userDetail.data.user_type_id==5){
            	await conn.query('update users set total_balance = (balance - liability)  where id=?', [data.user_id]);
            }else{
            	await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [data.user_id, data.user_id]);
            }	
            
            await conn.query('update users set balance=balance + ? where id=?', [data.amount, data.parent_id]);
            await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [data.parent_id, data.parent_id]);

      		let queryOld = 'SELECT count(*) cnt FROM account_statements a where a.user_id = ? AND a.parent_id = ? AND a.amount = ? AND a.created_at > (? - 30)  order by a.id desc; ';
			let dataOld = await conn.query(queryOld, [child.user_id,child.parent_id,child.amount,child.created_at]);
			if(dataOld[0][0].cnt > 0){
				throw new Error('duplicate entry');
			}

			await conn.query('insert into account_statements set ?', [parent]);
			await conn.query('insert into account_statements set ?', [child]);

			await conn.commit();conn.release();
			return resultdb(CONSTANTS.SUCCESS);
		} else {
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("createAccStatementAndUpdateBalanceParentAndUser",error);
		await conn.rollback();conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getAccountStatement_backup = async (data) => {
	try {

		let limit = CONSTANTS.LIMIT;
		let offset = ((data.pageno - 1) * limit);
		let condition = '';

		if(data.filter == 'FC'){
			condition = ' AND a.statement_type = 1 ';
		}
		else if(data.filter == 'PL'){
			condition = ' AND a.statement_type IN(2, 3, 4, 5, 8, 9) ';
		}
		else if(data.filter == 'PDC'){
			condition = ' AND a.statement_type = 9 ';
		}

		let getqury = '';
		if(data.is_download && data.is_download == 1){
			getqury = 'SELECT a.created_at date, b.name user_name, a.description, a.amount credit_debit, a.available_balance balance FROM account_statements AS a LEFT JOIN users AS b ON a.user_id = b.id where a.user_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ' + condition + ' order by a.id desc; ';
		}else{
			getqury = 'SELECT SQL_CALC_FOUND_ROWS a.created_at date, b.name user_name, a.user_id, b.user_type_id, a.description, a.amount credit_debit, a.available_balance balance, a.statement_type, a.match_id, a.market_id, a.type, a.id AS account_statement_id FROM account_statements AS a LEFT JOIN users AS b ON a.user_id = b.id where a.user_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ' + condition + ' order by a.id desc  LIMIT ? OFFSET ?; ';
		}

		getqury = getqury + ' SELECT FOUND_ROWS() AS total;';

		//console.log(MysqlPool.format(getqury, [data.user_id, data.from_date, data.to_date,limit,offset]))
		let insertAccSTMT = await MysqlPool.query(getqury, [data.user_id, data.from_date, data.to_date,limit,offset]);

		let resData={list:insertAccSTMT[0], total:insertAccSTMT[1][0].total, limit: limit};
		
		return resultdb(CONSTANTS.SUCCESS, resData);
	} catch (error) {
		logger.errorlog.error("getAccountStatement_backup",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAccountStatement_bkp_pagination = async (data) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = ((data.pageno - 1) * limit);
		let query = '';
		let limitQry = '';
		let calcRows = '';
		let previousBalance = 0;
		let type_field = 'user';
		if(data.user_type_id == 1){
			type_field = 'admin';
		}
		else if(data.user_type_id == 2){
			type_field = 'master';
		}
		else if(data.user_type_id == 3){
			type_field = 'super_agent';
		}
		else if(data.user_type_id == 4){
			type_field = 'agent';
		}

		if(!data.is_download || data.is_download != 1){
			calcRows = ' SQL_CALC_FOUND_ROWS ';
			limitQry = ' LIMIT ?, ? ';

			if(data.pageno > 1){
				let limitOld = offset;
				let valuesOld = [data.user_id, data.from_date, data.to_date, limitOld];
				let queryOld = '';
				if(data.filter == 'FC'){
					queryOld = `SELECT ROUND((@runtot := a.amount + @runtot), 2) AS balance FROM account_statements AS a, (SELECT @runtot:=0) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC LIMIT 0, ?;`;
				}
				else if(data.filter == 'PL'){
					queryOld = `SELECT ROUND((@runtot :=  (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund )  + @runtot), 2) AS balance FROM user_profit_loss a, (SELECT @runtot:=0) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC LIMIT 0, ?; `;
				}
				else if(data.filter == 'PDC'){
					queryOld = `SELECT ROUND((@runtot :=  (a.admin_pdc_charge + a.admin_pdc_refund) + @runtot), 2) AS balance FROM user_profit_loss a, (SELECT @runtot:=0) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC LIMIT 0, ?; `;
				}
				else{
					queryOld = `SELECT ROUND((@runtot := xx.credit_debit + @runtot), 2) AS balance FROM (SELECT a.created_at AS date, (CASE WHEN (a.statement_type = 6) THEN -(a.amount) ELSE a.amount END) AS credit_debit FROM account_statements AS a WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
			UNION ALL 
			SELECT a.created_at AS date, (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit FROM user_profit_loss a WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)) AS xx, (SELECT @runtot:=0) yy ORDER BY xx.date ASC LIMIT 0, ?; `;
					valuesOld = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date, limitOld];
				}
				let dataOld = await MysqlPool.query(queryOld, valuesOld);
				if(dataOld.length > 0){
					previousBalance = dataOld[(dataOld.length) - 1].balance;
				}
			}
		}

		let values = [previousBalance, data.user_id, data.from_date, data.to_date, offset, limit];
		if(data.filter == 'FC'){
			query = `SELECT ${calcRows} a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, a.amount AS credit_debit, '' AS match_id, '' AS market_id, ROUND((@runtot := a.amount + @runtot), 2) AS balance, '0' AS type FROM account_statements AS a LEFT JOIN users AS b ON (a.user_id = b.id), (SELECT @runtot:=?) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC ${limitQry};`;
		}
		else if(data.filter == 'PL'){
			query = `SELECT ${calcRows} a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, ROUND((@runtot :=  (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund )  + @runtot), 2) AS balance, a.type AS type FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC ${limitQry}; `;
		}
		else if(data.filter == 'PDC'){
			query = `SELECT ${calcRows} a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.pdc_description AS description, (a.${type_field}_pdc_charge + a.${type_field}_pdc_refund) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, ROUND((@runtot :=  (a.admin_pdc_charge + a.admin_pdc_refund) + @runtot), 2) AS balance FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC ${limitQry}; `;
		}
		else{
			query = `SELECT ${calcRows} xx.*, ROUND((@runtot := (CASE WHEN (xx.is_settlement = 1) THEN -(xx.credit_debit) ELSE xx.credit_debit END) + @runtot), 2) AS balance FROM (SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, a.amount AS credit_debit, '' AS match_id, '' AS market_id, (CASE WHEN (a.statement_type = 6) THEN 1 ELSE 0 END) AS is_settlement, '0' AS type FROM account_statements AS a LEFT JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
			UNION ALL 
			SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, 0 AS is_settlement, a.type AS type FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)) AS xx, (SELECT @runtot:=?) yy ORDER BY xx.date ASC ${limitQry}; `;
			values = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date, previousBalance, offset, limit];
		}
		query = query + ' SELECT FOUND_ROWS() AS total;';
		let resultData = await MysqlPool.query(query, values);
		let resData={list:resultData[0], total:resultData[1][0].total, limit: limit};
		//console.log('resData', resData);

		return resultdb(CONSTANTS.SUCCESS, resData);
	} catch (error) {
		logger.errorlog.error("getAccountStatement_bkp_pagination",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getAccountStatement_bakup_without_pagination = async (data) => {
	try {
		let query = '';
		let previousBalance = 0;
		let type_field = 'user';
		if(data.user_type_id == 1){
			type_field = 'admin';
		}
		else if(data.user_type_id == 2){
			type_field = 'master';
		}
		else if(data.user_type_id == 3){
			type_field = 'super_agent';
		}
		else if(data.user_type_id == 4){
			type_field = 'agent';
		}

		let values = [previousBalance, data.user_id, data.from_date, data.to_date];
		if(data.filter == 'FC'){
			query = `SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, a.amount AS credit_debit, '' AS match_id, '' AS market_id, ROUND((@runtot := a.amount + @runtot), 2) AS balance, '0' AS type FROM account_statements AS a LEFT JOIN users AS b ON (a.user_id = b.id), (SELECT @runtot:=?) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC;`;
		}
		else if(data.filter == 'PL'){
			query = `SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, ROUND((@runtot :=  (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund )  + @runtot), 2) AS balance, a.type AS type FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC; `;
		}
		else if(data.filter == 'PDC'){
			query = `SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.pdc_description AS description, (a.${type_field}_pdc_charge + a.${type_field}_pdc_refund) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, ROUND((@runtot :=  (a.admin_pdc_charge + a.admin_pdc_refund) + @runtot), 2) AS balance FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC; `;
		}
		else{
			query = `SELECT xx.*, ROUND((@runtot := (CASE WHEN (xx.is_settlement = 1) THEN -(xx.credit_debit) ELSE xx.credit_debit END) + @runtot), 2) AS balance FROM (SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, a.amount AS credit_debit, '' AS match_id, '' AS market_id, (CASE WHEN (a.statement_type = 6) THEN 1 ELSE 0 END) AS is_settlement, '0' AS type FROM account_statements AS a LEFT JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
			UNION ALL 
			SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, (a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, 0 AS is_settlement, a.type AS type FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)) AS xx, (SELECT @runtot:=?) yy ORDER BY xx.date ASC; `;
			values = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date, previousBalance];
		}
		query = query + ' SELECT FOUND_ROWS() AS total;';
		let resultData = await MysqlPool.query(query, values);
		let resData={list:resultData[0].reverse(), total:resultData[1][0].total, limit: 10000000000};

		return resultdb(CONSTANTS.SUCCESS, resData);
	} catch (error) {
		logger.errorlog.error("getAccountStatement_bakup_without_pagination",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAccountStatement_bkp1 = async (data) => {
	try {
		let pageNo = data.pageno;
		let limit = CONSTANTS.LIMIT;
		let offset = ((pageNo - 1) * limit);
		let query = '';
		let limitQry = '';
		let previousBalance = 0;
		let type_field = 'user';
		if(data.user_type_id == 1){
			type_field = 'admin';
		}
		else if(data.user_type_id == 2){
			type_field = 'master';
		}
		else if(data.user_type_id == 3){
			type_field = 'super_agent';
		}
		else if(data.user_type_id == 4){
			type_field = 'agent';
		}

		if(!data.is_download || data.is_download != 1){
			limitQry = ' LIMIT ?, ? ';
		}

		/*Below query is to get total results and latest balance in ascending order which will be used in below 2 queries as opening balance to calculate available balance in descending order*/
		let valuesOld = [data.user_id, data.from_date, data.to_date];
		let queryOld = '';
		if(data.filter == 'FC'){
			queryOld = `SELECT ROUND((@runtot := a.amount + @runtot), 2) AS balance, ROUND(a.amount, 2) AS amount FROM account_statements AS a, (SELECT @runtot:=0) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC;`;
		}
		else if(data.filter == 'PL'){
			queryOld = `SELECT ROUND((@runtot := IFNULL(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 0)  + @runtot), 2) AS balance, ROUND(IFNULL(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 0), 2) AS amount FROM user_profit_loss a, (SELECT @runtot:=0) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at ASC; `;
		}
		else if(data.filter == 'PDC'){
			queryOld = `SELECT ROUND((@runtot := IFNULL(SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund), 0) + @runtot), 2) AS balance, ROUND(IFNULL(SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund), 0), 2) AS amount FROM user_profit_loss a, (SELECT @runtot:=0) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at ASC; `;
		}
		else{
			queryOld = `SELECT ROUND((@runtot := xx.credit_debit + @runtot), 2) AS balance, ROUND(xx.credit_debit, 2) AS amount FROM (SELECT a.created_at AS date, (CASE WHEN (a.statement_type = 6) THEN -(a.amount) ELSE a.amount END) AS credit_debit FROM account_statements AS a WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
			UNION ALL 
			SELECT a.created_at AS date, IFNULL(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 0) AS credit_debit FROM user_profit_loss a WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type) AS xx, (SELECT @runtot:=0) yy ORDER BY xx.date ASC; `;
			valuesOld = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date];
		}

		let dataOld = await MysqlPool.query(queryOld, valuesOld);
		let total =  dataOld.length;
		if(total > 0){
			previousBalance = dataOld[total - 1].balance + dataOld[total - 1].amount;
			//previousBalance = dataOld[total - 1].balance - dataOld[total - 1].amount;
			//previousBalance = dataOld[total - 1].balance;
		}

		/*Below query to get opening balance when we move to page number more than 1 so we can calculated balance continuing with previous page's last balance */
		if(pageNo > 1) {
			let limit1 = (pageNo - 1) * limit;
			let query1 = '';
			let values1 = [previousBalance, data.user_id, data.from_date, data.to_date, limit1];
			let limitQry1 = 'limit 0, ?';
			if (data.filter == 'FC') {
				query1 = `SELECT ROUND((@runtot := @runtot - a.amount), 2) AS balance FROM account_statements AS a, (SELECT @runtot:=?) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at DESC ${limitQry1};`;
			} else if (data.filter == 'PL') {
				query1 = `SELECT ROUND((@runtot := @runtot - SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund )), 2) AS balance FROM user_profit_loss a, (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at DESC ${limitQry1}; `;
			} else if (data.filter == 'PDC') {
				query1 = `SELECT ROUND((@runtot := @runtot - SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund)), 2) AS balance FROM user_profit_loss a, (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at DESC ${limitQry1}; `;
			} else {
				query1 = `SELECT ROUND((@runtot := @runtot - xx.credit_debit), 2) AS balance FROM (SELECT a.created_at AS date, (CASE WHEN (a.statement_type = 6) THEN -(a.amount) ELSE a.amount END) AS credit_debit FROM account_statements AS a WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
			UNION ALL 
			SELECT a.created_at AS date, IFNULL(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 0) AS credit_debit FROM user_profit_loss a WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type) AS xx, (SELECT @runtot:=?) yy ORDER BY xx.date DESC ${limitQry1}; `;
				values1 = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date, previousBalance, limit1];
			}

			let resultData1 = await MysqlPool.query(query1, values1);
			previousBalance = resultData1[resultData1.length - 1].balance;
		}

		/*Final queries for output*/
		let values = [previousBalance, data.user_id, data.from_date, data.to_date, offset, limit];
		if(data.filter == 'FC'){
			query = `SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, ROUND(a.amount, 2) AS credit_debit, '' AS match_id, '' AS market_id, ROUND((@runtot := @runtot - a.amount), 2) AS balance, '0' AS type FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id), (SELECT @runtot:=?) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at DESC ${limitQry};`;
		}
		else if(data.filter == 'PL'){
			query = `SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, ROUND(IFNULL(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 0), 2) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, ROUND((@runtot := @runtot - SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund )), 2) AS balance, a.type AS type FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at DESC ${limitQry}; `;
		}
		else if(data.filter == 'PDC'){
			query = `SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.pdc_description AS description, ROUND(IFNULL(SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund), 0), 2) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, ROUND((@runtot := @runtot - IFNULL(SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund), 0)), 2) AS balance FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=?) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at DESC ${limitQry}; `;
		}
		else{
			query = `SELECT xx.*, ROUND((@runtot := @runtot - (CASE WHEN (xx.is_settlement = 1) THEN -(xx.credit_debit) ELSE xx.credit_debit END)), 2) AS balance FROM (SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, a.amount AS credit_debit, '' AS match_id, '' AS market_id, (CASE WHEN (a.statement_type = 6) THEN 1 ELSE 0 END) AS is_settlement, '0' AS type FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
			UNION ALL 
			SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, IFNULL(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 0) AS credit_debit, a.match_id AS match_id, a.market_id AS market_id, 0 AS is_settlement, a.type AS type FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ) AS xx, (SELECT @runtot:=?) yy ORDER BY xx.date DESC ${limitQry}; `;
			values = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date, previousBalance, offset, limit];
		}

		let resultData = await MysqlPool.query(query, values);
		let resData={list:resultData, total:total, limit: limit};

		return resultdb(CONSTANTS.SUCCESS, resData);
	} catch (error) {
		logger.errorlog.error("getAccountStatement_bkp1",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAccountStatement_bkp_of_dynamic_calculate_avaliable_balance = async (data) => {
	try {
		let pageNo = data.pageno;
		let limit = CONSTANTS.LIMIT;
		let offset = ((pageNo - 1) * limit);
		let query = '';
		let type_field = 'user';
		if(data.user_type_id == 1){
			type_field = 'admin';
		}
		else if(data.user_type_id == 2){
			type_field = 'master';
		}
		else if(data.user_type_id == 3){
			type_field = 'super_agent';
		}
		else if(data.user_type_id == 4){
			type_field = 'agent';
		}

		let values = [data.user_id, data.from_date, data.to_date];
		if(data.filter == 'FC'){
			query = `SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, '' AS match_id, '' AS market_id, '0' AS type,
			ROUND(a.amount, 2) AS credit_debit,  
			ROUND((@runtot := a.amount + @runtot), 2) AS balance 
			FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id), (SELECT @runtot:=0) yy WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at ASC;`;
		}
		else if(data.filter == 'PL'){
			query = `SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, a.match_id AS match_id, a.market_id AS market_id, a.type AS type,
			ROUND(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 2) AS credit_debit, 
			ROUND((@runtot := SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) + @runtot), 2) AS balance 
			FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=0) yy WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at ASC; `;
		}
		else if(data.filter == 'PDC'){
			query = `SELECT  a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, a.match_id AS match_id, a.market_id AS market_id, a.type AS type,
			ROUND(SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund), 2) AS credit_debit,	
			ROUND((@runtot := SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund) + @runtot), 2) AS balance 
			FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id), (SELECT @runtot:=0) yy WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at ASC; `;
		}
		else{
			query = `SELECT  xx.*, ROUND((@runtot := (CASE WHEN (xx.is_settlement = 1) THEN -(xx.credit_debit) ELSE xx.credit_debit END) + @runtot), 2) AS balance
			FROM (
				SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, '' AS match_id, '' AS market_id, '0' AS type, 
				 ROUND(a.amount, 2) AS credit_debit,
				 (CASE WHEN (a.statement_type = 6) THEN 1 ELSE 0 END) AS is_settlement
				 FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
				UNION ALL 
				SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, a.match_id AS match_id, a.market_id AS market_id, a.type AS type, 
				SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit,
				0 AS is_settlement 
				FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type
			) AS xx, (SELECT @runtot:=0) yy ORDER BY xx.date ASC; `;
			values = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date];
		}

		let resultData = await MysqlPool.query(query, values);
		let total =  resultData.length;

		resultData = resultData.reverse();
		let finalResult = [];
		if(!data.is_download || data.is_download != 1){
			finalResult = resultData.slice(offset, (pageNo * limit));
		}else{
			finalResult = resultData;
		}

		let resData={list:finalResult, total:total, limit: limit};

		return resultdb(CONSTANTS.SUCCESS, resData);
	} catch (error) {
		logger.errorlog.error("getAccountStatement_bkp_of_dynamic_calculate_avaliable_balance",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAccountStatement = async (data) => {
	try {
		let pageNo = data.pageno;
		let limit = CONSTANTS.LIMIT;
		let offset = ((pageNo - 1) * limit);
		let query = '';
		let type_field = 'user';
		if(data.user_type_id == 1){
			type_field = 'admin';
		}
		else if(data.user_type_id == 2){
			type_field = 'master';
		}
		else if(data.user_type_id == 3){
			type_field = 'super_agent';
		}
		else if(data.user_type_id == 4){
			type_field = 'agent';
		}

		let values = [data.user_id, data.from_date, data.to_date];
		if(data.filter == 'FC'){
			query = `SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, '' AS match_id, '' AS market_id, '0' AS type,'0' AS market_type,
			ROUND(a.amount, 2) AS credit_debit,  
			ROUND(a.available_balance, 2) AS balance 
			FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type = 1 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at DESC;`;
		}
		else if(data.filter == 'PL'){
			query = `SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, a.match_id AS match_id, a.market_id AS market_id, a.type AS type,a.type AS market_type,
			ROUND(SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ), 2) AS credit_debit, 
			ROUND(a.${type_field}_available_balance, 2) AS balance 
			FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at DESC; `;
		}
		else if(data.filter == 'PDC'){
			query = `SELECT  a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.pdc_description AS description, a.match_id AS match_id, a.market_id AS market_id, a.type AS type,a.type AS market_type,
			ROUND(SUM(a.${type_field}_pdc_charge + a.${type_field}_pdc_refund), 2) AS credit_debit,	
			ROUND(a.${type_field}_available_balance, 2) AS balance 
			FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND a.is_pdc_charged = '1' AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type ORDER BY a.created_at DESC; `;
		}
		else if (data.filter == 'S') {
			query = `SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, '' AS match_id, '' AS market_id, '0' AS type,'0' AS market_type,
			ROUND(a.amount, 2) AS credit_debit,  
			ROUND(a.available_balance, 2) AS balance 
			FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type = 6 AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) ORDER BY a.created_at DESC;`;
		}
		else{
			query = `SELECT  xx.*
			FROM (
				SELECT a.created_at AS date, b.name AS user_name, a.user_id, b.user_type_id, a.description, '' AS match_id, '' AS market_id, '0' AS type,'0' AS market_type, 
				 ROUND(a.amount, 2) AS credit_debit,
				 ROUND(a.available_balance, 2) AS balance 
				 FROM account_statements AS a INNER JOIN users AS b ON (a.user_id = b.id) WHERE a.user_id = ? AND a.statement_type IN (1, 6) AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?)
				UNION ALL 
				SELECT a.created_at AS date, b.name AS user_name, b.id AS user_id, b.user_type_id, a.description, a.match_id AS match_id, a.market_id AS market_id, a.type AS type, a.type AS market_type, 
				SUM(a.${type_field}_pl + a.${type_field}_commission + a.super_admin_commission_${type_field}_part + a.${type_field}_pdc_charge + a.${type_field}_pdc_refund ) AS credit_debit,
				ROUND(a.${type_field}_available_balance, 2) AS balance 
				FROM user_profit_loss a INNER JOIN users AS b ON(a.${type_field}_id = b.id) WHERE a.${type_field}_id = ? AND DATE(FROM_UNIXTIME(a.created_at+19800)) >= date(?) AND DATE(FROM_UNIXTIME(a.created_at+19800)) <= date(?) GROUP BY a.match_id, a.market_id, a.type
			) AS xx ORDER BY xx.date DESC; `;
			values = [data.user_id, data.from_date, data.to_date, data.user_id, data.from_date, data.to_date];
		}


		let resultData = await MysqlPool.query(query, values);
		let total =  resultData.length;

		let finalResult = [];
		if(!data.is_download || data.is_download != 1){
			finalResult = resultData.slice(offset, (pageNo * limit));
		}else{
			finalResult = resultData;
		}

		let resData={list:finalResult, total:total, limit: limit};

		return resultdb(CONSTANTS.SUCCESS, resData);
	} catch (error) {
		logger.errorlog.error("getAccountStatement",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getProfitLoss = async (data) => {
	try {

		var getquery = '';

		switch (data.user_type) {
			case 5:
				getquery = 'select m.name,SUM (upl.user_pl) pl,SUM(upl.user_commission) comm,upl.created_at,m.match_id from user_profit_loss upl LEFT JOIN matches m ON upl.matc h_id = m.match_id where upl.user_id = ? AND upl.created_at >= ? AND upl.created_at <= ? GROUP BY m.match_id ORDER BY upl.created_at LIMIT  ?,?';
				break;
				// eslint-disable-next-line indent
			case 4:
				getquery = 'select m.name,SUM(upl.agent_pl) pl,SUM(upl.agent_commission) comm,upl.created_at,m.match_id from user_profit_loss upl LEFT JOIN matches m ON upl.match_id = m.match_id where upl.agent_id = ? AND upl.created_at >= ? AND upl.created_at <= ? GROUP BY m.match_id ORDER BY upl.created_at LIMIT  ?,?';

				break;
			case 3:
				getquery = 'select m.name,SUM(upl.super_agent_pl) pl,SUM(upl.super_agent_commission) comm,upl.created_at,m.match_id from user_profit_loss upl LEFT JOIN matches m ON upl.match_id = m.match_id where upl.super_agent_id = ? AND upl.created_at >= ? AND upl.created_at <= ? GROUP BY m.match_id ORDER BY upl.created_at LIMIT ?,?';

				break;
			case 2:

				getquery = 'select m.name,SUM(upl.master_pl) pl,SUM(upl.master_commission) comm,upl.created_at,m.match_id from user_profit_loss upl LEFT JOIN matches m ON upl.match_id = m.match_id where upl.master_id = ? AND upl.created_at >= ? AND upl.created_at <= ? GROUP BY m.match_id ORDER BY upl.created_at LIMIT ?,?';

				break;
			case 1:

				getquery = 'select m.name,SUM(upl.admin_pl) pl,SUM(upl.admin_commission) comm,upl.created_at,m.match_id from user_profit_loss upl LEFT JOIN matches m ON upl.match_id = m.match_id where upl.admin_id = ? AND upl.created_at >= ? AND upl.created_at <= ? GROUP BY m.match_id ORDER BY upl.created_at LIMIT ?,?';

				break;
			default:
				break;
		}

		let insertAccSTMT = await MysqlPool.query(getquery, [data.user_id, data.from_date, data.to_date, data.offset, data.limit]);


		return resultdb(CONSTANTS.SUCCESS, insertAccSTMT);
	} catch (error) {
		logger.errorlog.error("getProfitLoss",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAccountDetails = async (data) => {
	try {

		var getquery = '';
		switch (data.user_type) {
			case 5:
				getquery = `SELECT m.name, upl.user_pl pl, upl.user_commission comm,upl.created_at,m.market_id,upl.type 
							FROM user_profit_loss upl
							LEFT JOIN markets m ON upl.match_id = m.match_id
							WHERE upl.user_id = ? AND upl.match_id = ?
							ORDER BY upl.created_at DESC`;
				break;
				// eslint-disable-next-line indent
			case 4:
				getquery = `SELECT m.name, upl.agent_pl pl, upl.agent_commission comm,upl.created_at,m.market_id,upl.type
							FROM user_profit_loss upl
							LEFT JOIN markets m ON upl.match_id = m.match_id
							WHERE upl.agent_id = ? AND upl.match_id = ?
							ORDER BY upl.created_at DESC`;
				break;
			case 3:
				getquery = `SELECT m.name, upl.super_agent_pl pl, upl.super_agent_commission comm,upl.created_at,m.market_id,upl.type
							FROM user_profit_loss upl
							LEFT JOIN markets m ON upl.match_id = m.match_id
							WHERE upl.super_agent_id = ? AND upl.match_id = ?
							ORDER BY upl.created_at DESC`;
				break;
			case 2:

				getquery = `SELECT m.name, upl.master_pl pl, upl.master_commission comm,upl.created_at,m.market_id,upl.type
				FROM user_profit_loss upl
				LEFT JOIN markets m ON upl.match_id = m.match_id
				WHERE upl.master_id = ? AND upl.match_id = ?
				ORDER BY upl.created_at DESC`;
				break;
			case 1:

				getquery = `SELECT m.name, upl.admin_pl pl, upl.admin_commission comm,upl.created_at,m.market_id,upl.type
				FROM user_profit_loss upl
				LEFT JOIN markets m ON upl.match_id = m.match_id
				WHERE upl.admin_id = ? AND upl.match_id = ?
				ORDER BY upl.created_at DESC`;
				break;
			default:
				break;
		}
		let insertAccSTMT = await MysqlPool.query(getquery, [data.user_id, data.match_id]);
		return resultdb(CONSTANTS.SUCCESS, insertAccSTMT);
	} catch (error) {
		logger.errorlog.error("getAccountDetails",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let chipInOutStatement = async (data) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (data.page-1) * limit;

		let qry = 'SELECT ';
		if(data.page == 1){
			qry = qry + ' SQL_CALC_FOUND_ROWS ';
		}

		qry = qry + ' * FROM account_statements where account_statements.user_id = ? AND statement_type = 1 ';

		if(data.from_date && data.from_date != ''){
			qry = qry + ' AND DATE(FROM_UNIXTIME(account_statements.created_at)) >= DATE("' + data.from_date + '") ';
		}

		if(data.to_date && data.to_date != ''){
			qry = qry + ' AND DATE(FROM_UNIXTIME(account_statements.created_at)) <= DATE("' + data.to_date + '") ';
		}

		qry = qry + ' ORDER BY account_statements.id DESC  LIMIT ? OFFSET ?; SELECT FOUND_ROWS() AS total;';

		let qryResult = await MysqlPool.query(qry, [data.user_id, limit, offset]);
		return resultdb(CONSTANTS.SUCCESS, qryResult);
	} catch (error) {
		logger.errorlog.error("chipInOutStatement",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


module.exports = {
	createAccStatementAndUpdateBalance,
	createAccStatementAndUpdateBalanceParentAndUser,
	getAccountStatement,
	getProfitLoss,
	getAccountDetails,
	chipInOutStatement
};
