/* eslint-disable indent */
const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const settings = require('../../config/settings');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let updateApkVersion = async (user_id, apk_name, apk_version, is_active, message) => {
    try {
        let qry = "SELECT * from apk;";
        let qryResult = await MysqlPool.query(qry);
        if(qryResult.length > 0)
        {
            let qry = "UPDATE apk SET user_id = '"+user_id+"', apk_name = '"+apk_name+"', " +
                "apk_version = '"+apk_version+"', is_active = '"+is_active+"',  message = '"+message+"', " +
                "updated_at = UNIX_TIMESTAMP(NOW()) WHERE id = '1';";
            //console.log(qry);
            let qryResult = await MysqlPool.query(qry);
            return resultdb(CONSTANTS.SUCCESS, qryResult);
        }
        else {
            let qry = "INSERT INTO apk(user_id, apk_name, apk_version, is_active, message, created_at, updated_at) VALUES " +
                "( '"+user_id+"','"+ apk_name+"', '"+apk_version+"', '"+is_active+"', '"+message+"', UNIX_TIMESTAMP(NOW()),UNIX_TIMESTAMP(NOW()) );";
            let qryResult = await MysqlPool.query(qry);
            return resultdb(CONSTANTS.SUCCESS, qryResult);
        }
    } catch (error) {
        logger.errorlog.error("updateApkVersion",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getApkData = async () => {
    try {
        let qry = "SELECT * FROM apk;";
        let qryResult = await MysqlPool.query(qry);
        if(qryResult.length > 0)
        {
            let item  = qryResult[0];
            let apk_data = {
                "apk_name" : item.apk_name,
                "apk_version" : item.apk_version,
                "is_active" : item.is_active,
                "message" : item.message,
                "apk_url" : "app.apk"
            };
            return resultdb(CONSTANTS.SUCCESS, apk_data);
        }else{
            return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
        }
    }
    catch (e) {
        logger.errorlog.error("getApkData",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let changeIsActiveStatus = async (is_active) => {
    try {
        let qry = "UPDATE apk SET is_active = ?;";
        let qryResult = await MysqlPool.query(qry, is_active);
        return resultdb(CONSTANTS.SUCCESS, qryResult);
    } catch (error) {
        logger.errorlog.error("changeIsActiveStatus",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

module.exports = {
    updateApkVersion,
    getApkData,
    changeIsActiveStatus
};
