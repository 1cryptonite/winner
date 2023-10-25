const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;


let getGlobalSetting = async () => {
	try {


		let globalSettingQuery = 'select * from global_settings where id = 1 LIMIT 1';
		//console.log(MysqlPool.format(globalSettingQuery))
		let resFromDB = await MysqlPool.query(globalSettingQuery);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("getGlobalSetting",error);
 		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateGlobalSetting = async (data) => {
	try {
		//data.one_click_stack
		let one_click_stack = '';

		if (data.one_click_stack){

			let splitedData=data.one_click_stack.split(',');
			let newArrayOfString=[];
			for (let i = 0; i < 3; i++) {
				if (!splitedData[i]) {
					newArrayOfString.push(0);
				}else{
					newArrayOfString.push(splitedData[i]);
				}
			}
			one_click_stack=newArrayOfString.join(",");
		}

		let match_stack = '';

		if (data.match_stack){

			let splitedData=data.match_stack.split(',');
			let newArrayOfString=[];
			for (let i = 0; i < 5; i++) {
				if (!splitedData[i]) {
					newArrayOfString.push(0);
				}else{
					newArrayOfString.push(splitedData[i]);
				}
			}
			match_stack=newArrayOfString.join(",");
		}

		let updateQuery = 'update global_settings set site_title = ?, site_message = ?, one_click_stack = ?, match_stack = ?, session_stack = ?, bet_allow_time_before = ?, country_code = ?, phone_no = ?;';

		let resFromDB = await MysqlPool.query(updateQuery, [data.site_title, data.site_message, one_click_stack, match_stack, data.session_stack, data.bet_allow_time_before, data.country_code, data.phone_no]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateGlobalSetting",error);
 		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let uploadSocialIcon = async (data) => {
	try {

		let updateQuery = 'update global_settings set social_image = "' + data + '" where id  = 1';

		let resFromDB = await MysqlPool.query(updateQuery);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("uploadSocialIcon",error);
 		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let uploadImage = async (data) => {
	try {
		let updateQuery = 'update global_settings set logo = "' + data + '" where id  = 1';
		let resFromDB = await MysqlPool.query(updateQuery);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("uploadImage",error);
 		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let uploadfavicon = async (data) => {
	try {

		let updateQuery = 'update global_settings set favicon = "' + data + '" where id  = 1';

		let resFromDB = await MysqlPool.query(updateQuery);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("uploadfavicon",error);
 		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let printPDF = async () => {
	try {

		let printPdfQuery = 'select name,user_name,user_type_id,profit_loss from users LIMIT 10';

		let resForPDF = await MysqlPool.query(printPdfQuery);

		//console.log(resForPDF);

		return resultdb(CONSTANTS.SUCCESS, resForPDF);
	} catch (error) {
		logger.errorlog.error("printPDF",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	getGlobalSetting, updateGlobalSetting, uploadImage, uploadfavicon, uploadSocialIcon, printPDF
};
