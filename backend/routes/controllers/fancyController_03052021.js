const express = require('express');
const axios = require('axios');
const router = express.Router();
const Joi = require('joi');
const fancyService = require('../services/fancyService');
const settings = require('../../config/settings');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const userService = require('../services/userService');

const matchesService = require('../services/matchesService');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;
const userModel = require('../../routes/model/userModel');

const redis_client = require('../../db/redis');

async function createFancy(req, res) {
	try {
		let {
			match_id,
			super_admin_fancy_id,
			name,
			fancy_type_id,
			session_value_yes,
			session_value_no,
			fancy_range,
			sport_id,
			session_size_no,
			session_size_yes,
			is_indian_fancy,
			selection_id
		} = req.body;

		const createFancySchema = Joi.object({
			match_id: Joi.string().required(),
			super_admin_fancy_id: Joi.string().required(),
			name: Joi.string().required(),
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_type_id: Joi.number().required().positive(),
			// date_time: Joi.number().required().positive(),
			session_value_yes: Joi.string().required(),
			session_value_no: Joi.string().required(),
			fancy_range: Joi.string().required(),
			sport_id: Joi.string().required(),
			session_size_no: Joi.string().required(),
			session_size_yes: Joi.string().required(),
			is_indian_fancy: Joi.number().valid(0, 1).required(),
			selection_id: Joi.string().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			//errorlog.error('Invalid param.'+error);
			return apiErrorRes(req, res, error.details[0].message);
		}
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("session_fancy")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		if (is_indian_fancy === '1') {
			let randomNumber = globalFunction.randomIntFromInterval(CONSTANTS.MANUAL_SPORTS_MIN_RANGE, CONSTANTS.MANUAL_SPORTS_MAX_RANGE);
			selection_id = CONSTANTS.MANUAL_FANCY + randomNumber;
		}
		let fancy_id = match_id + '_' + selection_id;

		let reqdata = {
			match_id,
			super_admin_fancy_id,
			name,
            selection_id,
			fancy_type_id,
			date_time: new Date(),
			session_value_yes,
			session_value_no,
			fancy_range,
			sport_id,
			session_size_no,
			session_size_yes,
			is_indian_fancy,
			active: '1',
			fancy_id
		};

		let datafromService = await fancyService.createFancy(reqdata);
		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Fancy created successfully');
		} else {
			//errorlog.error('Error to create Fancy. ');
			return apiSuccessRes(req, res, 'Error to create Fancy.');
		}
	} catch (e) {
		//errorlog.error('Error to create Fancy. '+e);
		return apiSuccessRes(req, res, 'Error to create Fancy.');
	}
}
async function getFancy(req, res) {
	try {
		let {
			match_id
		} = req.body;
		const createFancySchema = Joi.object({
			match_id: Joi.string(),
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
		 // subadmin permission work
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("manage_fancy_sub_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		let reqParam = {
			match_id
		};

		let fancyList = await fancyService.getFancy(reqParam);
		if (fancyList.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Fancy get successfully', fancyList.data);
		} else {
			//errorlog.error('Error to getFancy ');
			return apiSuccessRes(req, res, 'Error to get Fancy.');
		}
	} catch (e) {
		//errorlog.error('Error to getFancy '+e);
		return apiSuccessRes(req, res, 'Server error.');
	}
}


async function getIndianFancy(req, res) {
	try {
		let {match_id} = req.query;
		if (match_id) {
			const createFancySchema = Joi.object({
				userid: Joi.number().required(),
				parent_ids: Joi.optional().required()
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
				}else if(loginUserData.sub_admin_roles.indexOf("indian_fancy")==-1){
					return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
				}
			}
			let parents =req.body.parent_ids;
			let matcketfromService = await fancyService.getmarketId({match_id});
			let ActiveFancyListFromDB = await fancyService.getActiveFancyList(match_id, parents);

            ActiveFancyListFromDB = JSON.parse(JSON.stringify(ActiveFancyListFromDB.data));
			if (matcketfromService.data.length > 0 && matcketfromService.statusCode === CONSTANTS.SUCCESS) {
				let market_id = matcketfromService.data[0].market_id;
				let fancyUrl = settings.fancyUrl + market_id;
				let indianFancy = await axios.get(fancyUrl);
				if (indianFancy.data) {
					if (indianFancy.data.session) {
						let fancyArray = indianFancy.data.session;

                        let result =fancyArray.map((item) => {

                            let findStatus=ActiveFancyListFromDB.find(o2 => item.SelectionId == o2.selection_id);
                            if (findStatus ) {
                                item.is_active= '1';
                            }else{
                                item.is_active= '0';
                            }
                            return item;
                        });


						return apiSuccessRes(req, res, 'Success', result);
					} else {
						return apiSuccessRes(req, res, 'Session not found for this matchID', []);						
					}
				} else {
					return apiErrorRes(req, res, 'Error to get Fancy API.');
				}
			} else if (matcketfromService.data.length === 0 && matcketfromService.statusCode === CONSTANTS.SUCCESS){
				return apiErrorRes(req, res, 'Market Id not enable with this market Id');
			}else{
				return apiErrorRes(req, res, 'Error to get Fancy.');
			}
		} else {
			return apiErrorRes(req, res, 'Enter valid param!');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Server Error');
	}
}



async function getOnlineFancy(req, res) {

	let market_id = req.query;

	if (market_id) {
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required()
		});

		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);


		}

		let onlineFancyRes = await axios.get(settings.ONLINE_URL + market_id);


		let onlineFancyList = onlineFancyRes.data;
		let listOfId = [];
		let mapsdata = onlineFancyList.map((element) => {

			listOfId.push(element.competition.id);
			return {
				sport_id: sport_id,
				series_id: element.competition.id,
				name: element.competition.name
			};
		});

		let getUserDetailsFromDB = await fancyService.getFancyBySuperAdmin(market_id);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			let marketListFromDB = getUserDetailsFromDB.data;
			if (marketListFromDB.length > 0) {


				let availableIDInDB = mapsdata.length > 0 ? mapsdata.filter(o1 => seriesListFromDB.some(o2 => o1.series_id === o2.series_id)).map((element) => {
					return {
						...element,
						is_active: '1'
					};
				}) : [];
				let notAvailableIDInDB = mapsdata.length > 0 ? mapsdata.filter(o1 => seriesListFromDB.some(o2 => o1.series_id !== o2.series_id)).map((element) => {
					return {
						...element,
						is_active: '0'
					};
				}) : [];
				let sendId = [...availableIDInDB, ...notAvailableIDInDB];

				return apiSuccessRes(req, res, 'success11', sendId);
			} else {
				let notAvailableIDInDB = mapsdata.map((element) => {
					return {
						...element,
						is_active: '0'
					};
				});
				return apiSuccessRes(req, res, 'success11', notAvailableIDInDB);
			}

		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiSuccessRes(req, res, 'not found.');
		} else {
			return apiSuccessRes(req, res, 'Error to get series.');
		}

	} else {
		return apiErrorRes(req, res, 'Enter valid param!');

	}
}



async function getFancyById(req, res) {
	try {
		let {
			fancy_id
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
		if (fancy_id) {
			let fancyList = await fancyService.getFancyById(fancy_id);
			if (fancyList.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Fancy get successfully', fancyList.data);
			} else {
				return apiSuccessRes(req, res, 'Error to get Fancy.');
			}
		} else {
			return apiErrorRes(req, res, 'Enter valid param!', error);

		}
	} catch (e) {
	}
}

async function updateFancyById(req, res) {
	try {
		let {
			fancy_id,
			active,
			max_session_bet_liability,
			max_session_liability,
			fancy_mode,
			name
		} = req.body;

		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_id: Joi.string().required(),
			active: Joi.string().valid('0', '1', '2'),
			max_session_bet_liability: Joi.string(),
			max_session_liability: Joi.string(),
			fancy_mode: Joi.string(),
			name: Joi.string(),
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
			}else if(loginUserData.sub_admin_roles.indexOf("update_fancy")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}
		let inputKey = '';
		let Myobj = req.body;


		for (var prop in Myobj) {
			if (prop != 'userid' && prop != 'id'  && prop !='fancy_id' && prop != 'parent_ids') {
				inputKey = prop;
			}
		}

		let globalList = await fancyService.updatefancyData(inputKey, Myobj[inputKey], Myobj['fancy_id']);
		if (globalList.statusCode === CONSTANTS.SUCCESS) {

			return apiSuccessRes(req, res, 'fancy update successfully');
		} else {
			return apiSuccessRes(req, res, 'Error to get Fancy.');
		}
	} catch (e) {
	}
}


async function updateFancyData(req, res) {
	try {
		let {
			fancy_id,
			max_stack,
			rate_diff,
			point_diff,
			session_value_yes,
			session_value_no,
			session_size_yes,
			session_size_no,
			remark
		} = req.body;

		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_id: Joi.string().required(),
			max_stack: Joi.string().required(),
			rate_diff: Joi.string().required(),
			point_diff: Joi.string().required(),
			session_value_yes: Joi.string().required(),
			session_value_no: Joi.string().required(),
			session_size_no: Joi.string().required(),
			session_size_yes: Joi.string().required(),
			remark: Joi.string().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let reqParam = {
			fancy_id,
			max_stack,
			rate_diff,
			point_diff,
			session_value_yes,
			session_value_no,
			session_size_yes,
			session_size_no,
			remark
		};

		let globalList = await fancyService.updatefancy(reqParam);
		if (globalList.statusCode === CONSTANTS.SUCCESS) {

			return apiSuccessRes(req, res, 'fancy update successfully');
		} else {
			return apiSuccessRes(req, res, 'Error to get Fancy.');
		}
	} catch (e) {
	}
}





// CALL `sp_set_result_fancy`(pSportsID, pMatchID, pFancyID, pResult);
let matchResultFancy = async (req, res) => {
	let {
		sport_id,
		match_id,
		fancy_id,
		result,
		sportName,
		matchName,
	} = req.body;

	const resultSchema = Joi.object({

		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		sport_id: Joi.string().required(''),
		match_id: Joi.string().required(),
		fancy_id: Joi.string().required(),
		result: Joi.string().required(),
		sportName: Joi.string().required(),
		matchName: Joi.string().required()
	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("fancy_result")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}


	let getUserByUserId = await userService.getUserByUserId(req.body.userid);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		if (getUserByUserId.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

			let FancyResultData = await fancyService.matchResultFancy(sport_id, match_id, fancy_id, result,sportName,matchName);

			if (FancyResultData.statusCode === CONSTANTS.SUCCESS) {

				return apiSuccessRes(req, res, FancyResultData.data[0].sMsg, FancyResultData.data[0].iReturn);
			} else {
				return apiSuccessRes(req, res, 'Error to get fancy result');
			}

		} else {
			return apiErrorRes(req, res, 'user unauthorized');

		}
	} else {
		return apiSuccessRes(req, res, 'Error to get fancy result');
	}



};

async function abandonedFancy(req, res) {
	try {

		let {
			fancyID,
			is_rollback
		} = req.body;
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancyID: Joi.string().required(),
			is_rollback: Joi.number().required()
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
			}else if(loginUserData.sub_admin_roles.indexOf("fancy_abandoned")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}
		let Fancy = await fancyService.abandonedFancy(fancyID, is_rollback);
		if (Fancy.statusCode === CONSTANTS.SUCCESS && Fancy.data.resultV===1) {
			return apiSuccessRes(req, res, Fancy.data.retMess);
		} else {
			return apiSuccessRes(req, res, Fancy.data.retMess);
		}
	} catch (e) {
		return apiSuccessRes(req, res, 'Error to abandoned Fancy.');
	}
}

let fancyRollback = async (req, res) => {
	let {
		bet_result_id,
		match_id,
		fancy_id
	} = req.body;

	const resultSchema = Joi.object({

		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		bet_result_id: Joi.string().required(''),
		match_id: Joi.string().required(),
		fancy_id: Joi.string().required(),

	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("match_rollback_sub_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}


/*	let getUserByUserId = await userService.getUserByUserId(req.body.userid);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		if (getUserByUserId.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {*/

			let oddsRollbackData = await fancyService.getRollbackFancy(bet_result_id, match_id, fancy_id);

			if (oddsRollbackData.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, oddsRollbackData.data[0].retMess, oddsRollbackData.data[0].resultV);
			} else {
				return apiSuccessRes(req, res, 'Error to do rollback');
			}

		/*} else {
			return apiErrorRes(req, res, 'user unauthorized');

		}
	} else {
		return apiSuccessRes(req, res, 'Error to do rollback');
	}*/



};

async function getFancyPosition(req, res) {
    try {
        let {
            fancy_id,
            user_id
        } = req.body;
        const createFancySchema = Joi.object({
            userid: Joi.number().required(),
            user_id: Joi.number().required(),
            fancy_id: Joi.string().required(),
            parent_ids: Joi.optional().required(),
        });
        try {
            await createFancySchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }
        let fancyList = await fancyService.getFancyPosition(userid,fancy_id);

        if (fancyList.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'post ', fancyList);
        } else {
            return apiErrorRes(req, res, 'Error to get Fancy.');
        }

    } catch (e) {
        return apiErrorRes(req, res, 'Server error!');
    }
}

async function getRunTimeFancyPosition(req, res) {
    try {
        let {
            fancy_id,
            user_id,
            user_type_id
        } = req.body;
        const createFancySchema = Joi.object({
            userid: Joi.number().required(),
            user_id: Joi.number().required(),
            user_type_id: Joi.number().required(),
            fancy_id: Joi.string().required(),
            parent_ids: Joi.optional().required(),
        });
        try {
            await createFancySchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }
        let fancyList = await fancyService.getRunTimeFancyPosition(user_id,fancy_id,user_type_id);

        if (fancyList.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'post ', fancyList.data);
        } else {
            return apiErrorRes(req, res, 'Error to get Fancy.');
        }

    } catch (e) {
        return apiErrorRes(req, res, 'Server error!');
    }
}



let getFancyUser = async function (req, res) {

    let {match_id,parent_id,parent_type}=req.body;
    const matchschema = Joi.object({
        userid: Joi.number().required(),
        fancy_id: Joi.optional(),
        parent_ids: Joi.optional().required(),
        parent_id: Joi.required(),
        parent_type: Joi.required(),
    });
    try {
        await matchschema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }
    let getMatchUserData = await fancyService.getFancyUser(match_id,parent_id,parent_type);
    if (getMatchUserData.statusCode===CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Success',getMatchUserData.data);

    } else {
        return apiSuccessRes(req, res, 'not found.');
    }
};


let setFancyRiskManagement = async function (req, res) {

	let {
		fancy_id,
		max_session_bet_liability,
		max_session_liability
	}=req.body;

	const matchschema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		fancy_id: Joi.optional().required(),
		max_session_bet_liability: Joi.number().required().positive().allow(0),
		max_session_liability: Joi.number().required().positive().allow(0)
	});
	try {
		await matchschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("edit_fancy")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	
	let user_type_id = loginUserData.user_type_id;

	if(user_type_id === CONSTANTS.USER_TYPE_ADMIN){

		let returnData = await fancyService.setFancyRiskManagement(req.body);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, returnData.data);
		} else {
			return apiErrorRes(req, res, returnData.data);
		}

	}else{
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}
};

async function createFancyBySuperAdmin(req, res) {
	try {
		let {
			match_id,
			super_admin_fancy_id,
			name,
			fancy_type_id,
			session_value_yes,
			session_value_no,
			fancy_range,
			sport_id,
			session_size_no,
			session_size_yes,
			selection_id
		} = req.body;

		const createFancySchema = Joi.object({
			match_id: Joi.string().required(),
			super_admin_fancy_id: Joi.string().required(),
			name: Joi.string().required(),
			fancy_type_id: Joi.number().required().positive(),
			session_value_yes: Joi.string().required(),
			session_value_no: Joi.string().required(),
			fancy_range: Joi.string().required(),
			sport_id: Joi.string().required(),
			session_size_no: Joi.string().required(),
			session_size_yes: Joi.string().required(),
			selection_id: Joi.string().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let checkMatchIsAdded = await matchesService.getMatchSettingById(match_id);
		if(checkMatchIsAdded.data) {

			let fancy_id = match_id + '_' + selection_id;

			let checkFancyIsAdded = await fancyService.getFancyById(fancy_id);
			if(checkFancyIsAdded.data.length > 0){
				return apiErrorRes(req, res, 'Fancy already added !');
			}else {
				let reqdata = {
					match_id,
					super_admin_fancy_id,
					name,
					selection_id,
					fancy_type_id,
					date_time: new Date(),
					session_value_yes,
					session_value_no,
					fancy_range,
					sport_id,
					session_size_no,
					session_size_yes,
					is_indian_fancy: '0',
					active: '1',
					fancy_id
				};

				let dataFromService = await fancyService.createFancy(reqdata);
				if (dataFromService.statusCode === CONSTANTS.SUCCESS) {
					return apiSuccessRes(req, res, 'Fancy created successfully');
				} else {
					return apiErrorRes(req, res, 'Error to create Fancy !');
				}
			}
		}else{
			return apiErrorRes(req, res, 'Match not added !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Error to create Fancy !');
	}
}

let setResultFancyBySuperAdmin = async (req, res) => {
	let {
		sport_id,
		match_id,
		selection_id,
		result,
		sportName,
		matchName
	} = req.body;

	const resultSchema = Joi.object({
		sport_id: Joi.string().required(''),
		match_id: Joi.string().required(),
		selection_id: Joi.string().required(),
		result: Joi.string().required(),
		sportName: Joi.string().required(),
		matchName: Joi.string().required()
	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let fancy_id = match_id + '_' + selection_id;

	let checkFancyIsAdded = await fancyService.getFancyById(fancy_id);
	if(checkFancyIsAdded.data.length > 0) {

		let FancyResultData = await fancyService.matchResultFancy(sport_id, match_id, fancy_id, result, sportName, matchName);

		if (FancyResultData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, FancyResultData.data[0].sMsg, FancyResultData.data[0].iReturn);
		} else {
			return apiErrorRes(req, res, 'Error to get fancy result !');
		}
	}else{
		return apiErrorRes(req, res, 'Fancy not added !');
	}

};

async function abandonedFancyBySuperAdmin(req, res) {
	try {

		let {
			match_id,
			selection_id
		} = req.body;
		const createFancySchema = Joi.object({
			match_id: Joi.string().required(),
			selection_id: Joi.string().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let fancy_id = match_id + '_' + selection_id;

		let Fancy = await fancyService.abandonedFancy(fancy_id, 0);
		if (Fancy.statusCode === CONSTANTS.SUCCESS && Fancy.data.resultV===1) {
			return apiSuccessRes(req, res, Fancy.data.retMess);
		} else {
			return apiSuccessRes(req, res, Fancy.data.retMess);
		}
	} catch (e) {
		return apiSuccessRes(req, res, 'Error to abandoned Fancy !');
	}
}

async function updateFancyStatusBySuperAdmin(req, res) {
	try {
		let {
			match_id,
			selection_id,
			is_update_all,
			active
		} = req.body;

		const createFancySchema = Joi.object({
			match_id: Joi.string().required(),
			selection_id: Joi.string(),
			active: Joi.string().valid('0', '1', '2'),
			is_update_all: Joi.number().valid(0, 1)
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let Myobj = req.body;

		let globalList = await fancyService.updateFancyStatusBySuperAdmin(Myobj);
		if (globalList.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Fancy status updated successfully');
		} else {
			return apiErrorRes(req, res, 'Error to update fancy status !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Error to update fancy status !');
	}
}

async function updateFancyMessageBySuperAdmin(req, res) {
	try {
		let {
			match_id,
			selection_id,
			message
		} = req.body;

		const createFancySchema = Joi.object({
			match_id: Joi.string().required(),
			selection_id: Joi.string().required(),
			message: Joi.string().allow('').required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let Myobj = req.body;

		let globalList = await fancyService.updateFancyMessageBySuperAdmin(Myobj);
		if (globalList.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Fancy message updated successfully');
		} else {
			return apiErrorRes(req, res, 'Error to update fancy message !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Error to update fancy message !');
	}
}

async function updateDeactiveFancyStatus(req, res) {
	let {
		user_id,
		fancy_id
	} = req.body;

	const createSportsSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		fancy_id: Joi.string().required(),
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
		fancy_id
	};
	let datafromService = await fancyService.updateDeactiveFancyStatus(reqData);
	if (datafromService.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, datafromService.data);
	} else {
		return apiErrorRes(req, res, 'Error to activate/deactivate fancy !');
	}
}

async function createManualFancy(req, res) {
	try {
		let {
			match_id,
			name,
			point_diff,
			fancy_type_id,
			fancy_range,
			sport_id
		} = req.body;

		const createFancySchema = Joi.object({
			match_id: Joi.string().required(),
			name: Joi.string().required(),
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_type_id: Joi.number().required().positive(),
			fancy_range: Joi.number().required(),
			sport_id: Joi.string().required(),
			point_diff: Joi.number().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

			//fetching max selection_id from database for given match
			let fetch_selection_id = await fancyService.getMaxSelectionIdMatch(match_id);
			if (fetch_selection_id.statusCode === CONSTANTS.SUCCESS) {
				let fetched_data = fetch_selection_id.data[0];
				let max_selection_id = fetched_data.selection_id.split("_");
				let selection_id = CONSTANTS.MANUAL_FANCY + "_" + (parseInt(max_selection_id[2]) + 1);
				let fancy_id = match_id + '_' + selection_id;
				let session_value_yes = 100;
				let session_value_no = 100;
				let session_size_yes = 100;
				let session_size_no = 100;

				let reqdata = {
					match_id,
					name,
					selection_id,
					fancy_type_id,
					date_time: new Date(),
					session_value_yes: session_value_yes,
					session_value_no: session_value_no,
					rate_diff: fancy_range,
					fancy_range,
					sport_id,
					point_diff,
					session_size_no: session_size_no,
					session_size_yes: session_size_yes,
					is_indian_fancy: '1',
					active: '0',
					fancy_id
				};

				let datafromService = await fancyService.createFancy(reqdata);
				if (datafromService.statusCode === CONSTANTS.SUCCESS) {
					let redis_data = {
						'SelectionId': selection_id,
						'RunnerName': name,
						'LayPrice1': session_value_no,
						'LaySize1': session_size_no,
						'BackPrice1': session_value_yes,
						'BackSize1': session_size_yes,
						'GameStatus': ""
					};
					redis_client.localClient.set(fancy_id, JSON.stringify(redis_data));

					return apiSuccessRes(req, res, 'Fancy created successfully');
				} else {
					return apiErrorRes(req, res, 'Error to create Fancy !');
				}
			} else {
				return apiErrorRes(req, res, 'Error to create Fancy !');
			}
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Error to create Fancy !');
	}
}

async function updateFancyOdds(req, res) {
	try {
		let {
			fancy_id,
			session_value_yes,
			session_value_no,
			session_size_yes,
			session_size_no,
		} = req.body;

		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_id: Joi.string().required(),
			session_value_yes: Joi.number().required(),
			session_value_no: Joi.number().required(),
			session_size_no: Joi.number().required(),
			session_size_yes: Joi.number().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

			let fancyData = await redis_client.localClient.get(fancy_id);
			if (fancyData == null) {
				fancyData = await redis_client.client.get(fancy_id);
			}
			if (fancyData == null) {
				return apiErrorRes(req, res, 'Fancy not available !');
			}

			let fancyDetail = JSON.parse(fancyData);

			let redisData = {
				'SelectionId': fancyDetail.selection_id,
				'RunnerName': fancyDetail.name,
				'LayPrice1': session_value_no,
				'LaySize1': session_size_no,
				'BackPrice1': session_value_yes,
				'BackSize1': session_size_yes,
				'GameStatus': fancyDetail.GameStatus
			};
			redis_client.localClient.set(fancy_id, JSON.stringify(redisData));
			return apiSuccessRes(req, res, 'Fancy update successfully');
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Error to update Fancy !');
	}
}

async function getFancyDetail(req, res) {
	try {
		let {
			fancy_id
		} = req.body;
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_id: Joi.string().required()
		});

		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let result = await fancyService.getFancyById(fancy_id);
		if (result.statusCode === CONSTANTS.SUCCESS) {

			if(result.data.length > 0) {
				let fancyData =  result.data[0];

				let redisData;
				if(fancyData.fancy_mode == '1' || fancyData.is_indian_fancy == '1'){
					redisData = await redis_client.localClient.get(fancy_id);
				}else{
					redisData = await redis_client.client.get(fancy_id);
				}

				fancyData.display_message = null;
				if (redisData != null) {
					redisData = JSON.parse(redisData);
					fancyData.session_size_no = redisData.LaySize1;
					fancyData.session_size_yes = redisData.BackSize1;
					fancyData.session_value_no = redisData.LayPrice1;
					fancyData.session_value_yes = redisData.BackPrice1;
					fancyData.display_message =(redisData.GameStatus) ? redisData.GameStatus : null;
				}
				return apiSuccessRes(req, res, 'Success', fancyData);
			}else{
				return apiErrorRes(req, res, 'Fancy not available !');
			}
		} else {
			return apiErrorRes(req, res, 'An error occurred !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'An error occurred !');
	}
}

async function changeFancyMode(req, res) {

	try {

		let {
			fancy_id,
			fancy_mode
		} = req.body;
		const createMarketSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_id: Joi.string().required(),
			fancy_mode: Joi.optional().required()
		});
		try {
			await createMarketSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

			if (fancy_mode == '1') {
				let odds = await redis_client.client.get(fancy_id);
				if (odds == null) {
					return apiErrorRes(req, res, 'Fancy closed !');
				}else{
					await redis_client.localClient.set(fancy_id, odds);
				}
			}

			let result = await fancyService.changeFancyMode({fancy_id, fancy_mode});
			if (result.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Fancy mode updated');
			} else {
				return apiErrorRes(req, res, 'Error to update !');
			}
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

}

async function updateRatePointDiff(req, res) {

	try {

		let {
			fancy_id,
			rate_diff,
			point_diff
		} = req.body;
		const createMarketSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			fancy_id: Joi.string().required(),
			rate_diff: Joi.number().required(),
			point_diff: Joi.number().required()
		});
		try {
			await createMarketSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
			let result = await fancyService.updateRatePointDiff({fancy_id, rate_diff, point_diff});
			if (result.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Updated successfully');
			} else {
				return apiErrorRes(req, res, 'Error to update !');
			}
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

}

router.post('/getFancyPosition', getFancyPosition);
router.post('/getRunTimeFancyPosition', getRunTimeFancyPosition);
router.post('/createFancy', createFancy);
router.post('/getFancy', getFancy);
router.post('/getFancyUser', getFancyUser);
router.get('/getIndianFancy', getIndianFancy);
router.get('/getOnlineFancy', getOnlineFancy);
router.get('/getFancyById', getFancyById);
router.post('/updateFancyById', updateFancyById);
router.post('/updateFancyData', updateFancyData);
router.post('/matchResultFancy', matchResultFancy);
router.post('/abandonedFancy', abandonedFancy);
router.post('/fancyRollback', fancyRollback);
router.post('/fancy/setFancyRiskManagement', setFancyRiskManagement);
router.post('/fancy/createFancyBySuperAdmin', createFancyBySuperAdmin);
router.post('/fancy/setResultFancyBySuperAdmin', setResultFancyBySuperAdmin);
router.post('/fancy/abandonedFancyBySuperAdmin', abandonedFancyBySuperAdmin);
router.post('/fancy/updateFancyStatusBySuperAdmin', updateFancyStatusBySuperAdmin);
router.post('/fancy/updateFancyMessageBySuperAdmin', updateFancyMessageBySuperAdmin);
router.post('/fancy/updateDeactiveFancyStatus', updateDeactiveFancyStatus);
router.post('/fancy/createManualFancy', createManualFancy);
router.post('/fancy/updateFancyOdds', updateFancyOdds);
router.post('/fancy/getFancyDetail', getFancyDetail);
router.post('/fancy/changeFancyMode', changeFancyMode);
router.post('/fancy/updateRatePointDiff', updateRatePointDiff);

module.exports = router;
