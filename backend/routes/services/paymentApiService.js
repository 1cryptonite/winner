'use strict';
const settings = require('../../config/settings');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const MysqlPool = require('../../db');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

let createPaymentOrder = async (userId, amount) => {
	try {
		let userData = await MysqlPool.query(`SELECT is_signup_user FROM users WHERE id = ? LIMIT 1;`, [userId]);
		if (userData.length > 0) {
			if(userData[0].is_signup_user == '1'){
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					let data1 = {
						user_id: userId,
						amount: amount,
						type: 'deposit',
						status: 'pending',
						created_at: globalFunction.currentDate(),
						updated_at: globalFunction.currentDate()
					};

					let insertResponse = await conn.query('INSERT INTO payment_orders SET ?', [data1]);
					let lastID = insertResponse[0]['insertId'];
					let orderID = 'dreqtid00' + lastID;
					await conn.query('UPDATE payment_orders SET order_id = ? WHERE id = ?', [orderID, lastID]);
					await conn.commit();
					conn.release();
					return resultdb(CONSTANTS.SUCCESS, orderID);
				} catch (error) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
				}
			} else {
				return resultdb(CONSTANTS.NOT_FOUND, 'Payment Not Allowed !');
			}
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid User !');
		}
	} catch (error) {
		logger.errorlog.error("createPaymentOrder",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
	}
};

let paymentCallback = async (data) => {
	try {
		let orderData = await MysqlPool.query(`SELECT * FROM payment_orders WHERE order_id = ? LIMIT 1;`, [data.order_id]);
		if (orderData.length > 0) {
			if(orderData[0].type == 'deposit'){
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					if(orderData[0].status == 'pending'){
						let user_id = orderData[0].user_id;
						let status = (data.Status == 'Successful') ? 'success' : 'failed';
						await conn.query('UPDATE payment_orders SET status=?, txt_ref=?, updated_at=? WHERE order_id=?', [status, data.Txt_Ref, globalFunction.currentDate(), data.order_id]);

						if(status == 'success'){
							let userData = await MysqlPool.query(`SELECT id, parent_id, name, user_name, balance FROM users WHERE id=? LIMIT 1;`, [user_id]);
							let adminUserData = await MysqlPool.query(`SELECT id, parent_id, balance FROM users WHERE user_type_id=1 LIMIT 1;`, []);
							let admin_user_id = adminUserData[0].id;

							let desc = 'Chips credited via payment getway || Order Id: ' + data.order_id;
							let descParent = 'Chips credited to ' + userData[0].name + '(' + userData[0].user_name + ') via payment getway || Order Id: ' + data.order_id;

							let parent = {
								user_id: admin_user_id,
								parent_id: adminUserData[0].parent_id,
								description: descParent,
								statement_type: 1,
								amount: -data.amount,
								available_balance: adminUserData[0].balance,
								created_at:globalFunction.currentDate()
							};
							let child = {
								user_id: user_id,
								parent_id: admin_user_id,
								description: desc,
								statement_type: 1,
								amount: data.amount,
								available_balance: (parseInt(userData[0].balance) + parseInt(data.amount)),
								created_at:globalFunction.currentDate()
							};

							await conn.query('update users set balance=balance+?, freechips=freechips+?, freechips_balance=freechips_balance+? where id=?', [data.amount, data.amount, data.amount, user_id]);

							//if(userDetail.data.user_type_id==5){
								await conn.query('update users set total_balance=(balance-liability) where id=?', [user_id]);
							/*}else{
								await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [user_id, user_id]);	
							}*/
							//await conn.query('update users set balance=balance-? where id=?', [data.amount,admin_user_id]);
							await conn.query('update users set freechips=freechips+?, freechips_balance=freechips_balance+? where id=?', [data.amount, data.amount, admin_user_id]); //auto credit to admin in case of deposit by payment getway
							await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [admin_user_id, admin_user_id]);
							await conn.query('insert into account_statements set ?', [parent]);
							await conn.query('insert into account_statements set ?', [child]);
						}
					}
					await conn.commit();
					conn.release();
					return {status: "Ok"};
				} catch (error) {
					await conn.rollback();
					conn.release();
					console.log("error", error);
					return {status: "Failed"};
				}
			}else{
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					if(orderData[0].status == 'requested' || orderData[0].status == 'pending'){
						let user_id = orderData[0].user_id;
						let status = (data.Status == 'Successful') ? 'success' : 'failed';
						await conn.query('UPDATE payment_orders SET status=?, txt_ref=?, updated_at=? WHERE order_id=?', [status, data.Txt_Ref, globalFunction.currentDate(), data.order_id]);

						if(status == 'success'){
							let userData = await MysqlPool.query(`SELECT id, parent_id, name, user_name, balance FROM users WHERE id=? LIMIT 1;`, [user_id]);
							let adminUserData = await MysqlPool.query(`SELECT id, parent_id, balance FROM users WHERE user_type_id=1 LIMIT 1;`, []);
							let admin_user_id = adminUserData[0].id;

							let desc = 'Chips debited via payment getway || Order Id: ' + data.order_id;
							let descParent = 'Chips debited from ' + userData[0].name + '(' + userData[0].user_name + ') via payment getway || Order Id: ' + data.order_id;

							let parent = {
								user_id: admin_user_id,
								parent_id: adminUserData[0].parent_id,
								description: descParent,
								statement_type: 1,
								amount: data.amount,
								available_balance: adminUserData[0].balance + parseInt(data.amount),
								created_at:globalFunction.currentDate()
							};
							let child = {
								user_id: user_id,
								parent_id: admin_user_id,
								description: desc,
								statement_type: 1,
								amount: -data.amount,
								available_balance: (parseInt(userData[0].balance) - parseInt(data.amount)),
								created_at:globalFunction.currentDate()
							};

							await conn.query('update users set balance=balance-?, freechips=freechips-?, freechips_balance=freechips_balance-? where id=?', [data.amount, data.amount, data.amount, user_id]);

							//if(userDetail.data.user_type_id==5){
								await conn.query('update users set total_balance=(balance-liability) where id=?', [user_id]);
							/*}else{
								await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [user_id, user_id]);	
							}*/
							await conn.query('update users set balance=balance+? where id=?', [data.amount,admin_user_id]);
							await conn.query('UPDATE `users` AS `dest`,( SELECT IFNULL(SUM(total_balance), 0) total_balance FROM users WHERE parent_id = ?) AS `src` SET `dest`.`total_balance` = `src`.`total_balance` + `dest`.`balance` WHERE `dest`.`id` = ?', [admin_user_id, admin_user_id]);
							await conn.query('insert into account_statements set ?', [parent]);
							await conn.query('insert into account_statements set ?', [child]);
						}
					}
					await conn.commit();
					conn.release();
					return {status: "Ok"};
				} catch (error) {
					await conn.rollback();
					conn.release();
					return {status: "Failed"};
				}
			}
		} else {
			return {status: "Failed"};
		}
	} catch (error) {
		logger.errorlog.error("paymentCallback",error);
		return {status: "Failed"};
	}
};

let submitWithdrawRequest = async (data) => {
	try {
		let userData = await MysqlPool.query(`SELECT is_signup_user FROM users WHERE id = ? LIMIT 1;`, [data.userid]);
		if (userData.length > 0) {
			if(userData[0].is_signup_user == '1'){
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					let data1 = {
						user_id: data.userid,
						amount: data.amount,
						account_number: data.account_number,
				        ifsc: data.ifsc,
				        beneficiary_name: data.beneficiary_name,
				        mobile: data.mobile,
				        withdraw_reason: data.withdraw_reason,
						type: 'withdraw',
						status: 'requested',
						created_at: globalFunction.currentDate(),
						updated_at: globalFunction.currentDate()
					};

					let insertResponse = await conn.query('INSERT INTO payment_orders SET ?', [data1]);
					let lastID = insertResponse[0]['insertId'];
					let orderID = 'wreqtid00' + lastID;
					await conn.query('UPDATE payment_orders SET order_id = ? WHERE id = ?', [orderID, lastID]);
					await conn.commit();
					conn.release();
					return resultdb(CONSTANTS.SUCCESS, 'Withdraw Request Sent Successfully');
				} catch (error) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
				}
			} else {
				return resultdb(CONSTANTS.NOT_FOUND, 'Payment Not Allowed !');
			}
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid User !');
		}
	} catch (error) {
		logger.errorlog.error("submitWithdrawRequest",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
	}
};

let rejectWithdrawRequest = async (orderId, rejectReason) => {
	try {
		let orderData = await MysqlPool.query(`SELECT * FROM payment_orders WHERE order_id = ? LIMIT 1;`, [orderId]);
		if (orderData.length > 0) {
			if(orderData[0].status == 'requested'){
				const conn = await connConfig.getConnection();
				await conn.beginTransaction();
				try {
					await conn.query('UPDATE payment_orders SET status="rejected", reject_reason=?, updated_at=? WHERE order_id=?', [rejectReason, globalFunction.currentDate(), orderId]);
					await conn.commit();
					conn.release();
					return resultdb(CONSTANTS.SUCCESS, 'Wthdraw Order Rejected Successfully');
				} catch (error) {
					await conn.rollback();
					conn.release();
					return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
				}
			}else{
				return resultdb(CONSTANTS.NOT_FOUND, 'Withdraw order already ' + orderData[0].status);
			}
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Withdraw Order Id !');
		}
	} catch (error) {
		logger.errorlog.error("rejectWithdrawRequest",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
	}
};

let checkWithdrawRequest = async (orderId) => {
	try {
		let orderData = await MysqlPool.query(`SELECT * FROM payment_orders WHERE order_id = ? LIMIT 1;`, [orderId]);
		if (orderData.length > 0) {
			if(orderData[0].status == 'requested' && orderData[0].type == 'withdraw'){
				let userData = await MysqlPool.query(`SELECT balance FROM users WHERE id=? LIMIT 1;`, [orderData[0].user_id]);
				if(orderData[0].amount > userData[0].balance){
					return resultdb(CONSTANTS.NOT_FOUND, 'Insufficient Credit Limit In Client !');
				}else{
					return resultdb(CONSTANTS.SUCCESS, orderData[0]);
				}
			}else{
				return resultdb(CONSTANTS.NOT_FOUND, 'Withdraw order already ' + orderData[0].status);
			}
		} else {
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Withdraw Order Id !');
		}
	} catch (error) {
		logger.errorlog.error("checkWithdrawRequest",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
	}
};

let getPaymentOrderList = async (userId, type, status, page) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = ((page - 1) * limit);
		let conditionVal=[];
		let conditionValCount=[];
		let condition = '';
		if(type == 'deposit' || type == 'withdraw'){
			condition = condition + ' AND po.type=? ';
			conditionVal.push(type);
			conditionValCount.push(type);
		}

		if(userId != 0){
			condition = condition + ' AND po.user_id=? ';
			conditionVal.push(userId);
			conditionValCount.push(userId);
		}

		if(status != ''){
			condition = condition + ' AND po.status=? ';
			conditionVal.push(status);
			conditionValCount.push(status);
		}

		conditionVal.push(offset);
		conditionVal.push(limit);

		let orderData = await MysqlPool.query(`SELECT po.order_id AS id, po.user_id, po.amount, po.status, po.type, po.txt_ref, po.account_number, po.ifsc, po.beneficiary_name, po.mobile, po.withdraw_reason, po.reject_reason, po.created_at, po.updated_at, u.name, u.user_name FROM payment_orders AS po INNER JOIN users AS u ON(po.user_id=u.id) WHERE 1 ` + condition + ` ORDER BY po.id DESC LIMIT ?,?;`, conditionVal);

		let total = 0;
		if(page == 1){
			let countData = await MysqlPool.query(`SELECT COUNT(*) AS total FROM payment_orders AS po WHERE 1 ` + condition, conditionValCount);
			total = countData[0].total;
		}

		return resultdb(CONSTANTS.SUCCESS, {data: orderData, total: total});
	} catch (error) {
		logger.errorlog.error("getPaymentOrderList",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
	}
};

let updateOrderStatus = async (orderId, status) => {
	try {
		const conn = await connConfig.getConnection();
		await conn.beginTransaction();
		try {
			await conn.query('UPDATE payment_orders SET status=?, updated_at=? WHERE order_id=?', [status, globalFunction.currentDate(), orderId]);
			await conn.commit();
			conn.release();
			return resultdb(CONSTANTS.SUCCESS, 'Status Updated Successfully');
		} catch (error) {
			await conn.rollback();
			conn.release();
			return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
		}
	} catch (error) {
		logger.errorlog.error("updateOrderStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An Error Occurred !');
	}
};

module.exports = {
	createPaymentOrder,
	paymentCallback,
	submitWithdrawRequest,
	rejectWithdrawRequest,
	checkWithdrawRequest,
	getPaymentOrderList,
	updateOrderStatus
};
