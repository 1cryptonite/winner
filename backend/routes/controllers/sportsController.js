const express = require('express');
const router = express.Router();
const Joi = require('joi');
const sportsService = require('../services/sportsService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const userModel = require('../../routes/model/userModel');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;

async function createSports(req, res) {
	let {
		name,
		sport_id,
		is_manual
	} = req.body;

	const createSportsSchema = Joi.object({
		sport_id: Joi.string().allow(''),
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		name: Joi.string().required(),
		is_manual: Joi.string().valid('0', '1').required(),
	});
	try {
		await createSportsSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	if (is_manual === '1') {
		let randomNumber = globalFunction.randomIntFromInterval(CONSTANTS.MANUAL_SPORTS_MIN_RANGE, CONSTANTS.MANUAL_SPORTS_MAX_RANGE);
		sport_id = CONSTANTS.MANUAL_SPORT + randomNumber;
	}
	let  reqdaa = {
		name,
		sport_id,
		is_manual,
		is_active: '0',
		create_at: globalFunction.currentDate(),
		update_at: globalFunction.currentDate()
	};

	let datafromService = await sportsService.createSports(reqdaa);
	if (datafromService.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Sports create successfully');
	} else {
		return apiSuccessRes(req, res, 'Error to create sports.');
	}
}
async function getAllSports(req, res) {
	let {
		limit,
		pageno,
		status
	} = req.body;
	const profilechema = Joi.object().keys({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
	}).unknown(true);
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	// subadmin permission work  
	// let loginUserData = userModel.getUserData();
	// if(loginUserData.hasOwnProperty('sub_admin_roles')){
	// 	if(loginUserData.sub_admin_roles.length==0){
	// 		return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
	// 	}else if(loginUserData.sub_admin_roles.indexOf("sports_setting_menu")==-1){
	// 		return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
	// 	}
	// }

	let data={
		limit,
		pageno,
		status
	};
	let getUserDetailsFromDB = await sportsService.getAllSports(data);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to Sports.');
	}
}

async function getSportSetting(req, res) {
    let {
        sport_id
    } = req.params;

    let getUserDetailsFromDB = await sportsService.getSportSetting(sport_id);
    if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Success', getUserDetailsFromDB.data);

    } else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
        return apiSuccessRes(req, res, 'not found.');
    } else {
        return apiSuccessRes(req, res, 'Error to Sports.');
    }
}

async function updateSportsStatus(req, res) {

	let {
		sport_id,
		userid
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		sport_id: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = await userModel.getUserData();

	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("sports_status")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let user_type_id = loginUserData.user_type_id;

	if(user_type_id == CONSTANTS.USER_TYPE_ADMIN){
		let getUserDetailsFromDB = await sportsService.updateSportsStatus(sport_id);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, CONSTANTS_MESSAGE.UPDATED_SUCCESS_MESSAGE);
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiSuccessRes(req, res, 'not found.');
		} else {
			return apiSuccessRes(req, res, 'An Error Occurred !');
		}
	}else{
		let user_id = userid;
		let reqData = {
			user_id,
			sport_id
		};
		let datafromService = await sportsService.getDeactiveSport(reqData);

		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			let createDeactiveSport = await sportsService.deleteDeactiveSport(reqData);
			if (createDeactiveSport.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Sport activated', );
			} else {
				return apiSuccessRes(req, res, 'An Error Occurred !', );
			}
		} else if (datafromService.statusCode === CONSTANTS.NOT_FOUND) {
			let createDeactiveSport = await sportsService.createDeactiveSport(reqData);
			if (createDeactiveSport.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Sport deactivated');
			} else {
				return apiErrorRes(req, res, 'An Error Occurred !', );
			}
		} else {
			return apiErrorRes(req, res, 'An Error Occurred !');
		}
	}

}
async function updateSportsSetting(req, res) {

	let {
		id, min_odds_limit, max_odss_limit,pdc_charge, pdc_refund
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		id: Joi.number().required(),
        min_odds_limit: Joi.number().required(),
        max_odss_limit: Joi.number().required(),
		pdc_charge: Joi.optional().default(0),
		pdc_refund: Joi.optional().default(0)
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	pdc_charge = (pdc_charge==undefined) ? 0 : pdc_charge;
	pdc_refund = (pdc_refund==undefined) ? 0 : pdc_refund;

	let getUserDetailsFromDB = await sportsService.updateSportsSetting({min_odds_limit,max_odss_limit, pdc_charge, pdc_refund},id);

	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, CONSTANTS_MESSAGE.UPDATED_SUCCESS_MESSAGE);
	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateSportsStatus.');
	}
}
async function deactiveSport(req, res) {
	let {
		user_id,
		sport_id
	} = req.body;

	const createSportsSchema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		sport_id: Joi.string().allow(''),
		user_id: Joi.number().required(),
	});
	try {
		await createSportsSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let reqData = {
		user_id,
		sport_id
	};
	let datafromService = await sportsService.getDeactiveSport(reqData);

	if (datafromService.statusCode === CONSTANTS.SUCCESS) {
		let createDeactiveSport = await sportsService.deleteDeactiveSport(reqData);
		if (createDeactiveSport.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'deleted successfully.', );
		} else {
			return apiSuccessRes(req, res, 'Error create', );
		}
	} else if (datafromService.statusCode === CONSTANTS.NOT_FOUND) {
		let createDeactiveSport = await sportsService.createDeactiveSport(reqData);
		if (createDeactiveSport.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'DeactiveSport create successfully.');
		} else {
			return apiSuccessRes(req, res, 'Error create', );
		}
	} else {
		return apiSuccessRes(req, res, 'User id not found.');
	}
}

async function getBookmakerAllowedSports(req, res) {
	const profilechema = Joi.object().keys({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let result = await sportsService.getBookmakerAllowedSports();
	if (result.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success', result.data);
	}else{
		return apiErrorRes(req, res, 'Error to get sports !');
	}
}

router.post('/deactiveSport', deactiveSport);
router.post('/updateSportsStatus', updateSportsStatus);
router.post('/updateSportsSetting', updateSportsSetting);
router.post('/createSports', createSports);
router.post('/getAllSports', getAllSports);
router.get('/getSportSetting/:sport_id', getSportSetting);
router.post('/sports/getBookmakerAllowedSports', getBookmakerAllowedSports);
module.exports = router;
