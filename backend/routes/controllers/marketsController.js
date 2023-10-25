const express = require('express');
const router = express.Router();
const Joi = require('joi');
const axios = require('axios');
const settings = require('../../config/settings');
const marketsService = require('../services/marketsService');
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

async function createMarket(req, res) {
	let {
		sport_id,
		series_id,
		match_id,
		market_id,
		name,
		is_manual
	} = req.body;

	const createMarketSchema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		sport_id: Joi.string().required(),
		series_id: Joi.string().required(),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),
		name: Joi.string().required(),
		is_manual: Joi.string().valid('0', '1'),
	});
	try {
		await createMarketSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let onlineMarketRes = await axios.get(settings.ONLINE_SELECTIONID_URL + market_id);
	let onlineMarketList = onlineMarketRes.data[0];
	let arraydata = [];
	let backdefault = [{
		'size': '--',
		'price': '--'
	},
	{
		'size': '--',
		'price': '--'
	},
	{
		'size': '--',
		'price': '--'
	}
	];
	let layDefault = [{
		'size': '--',
		'price': '--'
	},
	{
		'size': '--',
		'price': '--'
	},
	{
		'size': '--',
		'price': '--'
	}
	];
	let mapsdata = onlineMarketList && onlineMarketList.runners && onlineMarketList.runners.length > 0 ? onlineMarketList.runners.map((element) => {
		let selectionId = element.selectionId;
		let name = element.runnerName;
		let sort_priority = element.sortPriority;
		let liability_type = (element.liabilityType) ? element.liabilityType : '0';
		arraydata.push([match_id,market_id, selectionId, name, sort_priority,liability_type]);
		return {
			selectionId,
			name,
			back: backdefault,
			lay: layDefault
		};
	}) : [];

	if (arraydata.length > 0) {
		let reqdaa = {
			sport_id,
			series_id,
			match_id,
			market_id,
			name,
			is_manual,
			create_at: globalFunction.currentDate(),
			update_at: globalFunction.currentDate(),
			runner_json: JSON.stringify(mapsdata)
		};
		let datafromService = await marketsService.createMarket(reqdaa);
		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			await marketsService.createMarketSelections(arraydata);
			return apiSuccessRes(req, res, 'Market created successfully');
		} else {
			return apiSuccessRes(req, res, 'Error to create Market !');
		}
	} else {
		return apiSuccessRes(req, res, 'Selection not found for this market id !');
	}
}

async function autoCreateMarket(req, res) {

	let dataObject=  req.body;
    let datafromService = await marketsService.createMarket(dataObject);
    if (datafromService.statusCode === CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Market create successfully');
    } else {
        return apiSuccessRes(req, res, 'Error to create Market.');
    }

}


async function getAllMarket(req, res) {
	let {
		limit,
		pageno,
		marketName,
		matchName,
		seriesName
	} = req.body;

	const profilechema = Joi.object({
		userid: Joi.number().required(),
		pageno: Joi.optional().required(),
		limit: Joi.optional().required(),
		parent_ids: Joi.optional().required(),
		marketName: Joi.optional().required(),
		matchName: Joi.optional().required(),
		seriesName: Joi.optional().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("market_setting_sub_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let data={
		limit,
		pageno,
		marketName,
		matchName,
		seriesName
	};
	
	let getUserDetailsFromDB = await marketsService.getAllMarket(data);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {

		return apiSuccessRes(req, res, 'success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to profile.');
	}
}
async function updateMarketStatus(req, res) {

	let {
		id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		id: Joi.number().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("market_setting")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let getUserDetailsFromDB = await marketsService.updateMarketStatus(id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Updated successfully.');

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateMarketStatus.');
	}
}


async function updateMarketCardsData(req, res) {

    let {
        id,
		cards
    } = req.body;

    let getUserDetailsFromDB = await marketsService.updateMarketCardsData(cards,id);
    if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Updated successfully.');

    } else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
        return apiSuccessRes(req, res, 'not found.');
    } else {
        return apiSuccessRes(req, res, 'Error to updateMarketStatus.');
    }
}

async function getOnlineMarket(req, res) {

	let {
		match_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		match_id: Joi.string().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("betfair_market")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let onlineMarketRes = await axios.get(settings.ONLINE_MARKET_URL + match_id);
	let onlineMarketList = onlineMarketRes.data;
	let listOfId = [];
	let mapsdata = onlineMarketList.map((element) => {
		listOfId.push(element.marketId);
		return {
			market_id: element.marketId,
			name: element.marketName,
			match_id: match_id
		};
	});

	let getUserDetailsFromDB = await marketsService.getMarketByListOfID(listOfId);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		let marketListFromDB = getUserDetailsFromDB.data;
		marketListFromDB = JSON.parse(JSON.stringify(marketListFromDB));
		if (marketListFromDB.length > 0) {
			let notAvailableIDInDB = mapsdata.length > 0 ? mapsdata.filter(o => !marketListFromDB.find(o2 => o.market_id === o2.market_id)).map((element) => {
				return {
					...element,
					is_active: '0'
				};
			}) : [];
			let availableIDInDB = mapsdata.length > 0 ? mapsdata.filter(o => marketListFromDB.find(o2 => o.market_id === o2.market_id)).map((element) => {
				return {
					...element,
					is_active: '1'
				};
			}) : [];
			let sendId = [...availableIDInDB, ...notAvailableIDInDB];
			return apiSuccessRes(req, res, 'success', sendId);
		} else {
			let notAvailableIDInDB = mapsdata.map((element) => {
				return {
					...element,
					is_active: '0'
				};
			});
			return apiSuccessRes(req, res, 'success', notAvailableIDInDB);
		}

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to get series.');
	}

}
async function updateMarket(req, res) {

	let {
		id,
		max_bet_liability,
		max_market_liability,
		max_market_profit
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		id: Joi.optional().required(),
		max_bet_liability: Joi.number().required(),
		max_market_liability: Joi.number().required(),
		max_market_profit: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("market_setting")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let reqData = {
		max_bet_liability,
		max_market_liability,
		max_market_profit
	};
	let getUserDetailsFromDB = await marketsService.updateMarket(reqData, id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Updated Successfully');

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateMarketStatus.');
	}
}
async function getMarketSettingById(req, res) {

	let {
		id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserDetailsFromDB = await marketsService.getMarketSettingById(id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateMarketStatus.');
	}
}

async function undeclearedMarkets(req, res) {

	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("match_result_sub_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let matchesFromDB = await marketsService.undeclearedMarkets();
	if (matchesFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',matchesFromDB.data);

	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

async function getMarketSelections(req, res) {

	let {marketId} = req.query;

	const createFancySchema = Joi.object({
		marketId: Joi.optional().required()
	});

	let selectionsFromDB = await marketsService.getMarketSelections(marketId);
	if (selectionsFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',selectionsFromDB.data);
	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

async function declearedMarkets(req, res) {
    try {
		let {
			sport_id,
			limit,
			matchName,
			marketName,
			marketId,
			pageno,
		} = req.body;
		const profilechema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			pageno: Joi.optional().required(),
			limit: Joi.optional().required(),
			matchName: Joi.optional(),
			marketName: Joi.optional(),
			marketId: Joi.optional(),
			sport_id: Joi.optional()
		});
		try {
			await profilechema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

        let matchesFromDB = await marketsService.declearedMarkets(sport_id,{limit,pageno,matchName,marketName,marketId});
        if (matchesFromDB.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Success', matchesFromDB.data);
        } else {
            return apiErrorRes(req, res, 'Data not found !');
        }

    } catch (e) {
		logger.errorlog.error("declearedMarkets",e);
		return apiErrorRes(req, res, 'An error occurred !');
    }
}



let marketRollback = async (req, res) => {
	let {
		bet_result_id,
		match_id,
		market_id
	} = req.body;
	const resultSchema = Joi.object({

		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		bet_result_id: Joi.required(''),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),

	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let oddsRollbackData = await marketsService.getRollbackOdds(bet_result_id, match_id, market_id);

	if (oddsRollbackData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, oddsRollbackData.data[0].retMess, oddsRollbackData.data[0].resultV);
	} else {
		return apiSuccessRes(req, res, 'Error to  rollback');
	}




};

let addMarketFavourite = async (req, res) => {
	let {
		market_id,
		userid
	} = req.body;
	const resultSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		market_id: Joi.string().required(),

	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let favourite = await marketsService.addMarketFavourite(userid,  market_id);

	if (favourite.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Added Successfully');
	} else {
		return apiSuccessRes(req, res, 'Error to  add favourite');
	}




};

let getAllFavouriteMarket = async (req, res) => {
	let {
		userid,
		parent_ids
	} = req.body;
	const resultSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required()

	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let favourite = await marketsService.getAllFavouriteMarket(parent_ids,userid);

	if (favourite.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',favourite.data);
	} else {
		return apiSuccessRes(req, res, 'Error to  add favourite');
	}




};

async function getMarketSession(req, res) {
	let selectionsFromDB = await marketsService.getMarketSession();
	if (selectionsFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',selectionsFromDB.data);
	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

let abandonedMarket = async (req, res) => {
	let {
		match_id,
		market_id,
		is_rollback
	} = req.body;

	const resultSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),
		is_rollback: Joi.number().required()
	});
	try {
		await resultSchema.validate(req.body, {
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
		}else if(loginUserData.sub_admin_roles.indexOf("auto_result_declare")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}
	let getUserByUserId = await userService.getUserByUserId(req.body.userid);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		if (getUserByUserId.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
			let oddsResultData = await marketsService.abandonedMarket(match_id, market_id, is_rollback);
			if (oddsResultData.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, oddsResultData.data[0].retMess, oddsResultData.data[0].resultV);
			} else {
				return apiSuccessRes(req, res, 'Error to abandoned !');
			}
		} else {
			return apiErrorRes(req, res, 'Invalid Access !');
		}
	} else {
		return apiSuccessRes(req, res, 'Invalid Access !');
	}
};


async function updateMarketVisibility(req, res) {
	let {
		match_id,
		market_id,
		is_visible
	} = req.body;

	const createMarketSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),
		is_visible: Joi.string().valid('0', '1').required()
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

	if(user_type_id === CONSTANTS.USER_TYPE_ADMIN){
		let result = await marketsService.updateMarketVisibility(match_id, market_id, is_visible);
		if (result.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Market visibility status updated');
		}else{
			return apiErrorRes(req, res, 'Failed to update market visibility !');
		}
	}else{
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}

}

async function createMarketBySuperAdmin(req, res) {
	let {
		sport_id,
		series_id,
		match_id,
		market_id,
		liabilityType,
		name
	} = req.body;

	const createMarketSchema = Joi.object({
		liabilityType: Joi.string().required(),
		sport_id: Joi.string().required(),
		series_id: Joi.string().required(),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),
		name: Joi.string().required()
	});
	try {
		await createMarketSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let checkMatchIsAdded = await matchesService.getMatchSettingById(match_id);
	if(checkMatchIsAdded.data) {

		let checkMarketIsAdded = await marketsService.getMarketByListOfID(market_id);

		if(checkMarketIsAdded.data.length > 0) {
			return apiErrorRes(req, res, 'Market already added !');
		}else {
			let onlineMarketRes = await axios.get(settings.ONLINE_SELECTIONID_URL + market_id);
			let onlineMarketList = onlineMarketRes.data[0];
			let arraydata = [];
			let backdefault = [
				{
					'size': '--',
					'price': '--'
				},
				{
					'size': '--',
					'price': '--'
				},
				{
					'size': '--',
					'price': '--'
				}
			];
			let layDefault = [
				{
					'size': '--',
					'price': '--'
				},
				{
					'size': '--',
					'price': '--'
				},
				{
					'size': '--',
					'price': '--'
				}
			];
			let mapsdata = onlineMarketList && onlineMarketList.runners && onlineMarketList.runners.length > 0 ? onlineMarketList.runners.map((element) => {
				let selectionId = element.selectionId;
				let name = element.runnerName;
				let sort_priority = element.sortPriority;
				let liability_type = liabilityType;
				arraydata.push([match_id, market_id, selectionId, name, sort_priority,liability_type]);
				return {
					selectionId,
					name,
					back: backdefault,
					lay: layDefault
				};
			}) : [];

			if (arraydata.length > 0) {
				let reqdaa = {
					sport_id,
					series_id,
					match_id,
					market_id,
					name,
					is_manual: '0',
					create_at: globalFunction.currentDate(),
					update_at: globalFunction.currentDate(),
					runner_json: JSON.stringify(mapsdata)
				};
				let datafromService = await marketsService.createMarket(reqdaa);
				if (datafromService.statusCode === CONSTANTS.SUCCESS) {
					await marketsService.createMarketSelections(arraydata);
					return apiSuccessRes(req, res, 'Market created successfully');
				} else {
					return apiErrorRes(req, res, 'Error to create market !');
				}
			} else {
				return apiErrorRes(req, res, 'Selection not found for this market id !');
			}
		}
	}else{
		return apiErrorRes(req, res, 'Match not added !');
	}
}

async function abandonedMarketBySuperAdmin(req, res) {
	let {
		match_id,
		market_id
	} = req.body;

	const resultSchema = Joi.object({
		match_id: Joi.string().required(),
		market_id: Joi.string().required()
	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}

	let oddsResultData = await marketsService.abandonedMarket(match_id, market_id, 0);
	if (oddsResultData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, oddsResultData.data[0].retMess, oddsResultData.data[0].resultV);
	} else {
		return apiSuccessRes(req, res, 'Error to abandoned !');
	}

}


async function createBookMakerMarket(req, res) {
	let {
		match_id,
		market_id,
		market_name
	} = req.body;
	const createMarketSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),
		market_name: Joi.string().required()
	});
	try {
		await createMarketSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	// subadmin permission work
	if (loginUserData.hasOwnProperty('sub_admin_roles')) {
		if (loginUserData.sub_admin_roles.length == 0) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		} else if (loginUserData.sub_admin_roles.indexOf("book_maker") == -1) 	{
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}

	let user_type_id = loginUserData.user_type_id;

	if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

		let result = await marketsService.createBookMakerMarket({match_id, market_id, market_name});
		if(result.statusCode === CONSTANTS.SUCCESS){
			return apiSuccessRes(req, res, 'Bookmaker market created successfully');
		} else {
			return apiErrorRes(req, res, result.data);
		}

	}else{
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}

}

async function saveManualOdds(req, res) {

	try {
		let {
			market_id,
			runner_json
		} = req.body;

		const profilechema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			market_id: Joi.string().required(),
			runner_json: Joi.string().required()
		});

		try {
			await profilechema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let loginUserData = userModel.getUserData();
		// subadmin permission work
		if (loginUserData.hasOwnProperty('sub_admin_roles')) {
			if (loginUserData.sub_admin_roles.length == 0) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			} else if (loginUserData.sub_admin_roles.indexOf("book_maker") == -1) 	{
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

			let all_runners = JSON.parse(runner_json);

			let odds_id = 'ODDS_' + market_id;
			let odds = await redis_client.localClient.get(odds_id);

			if (odds == null) {
				odds = await redis_client.client.get(odds_id);
			}

			if (odds == null) {
				return apiErrorRes(req, res, 'Market not available !');
			}

			let odds_data = JSON.parse(odds);

			await all_runners.forEach(async (element, index) => {
				let findRunner = odds_data.runners.findIndex((ele) => ele.selectionId == element.selectionId);
				if (findRunner >= 0) {
					odds_data.runners[findRunner].ex.availableToBack[0].price = parseFloat(parseFloat(element.back[0].price).toFixed(2));
					odds_data.runners[findRunner].ex.availableToLay[0].price = parseFloat(parseFloat(element.lay[0].price).toFixed(2));
					odds_data.runners[findRunner].status = element.status;
				}
			});

			let final_odds_data = JSON.stringify(odds_data);

			await redis_client.localClient.set(odds_id, final_odds_data);
			return apiSuccessRes(req, res, 'Success');
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}

	} catch (error) {
		logger.errorlog.error("saveManualOdds",error);
		return apiErrorRes(req, res, error.details[0].message);
	}

}

async function changeMarketOddsMode(req, res) {

	try {

		let {
			match_id,
			market_id,
			is_manual_odds
		} = req.body;
		const createMarketSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			match_id: Joi.string().required(),
			market_id: Joi.string().required(),
			is_manual_odds: Joi.string().required()
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
			let result = await marketsService.changeMarketOddsMode({match_id, market_id, is_manual_odds});
			if (result.statusCode === CONSTANTS.SUCCESS) {

				if (is_manual_odds == '1') {
					let odds_id = 'ODDS_' + market_id;
					let odds = await redis_client.client.get(odds_id);

					if (odds != null) {
						await redis_client.localClient.set(odds_id, odds);
					}
				}

				return apiSuccessRes(req, res, 'Market odds mode updated');
			} else {
				return apiErrorRes(req, res, 'Error to update !');
			}
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}

	} catch (error) {
		logger.errorlog.error("changeMarketOddsMode",error);
		return apiErrorRes(req, res, error.details[0].message);
	}

}


async function getMarketByMatch(req, res) {
	let {match_id} = req.body;

	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let result = await marketsService.getMarketByMatch(match_id);
	if (result.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', result.data);
	} else {
		return apiErrorRes(req, res, 'Error to profile.');
	}
}

async function deleteMarketNoHaveProfitLoss(req, res) {


	let result = await marketsService.deleteMarketNoHaveProfitLoss();
	if (result.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success '+result.data+' deleted markets');
	} else {
		return apiErrorRes(req, res, 'Error to profile.');
	}
}

async function updateManualOddsStatus(req, res) {
	try {
		let {
			market_id,
			status
		} = req.body;

		const profilechema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			market_id: Joi.string().required(),
			status: Joi.string().required()
		});

		try {
			await profilechema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let loginUserData = userModel.getUserData();
		// subadmin permission work
		if (loginUserData.hasOwnProperty('sub_admin_roles')) {
			if (loginUserData.sub_admin_roles.length == 0) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			} else if (loginUserData.sub_admin_roles.indexOf("book_maker") == -1) 	{
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

			let odds_id = 'ODDS_' + market_id;
			let odds = await redis_client.localClient.get(odds_id);

			if (odds == null) {
				odds = await redis_client.client.get(odds_id);
			}

			if (odds == null) {
				return apiErrorRes(req, res, 'Market not available !');
			}

			let odds_data = JSON.parse(odds);
			odds_data.status = status;
			let final_odds_data = JSON.stringify(odds_data);
			await redis_client.localClient.set(odds_id, final_odds_data);
			return apiSuccessRes(req, res, 'Success');
		}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}
	} catch (error) {
		logger.errorlog.error("updateManualOddsStatus",error);
		return apiErrorRes(req, res, error.details[0].message);
	}
}

let updateMarketId = async function (req, res) {
	console.log('sdgdgsdgsd');
	let {match_id, old_market_id, new_market_id}=req.body;

	const matchschema = Joi.object({
		match_id: Joi.required(),
		old_market_id: Joi.required(),
		new_market_id: Joi.required()
	});
	try {
		await matchschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getMatchUserData = await marketsService.updateMarketId(match_id, old_market_id, new_market_id);
	if (getMatchUserData.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getMatchUserData.data);
	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

router.post('/updateMarket', updateMarket);
router.post('/updateMarketStatus', updateMarketStatus);
router.post('/updateMarketCardsData', updateMarketCardsData);
router.post('/createMarket', createMarket);
router.post('/autoCreateMarket', autoCreateMarket);
router.post('/getAllMarket', getAllMarket);
router.post('/getOnlineMarket', getOnlineMarket);
router.post('/getMarketSettingById', getMarketSettingById);
router.get('/undeclearedMarkets', undeclearedMarkets);
router.get('/getMarketSelections', getMarketSelections);
router.post('/declearedMarkets', declearedMarkets);
router.post('/marketRollback', marketRollback);
router.post('/addMarketFavourite', addMarketFavourite);
router.get('/getAllFavouriteMarket', getAllFavouriteMarket);
router.get('/getMarketSession', getMarketSession);
router.post('/market/abandonedMarket', abandonedMarket);
router.post('/market/updateMarketVisibility', updateMarketVisibility);
router.post('/market/createMarketBySuperAdmin', createMarketBySuperAdmin);
router.post('/market/abandonedMarketBySuperAdmin', abandonedMarketBySuperAdmin);
router.post('/market/createBookMakerMarket', createBookMakerMarket);
router.post('/market/saveManualOdds', saveManualOdds);
router.post('/market/changeMarketOddsMode', changeMarketOddsMode);
router.post('/market/getMarketByMatch', getMarketByMatch);
router.get('/market/deleteMarketNoHaveProfitLoss', deleteMarketNoHaveProfitLoss);
router.post('/market/updateManualOddsStatus', updateManualOddsStatus);
router.post('/market/updateMarketId', updateMarketId);
module.exports = router;
