/* eslint-disable indent */
const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let saveNotification = async (message) => {
	try {
		let qry = 'INSERT INTO notifications (message, status, created_at) VALUES (?, "1", UNIX_TIMESTAMP());';
		let qryResult = await MysqlPool.query(qry, [message]);
		return resultdb(CONSTANTS.SUCCESS, qryResult);
	} catch (error) {
		logger.errorlog.error("saveNotification",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateNotificationStatus = async (id, status) => {
	try {
		if(status == '2'){
			let qry = 'DELETE FROM notifications WHERE id = ?';
			let qryResult = await MysqlPool.query(qry, [id]);
			return resultdb(CONSTANTS.SUCCESS, qryResult);
		}else{
			let qry = 'UPDATE notifications SET status = ? WHERE id = ?';
			let qryResult = await MysqlPool.query(qry, [status, id]);
			return resultdb(CONSTANTS.SUCCESS, qryResult);
		}
	} catch (error) {
		logger.errorlog.error("updateNotificationStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAllNotifications = async () => {
	try {
		let qryResult = await MysqlPool.query('SELECT * FROM notifications ORDER BY id DESC;');
		return resultdb(CONSTANTS.SUCCESS, qryResult);
	} catch (error) {
		logger.errorlog.error("getAllNotifications",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAllActiveNotifications = async (user_id, isReadStatus = 0) => {
	try {

		if(isReadStatus == 1){
			let qry = 'INSERT INTO notification_read (user_id, notification_id) (SELECT ? AS user_id, id FROM notifications WHERE status = "1" AND id NOT IN (SELECT notification_id FROM notification_read WHERE user_id = ?));';
			await MysqlPool.query(qry, [user_id, user_id]);
		}

		let qryResult = await MysqlPool.query('SELECT a.*, CASE WHEN(b.notification_id IS NULL) THEN 0 ELSE 1 END AS is_read FROM notifications AS a LEFT JOIN notification_read AS b ON(a.id = b.notification_id AND b.user_id = ?) WHERE a.status = "1" GROUP BY a.id ORDER BY a.id DESC;', [user_id]);

		return resultdb(CONSTANTS.SUCCESS, qryResult);
	} catch (error) {
		logger.errorlog.error("getAllActiveNotifications",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	saveNotification,
	updateNotificationStatus,
	getAllNotifications,
	getAllActiveNotifications
};
