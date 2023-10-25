const express = require('express');
const router = express.Router();
const Joi = require('joi');
const axios = require('axios');
const settings = require('../../config/settings');
const matchesService = require('../services/matchesService');
const marketsService = require('../services/marketsService');
const seriesService = require('../services/seriesService');

const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const userModel = require('../../routes/model/userModel');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;

const userService = require('../services/userService');
const sportsService = require('../services/sportsService');
const pdcService = require('../services/pdcService');

async function createMatches(req, res) {
	let {
		sport_id,
		series_id,
		match_id,
		name,
		is_manual,
		userid,
		match_date,
        selections,
		liability_type
	} = req.body;

	const createMatcheschema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		sport_id: Joi.string().required(),
		series_id: Joi.string().required(),
		match_id: Joi.string().optional(),
		match_date: Joi.string().required(),
		is_manual: Joi.string().optional(),
        name: Joi.string().required(),
        selections: Joi.optional(),
		liability_type: Joi.optional()
	});
	try {
		await createMatcheschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let reqdaa = {};
	if (is_manual === '0') {
		reqdaa = {
			sport_id,
			series_id,
			match_id,
			match_date,
			start_date:match_date,
			name,
			is_manual: '0',
			liability_type,
			create_at: globalFunction.currentDate(),
			update_at: globalFunction.currentDate()
		};
	} else if (is_manual === '1') {
		let randomNumber = globalFunction.randomIntFromInterval(CONSTANTS.MANUAL_MATCH_MIN_RANGE, CONSTANTS.MANUAL_MATCH_MAX_RANGE);
		let matchId = CONSTANTS.MANUAL_MATCH + randomNumber;
		reqdaa = {
			sport_id,
			series_id,
			match_date,
			start_date:match_date,
			match_id: matchId,
			name,
			is_manual: '0',
			create_at: globalFunction.currentDate(),
			update_at: globalFunction.currentDate()
		};
	} else {
		return apiSuccessRes(req, res, 'Send valid manual type.');
	}



	let datafromService;
	let message='Match Added Successfully';
	if(is_manual==0){
		let checkSeriedIsAdded = await matchesService.getMatchSettingById(match_id);
		if(checkSeriedIsAdded.data ){
			datafromService = await matchesService.updateOnlineMatchStatus(match_id);
			message='Match Updated Successfully';
		}else {
			datafromService = await matchesService.createMatches(reqdaa);
            if((selections)){
            	let arraydata =[];

				JSON.parse(selections).map((element) => {
					let selectionId = element.selectionId;
					let name = element.runnerName;
					let sort_priority = element.sortPriority;
					let liability_type = (element.liabilityType) ? element.liabilityType : '0';
					arraydata.push([match_id, null, selectionId, name, sort_priority, liability_type]);
				});
				await marketsService.createMarketSelections(arraydata);

            }
		}

	}else {

		datafromService = await matchesService.createMatches(reqdaa);

	}

	if (datafromService.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, message);
	} else {
		return apiSuccessRes(req, res, 'Error to create Match.');
	}
}
async function getAllMatches(req, res) {

	let {
		sport_id,status,match_name,limit,pageno,series_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		sport_id: Joi.optional().required(),
		status: Joi.optional().required(),
		match_name: Joi.optional().required(),
		series_id: Joi.optional(),
		limit: Joi.optional().required(),
		pageno: Joi.optional().required(),
	});
	let data={
		sport_id,status,match_name,limit,pageno,series_id
	};
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserDetailsFromDB = await matchesService.getAllMatches(data);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to profile.');
	}
}
async function getActiveMatchesBySportId(req, res) {

	let {
		sport_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		sport_id: Joi.string().required()
	});
	let data={
		sport_id
	};
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	// subadmin permission work
	let loginUserData = userModel.getUserData();
	if (loginUserData.hasOwnProperty('sub_admin_roles')) {
		if (loginUserData.sub_admin_roles.length == 0) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		} else if (loginUserData.sub_admin_roles.indexOf("active_matches") == -1) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}


	//let getActiveMatchesBySportIdFromDB = await matchesService.getActiveMatchesBySportId(data);
	try {
		let getActiveMatchesBySportIdFromDB = await axios.get(settings.GET_ALL_ACTIVE_MATCH_BY_SPORT_ID + sport_id);
		return apiSuccessRes(req, res, 'success', getActiveMatchesBySportIdFromDB.data);
	} catch (e) {
		return apiSuccessRes(req, res, 'not found.');
	}


}
async function updateMatchStatus(req, res) {

	let {
		id,userid
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		id: Joi.required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserDetailsFromDB = await matchesService.updateMatchStatus(id,userid);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, CONSTANTS_MESSAGE.UPDATED_SUCCESS_MESSAGE);
	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateMatchStatus.');
	}
}
async function getOnlineMatch(req, res) {

	let {
		sport_id,
		series_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		series_id: Joi.string().required(),
		sport_id: Joi.string().required(),
        selections: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let onlineSeriesRes = await axios.get(settings.ONLINE_MATCH_URL + sport_id + '&CompetitionID=' + series_id);
	let onlineSeriesList = onlineSeriesRes.data;
	let listOfId = [0];
	let mapsdata = onlineSeriesList.map((element) => {
		listOfId.push(element.event.id);
		return {
			match_id: element.event.id,
			name: element.event.name,
			selections: element.selections,
			liability_type: element.liability_type,
			match_date: element.event.openDate,
			undeclared_markets: element.undeclared_markets
		};
	});

	let getUserDetailsFromDB = await matchesService.getActiveMatchesByListOfID(listOfId);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		let matchesListFromDB = getUserDetailsFromDB.data;
		matchesListFromDB = JSON.parse(JSON.stringify(matchesListFromDB));
		if (matchesListFromDB.length > 0) {
			let notAvailableIDInDB = mapsdata.length > 0 ? mapsdata.filter(o => !matchesListFromDB.find(o2 => o.match_id === o2.match_id)).map((element) => {
				return {
					...element,
					is_active: '0',
					sport_id: sport_id,
					series_id: series_id
				};
			}) : [];
			let availableIDInDB = mapsdata.length > 0 ? mapsdata.filter(o => matchesListFromDB.find(o2 => o.match_id === o2.match_id)).map((element) => {
				return {
					...element,
					is_active: '1',
					sport_id: sport_id,
					series_id: series_id
				};
			}) : [];
			let sendId = [...availableIDInDB, ...notAvailableIDInDB];
			return apiSuccessRes(req, res, 'success11', sendId);
		} else {
			let notAvailableIDInDB = mapsdata.map((element) => {
				return {
					...element,
					is_active: '0',
					sport_id: sport_id,
					series_id: series_id
				};
			});
			return apiSuccessRes(req, res, 'success11', notAvailableIDInDB);
		}

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to get series.');
	}

}
async function updateMatch(req, res) {

	let {
		id,
		odd_limit,
		volume_limit,
		min_stack,
		max_stack,
        score_key,
        score_type
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		id: Joi.number().required(),
		odd_limit: Joi.number().required(),
		volume_limit: Joi.number().required(),
		min_stack: Joi.number().required(),
		max_stack: Joi.number().required(),
        score_key: Joi.optional().required(),
        score_type: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let reqData = {
		odd_limit,
		volume_limit,
		min_stack,
		max_stack,
        score_type,
        score_key
	};
	let getUserDetailsFromDB = await matchesService.updateMatch(reqData, id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Updated Successfully');

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateMarketStatus.');
	}
}

async function marketWatch(req, res) {
	try {
		let {
			parent_ids
		} = req.body;
		let {
			sport_id
		} = req.query;
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			sport_id: Joi.optional()
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
			}else if(loginUserData.sub_admin_roles.indexOf("market_watch_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let fancyList = await matchesService.getMatch(parent_ids, sport_id);
		if (fancyList.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'market match get successfully', fancyList.data);
		} else {
			return apiSuccessRes(req, res, 'Error to get marketWatch.');
		}
	} catch (e) {
	}
}
async function getMatchSettingById(req, res) {

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
		return apiErrorRes(req, res, 'Enter valid param!');
	}
	let getUserDetailsFromDB = await matchesService.getMatchSettingById(id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to updateMarketStatus.');
	}
}

async function homeMatches(req, res) {

	let {sport_id,series_id,userid}=req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		sport_id: Joi.number(),
		series_id: Joi.number()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}


	let parents =req.body.parent_ids;

	let getUserDetailsFromDB = await matchesService.getMatchForUserPanelBySportId(parents,sport_id,series_id,userid);
	if (getUserDetailsFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getUserDetailsFromDB.data);

	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

async function homeInplayMatches(req, res) {

	let {userid}=req.body;
	const profilechema = Joi.object({
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


	let parents =req.body.parent_ids;

	let getUserDetailsFromDB = await matchesService.getMatchForUserPanel(parents,userid);
	//console.log(getUserDetailsFromDB);
	if (getUserDetailsFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getUserDetailsFromDB.data);

	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

async function matchDetails(req, res) {



	let {match_id, user_id, user_type_id, userid, parent_ids, is_show_100_percent} = req.body;

	const profilechema = Joi.object({
		userid: Joi.number().required(),
		user_id: Joi.optional(),
		user_type_id: Joi.optional(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.required(),
		is_show_100_percent: Joi.optional()
	});

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	let cur_user_type_id = loginUserData.user_type_id;

	let getUserDetailsFromDB = await matchesService.matchDetails(user_id, user_type_id, parent_ids, match_id, is_show_100_percent);

	if (getUserDetailsFromDB.statusCode===CONSTANTS.SUCCESS) {
		if(cur_user_type_id == CONSTANTS.USER_TYPE_USER){

			let is_pdc_charge = CONSTANTS.IS_PDC_CHARGE;
			let is_pdc_distribute = CONSTANTS.IS_PDC_DISTRIBUTE;
			let is_pdc_charge_on_first_bet = CONSTANTS.IS_PDC_CHARGE_ON_FIRST_BET;
			if(is_pdc_charge == 1 && is_pdc_charge_on_first_bet == 0) {
				if(getUserDetailsFromDB.data.match.length > 0) {
					let sport_id = getUserDetailsFromDB.data.match[0].sport_id;
					let sportSetting = await sportsService.getSportSetting(sport_id);
					if (sportSetting.data.is_pdc_charge == '1') {

						let marketData = getUserDetailsFromDB.data.match.filter(d => (d.market_name === 'Match Odds' || d.market_name === 'Winner' || d.match_id == '-154' || d.match_id == '-156' || d.match_id == '-1001' || d.match_id == '-1002' || d.match_id == '-1003' || d.match_id == '-1004' || d.match_id == '-1005')).map((element) => {
							return element;
						});

						if (marketData.length > 0) {
							marketData = marketData[0];

							//checking if PDC charge has already been deducted or not
							let pdc_deducted = await pdcService.verifyPdcChargeMatchEntry(userid, match_id, marketData.market_id, sport_id);

							if (pdc_deducted.statusCode === CONSTANTS.SUCCESS && (pdc_deducted.data.length == 0 || pdc_deducted.data[0].is_pdc_charged == '0')) {
								//fetching user balance details
								let getUserByUserId = await userService.getUserByUserId(userid);
								if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
									let user_balance = getUserByUserId.data.balance;

									let pdc_charge = 0;
									if (is_pdc_distribute == 0) {
										pdc_charge = sportSetting.data.pdc_charge;
									}

									let parent_idsArray = parent_ids.split(',');
									let agent_id = parent_idsArray[0];
									let super_agent_id = parent_idsArray[1];
									let master_id = parent_idsArray[2];
									let admin_id = parent_idsArray[3];

									let pdc_data = {
										user_id: userid,
										agent_id: agent_id,
										super_agent_id: super_agent_id,
										master_id: master_id,
										admin_id: admin_id,
										sport_id: sport_id,
										match_id: match_id,
										marketData: marketData,
										pdc_charge: pdc_charge,
										user_balance: user_balance,
										existingPDCData: pdc_deducted.data
									};
									let return_val = await pdcService.deductPDC(pdc_data);
									if (return_val.statusCode != CONSTANTS.SUCCESS) {
										return apiErrorRes(req, res, return_val.data);
									}

								} else {
									return apiErrorRes(req, res, 'Invalid Access !');
								}
							} else if (pdc_deducted.statusCode === CONSTANTS.SERVER_ERROR) {
								return apiErrorRes(req, res, 'An error occurred !');
							}
						}else {
							return apiErrorRes(req, res, 'Market not available !');
						}
					}
				}else{
					return apiErrorRes(req, res, 'Market not available !');
				}
			}
		}
		return apiSuccessRes(req, res, 'Success', getUserDetailsFromDB.data);
	}
	else {
		return apiErrorRes(req, res, 'Match not available !');
	}
}

let getMatchUser = async function (req, res) {

	let {match_id,parent_id,parent_type}=req.body;
	const matchschema = Joi.object({
		userid: Joi.number().required(),
		match_id: Joi.optional(),
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
	let getMatchUserData = await matchesService.getMatchUser(match_id,parent_id,parent_type);
	if (getMatchUserData.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getMatchUserData.data);

	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
};

let getLiveSportMatchList = async function (req, res) {

	let getMatchUserData = await matchesService.getLiveSportMatchList();
	if (getMatchUserData.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getMatchUserData.data);
	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

let updateMatchId = async function (req, res) {
	let {old_match_id,new_match_id}=req.body;

	const matchschema = Joi.object({
		old_match_id: Joi.required(),
		new_match_id: Joi.required()
	});
	try {
		await matchschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getMatchUserData = await matchesService.updateMatchId(old_match_id,new_match_id);
	if (getMatchUserData.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getMatchUserData.data);
	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

let getMatchAndMarketPosition = async function (req, res) {

    let {userid,user_type_id}=req.body;

    let {match_id}=req.params;
    const matchschema = Joi.object({
        userid: Joi.number().required(),
        match_id: Joi.optional(),
        parent_ids: Joi.optional().required()
    });
    try {
        await matchschema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }
    let loginUserData = userModel.getUserData();
    user_type_id = loginUserData.user_type_id;

    let getMatchUserData = await matchesService.getMatchAndMarketPosition(userid,match_id,user_type_id);
    if (getMatchUserData.statusCode===CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Success',getMatchUserData.data);

    } else {
        return apiSuccessRes(req, res, 'not found.');
    }
};

async function searchMatches(req, res) {

	let {search} = req.query;

	const createFancySchema = Joi.object({
		search: Joi.optional().required()
	});

	let matchesFromDB = await matchesService.searchMatches(search);
	if (matchesFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',matchesFromDB.data);

	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

async function matchlist(req, res) {
	
	try{
	    const response = await axios.get('http://167.99.198.2/api/matches/list');
	//    console.log(response.data);
	    return apiSuccessRes(req, res, 'Success',response.data.data);
	} catch(axiosErr){
		return apiErrorRes(req, res, axiosErr);
	}

}

async function topEvents(req, res) {

	//let {sport_id,series_id}=req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		// sport_id: Joi.number(),
		// series_id: Joi.number()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}


	let parents =req.body.parent_ids;

	let getUserDetailsFromDB = await matchesService.getInPlayMatchForUserPanelBySportId(parents,0,0, 1);
	if (getUserDetailsFromDB.statusCode===CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success',getUserDetailsFromDB.data);

	} else {
		return apiSuccessRes(req, res, 'not found.');
	}
}

async function createMatchBySuperAdmin(req, res) {
	let {
		sport_id,
		series_id,
		match_id,
		name,
		match_date
	} = req.body;

	const createMatcheschema = Joi.object({
		sport_id: Joi.string().required(),
		series_id: Joi.string().required(),
		match_id: Joi.string().optional(),
		match_date: Joi.string().required(),
		name: Joi.string().required()
	});
	try {
		await createMatcheschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let reqdaa = {
		sport_id,
		series_id,
		match_id,
		match_date,
		start_date: match_date,
		name,
		is_manual: '0',
		create_at: globalFunction.currentDate(),
		update_at: globalFunction.currentDate()
	};

	let checkSeriesIsAdded = await seriesService.getSeriesByListOfID(series_id);
	if(checkSeriesIsAdded.data.length > 0){
		let checkMatchIsAdded = await matchesService.getMatchSettingById(match_id);
		if(checkMatchIsAdded.data ){
			return apiErrorRes(req, res, 'Match already added !');
		}else {
			let datafromService = await matchesService.createMatches(reqdaa);
			if (datafromService.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Match added successfully');
			} else {
				return apiErrorRes(req, res, 'Error to create Match !');
			}
		}
	}else {
		return apiErrorRes(req, res, 'Series not added !');
	}
}


async function getManualOddsMarketByMatch(req, res) {

	let {match_id} = req.body;

	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.required()
	});

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	if(user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

		let result = await matchesService.getManualOddsMarketByMatch(match_id);

		if (result.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Success', result.data);
		} else {
			return apiErrorRes(req, res, 'Match/Market not available !');
		}
	}else{
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}
}
async function updateLiveSportTvUrlBySuperAdmin(req, res) {
	let {
		series_id,
		match_id,
		live_sport_tv_url
	} = req.body;

	const createMatcheschema = Joi.object({
		series_id: Joi.string().required(),
		match_id: Joi.string().required(),
		live_sport_tv_url: Joi.optional()
	});
	try {
		await createMatcheschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let reqdaa = {
		series_id,
		match_id,
		live_sport_tv_url
	};

	let returnData = await matchesService.updateLiveSportTvUrlBySuperAdmin(reqdaa);
	if (returnData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Live sport tv url updated successfully');
	} else {
		return apiErrorRes(req, res, 'Error to updated live sport tv url !');
	}
}

async function updateMatchCupStatusBySuperAdmin(req, res) {
	let {
		series_id,
		match_id,
		is_cup
	} = req.body;

	const createMatcheschema = Joi.object({
		series_id: Joi.string().required(),
		match_id: Joi.string().required(),
		is_cup: Joi.string().required()
	});
	try {
		await createMatcheschema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let reqdaa = {
		series_id,
		match_id,
		is_cup
	};

	let returnData = await matchesService.updateMatchCupStatusBySuperAdmin(reqdaa);
	if (returnData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Cup status updated successfully');
	} else {
		return apiErrorRes(req, res, 'Error to updated cup status !');
	}
}

async function getCups(req, res) {

	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
	});

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let returnData = await matchesService.getCups();
	if (returnData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', returnData.data);
	} else if (returnData.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to profile.');
	}
}

router.get('/matchlist', matchlist);
router.post('/getOnlineMatch', getOnlineMatch);
router.post('/updateMatchStatus', updateMatchStatus);
router.post('/createMatches', createMatches);
router.post('/getAllMatches', getAllMatches);
router.post('/updateMatch', updateMatch);
router.post('/getMatchSettingById', getMatchSettingById);
router.get('/marketWatch', marketWatch);  
router.post('/homeInplayMatches', homeInplayMatches);
router.post('/homematches', homeMatches);
router.post('/getActiveMatchesBySportId',getActiveMatchesBySportId);
router.get('/topEvents', topEvents);
router.post('/matchDetails', matchDetails);
router.post('/getMatchUser', getMatchUser);
router.get('/getMatchAndMarketPosition/:match_id', getMatchAndMarketPosition);
router.get('/searchMatches', searchMatches);
router.post('/matches/createMatchBySuperAdmin', createMatchBySuperAdmin);
router.post('/matches/getManualOddsMarketByMatch', getManualOddsMarketByMatch);
router.post('/matches/getLiveSportMatchList', getLiveSportMatchList);
router.post('/matches/updateMatchId', updateMatchId);
router.post('/matches/updateLiveSportTvUrlBySuperAdmin', updateLiveSportTvUrlBySuperAdmin);
router.post('/matches/updateMatchCupStatusBySuperAdmin', updateMatchCupStatusBySuperAdmin);
router.post('/matches/getCups', getCups);
module.exports = router;
