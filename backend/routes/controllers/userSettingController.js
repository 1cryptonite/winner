/* eslint-disable quotes */
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const userSettingService = require('../services/userSettingService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const userModel = require('../../routes/model/userModel');
const logger = require('../../utils/logger');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;

async function createUserSettings(req, res) {
	try {

		let globalInputArray = req.body;

		if (globalInputArray.data && globalInputArray.data.length > 0) {

			let n = 1;
			globalInputArray.data.forEach(async (element, index) => {
				try {

					delete element['sport_name'];
					delete element['id'];
					element['userid'] = req.body.userid;
					element['parent_ids'] = req.body.parent_ids;

					req.body = element;


					const createFancySchema = Joi.object({
						sport_id: Joi.number().required(),
						userid: Joi.number().required(),
						parent_ids: Joi.optional().required(),
						user_id: Joi.number().required(),
						parent_id: Joi.number(),
						match_commission: Joi.number(),
						session_commission: Joi.number(),
						bet_delay: Joi.number(),
						session_delay: Joi.number(),
						odds_max_stack: Joi.number().allow(null),
						odds_min_stack: Joi.number().allow(null),
						session_max_stack: Joi.number().allow(null),
						session_min_stack: Joi.number().allow(null),
						max_profit: Joi.number().allow(null),
						max_loss: Joi.number().allow(null),
						min_exposure: Joi.number().allow(null),
						max_exposure: Joi.number().allow(null),
						winning_limit: Joi.number().allow(null)
					});
					try {
						await createFancySchema.validate(req.body, {
							abortEarly: true
						});
					} catch (error) {
						return apiErrorRes(req, res, error.details[0].message);
					}

					let sport_id =element.sport_id;
					let user_id =element.user_id;
					let myObj = element;
					delete myObj['user_id'];
					delete myObj['parent_ids'];
					delete myObj['userid'];
					delete myObj['id'];
					delete myObj['sport_id'];

					await userSettingService.updateUserSettings(myObj, sport_id, user_id);

					if (globalInputArray.data.length == n) {
						return apiSuccessRes(req, res, 'Updated Successfully');

					}
					n =++ n ;

				} catch (e) {
					return apiErrorRes(req, res, e);
				}
			});
		} else {
			return apiSuccessRes(req, res, 'Please send data.');
		}
	} catch (e) {
		logger.errorlog.error("createUserSettings",e);
		return apiSuccessRes(req, res, 'Error in api.');
	}
}
async function getUserSettingsBySportId(req, res) {
	try {
		let {
			user_id
		} = req.query;
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
		});

		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("user_setting")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}
		if (user_id) {
			let userSetting = await userSettingService.getUserSetting(user_id);
			if (userSetting.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'user settings get successfully', userSetting.data);
			} else {
				return apiErrorRes(req, res, 'Error to get user setting');
			}
		} else {
			return apiErrorRes(req, res, 'Enter valid param!');
		}
	} catch (e) {
		logger.errorlog.error("getUserSettingsBySportId",e);
		return apiSuccessRes(req, res, 'Error in api.');
	}
}

async function updateUserSettings(req, res) {
	try {
		let globalInputArray = req.body;
		let user_id = globalInputArray.user_id;
		let parent_id = globalInputArray.parent_id;

		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("user_setting")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		/*let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;*/
		let user_type_id = globalInputArray.user_type_id;
		if (globalInputArray.data && globalInputArray.data.length > 0) {
			let globalInputArrayData = globalInputArray.data;
			for (let i in globalInputArrayData){
				let element = globalInputArrayData[i];
				let validateUserSettings = await userSettingService.validateUserSettings(parent_id, element, user_type_id);
				if(validateUserSettings.statusCode != CONSTANTS.SUCCESS){
					return apiErrorRes(req, res, validateUserSettings.data);
				}
			}
			await userSettingService.updateUserSettingsAllSport(globalInputArray, user_id);
			return apiSuccessRes(req, res, 'User setting updated successfully');
		}else{
			return apiErrorRes(req, res, 'Data Empty !');
		}
	} catch (e) {
		logger.errorlog.error("updateUserSettings",e);
		return apiSuccessRes(req, res, 'An Error Occurred !');
	}
}

router.post('/createUserSettings', createUserSettings);
// router.post('/updateUserSettingById', updateUserSettingById);
router.get('/getUserSettingsBySportId', getUserSettingsBySportId);
router.post('/updateUserSettings', updateUserSettings);

module.exports = router;
