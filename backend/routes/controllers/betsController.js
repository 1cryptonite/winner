const express = require('express');
const router = express.Router();
const Joi = require('joi');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const betService = require('../services/betsService');
const marketsService = require('../services/marketsService');
const selectionService = require('../services/selectionService');
const userService = require('../services/userService');
const partnershipsService = require('../services/partnershipsService');
const exchangeService = require('../services/exchangeService');
const fancyService = require('../services/fancyService');
const sportsService = require('../services/sportsService');

const settings = require('../../config/settings');
const axios = require('axios');
const userSettingSportWiseService = require('../../routes/services/userSettingSportWiseService');
const userModel = require('../../routes/model/userModel');
const pdcService = require('../services/pdcService');
const delay = require('delay');
const browser = require('browser-detect');
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;

let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;

async function saveBet(req, res) {

	try {
		let {
			market_id,
			userid,
			selection_id,
			odds,
			stack,
			is_back
		} = req.body;

		const result = browser(req.headers['user-agent']);
		let ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		//ip_address = ip_address.slice(7);
		let device_info = Object.keys(result)[0];

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			market_id: Joi.string().required(),
			selection_id: Joi.optional().required(),
			odds: Joi.number().required(),
			stack: Joi.number().required().strict(),
			is_back: Joi.string().valid("0", "1").required(),
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let parent_idsArray = req.body.parent_ids.split(',');
		let agent_id = parent_idsArray[0];
		let super_agent_id = parent_idsArray[1];
		let master_id = parent_idsArray[2];
		let admin_id = parent_idsArray[3];

		if (odds <= 1) {
			return apiErrorRes(req, res, 'Min odds limit is over ');
		}

		let marketData = await marketsService.gatDataByMarketId(market_id);

		if (marketData.statusCode == CONSTANTS.SUCCESS) {

			if (marketData.data.is_result_declared == 1) {
				return apiErrorRes(req, res, 'market result declared');
			} else if (marketData.data.is_active == 0) {
				return apiErrorRes(req, res, 'market  deactive');
			}
		} else {
			return apiErrorRes(req, res, 'invalid market');
		}
		let sport_id = marketData.data.sport_id;
		let match_id = marketData.data.match_id;

        /*if(match_id < 0){
            return apiSuccessRes(req, res, 'Bet Placed Successfully');
        }*/

		let selectionName = await selectionService.getNameBySelectionId(selection_id, match_id);
		if (selectionName.statusCode !== CONSTANTS.SUCCESS) {
			return apiErrorRes(req, res, 'invalid selection id');
		}

		let servicePartnershipData =await partnershipsService.getPartnershipByUserId(userid, sport_id);

		if (servicePartnershipData.statusCode !== CONSTANTS.SUCCESS) {
			return apiErrorRes(req, res, 'invalid service Partner ships ');
		} else {
			if (servicePartnershipData.data.user_type_id != 5) {
				return apiErrorRes(req, res, 'Not a valid user ');
			}
		}

		/////////

		let is_pdc_charge = CONSTANTS.IS_PDC_CHARGE;
		let is_pdc_distribute = CONSTANTS.IS_PDC_DISTRIBUTE;
		let is_pdc_refund = CONSTANTS.IS_PDC_REFUND;
		let is_pdc_charge_on_first_bet = CONSTANTS.IS_PDC_CHARGE_ON_FIRST_BET;
		let getMarketForPDC;
		let pdc_deducted;
		let pdc_charge = 0;
		let is_deduct_first_bet_pdc = 0;
		if (is_pdc_charge == 1 && is_pdc_charge_on_first_bet == 1) {
			let sportSetting = await sportsService.getSportSetting(sport_id);
			if (sportSetting.data.is_pdc_charge == '1') {
				let is_pdc_deducted = await pdcService.checkPdcDeductedForMatch(userid, match_id, sport_id);
				if (is_pdc_deducted.statusCode === CONSTANTS.SUCCESS && is_pdc_deducted.data.length == 0) {
					getMarketForPDC = await pdcService.getMarketForPDC(match_id, sport_id);
					if (getMarketForPDC.statusCode === CONSTANTS.SUCCESS && getMarketForPDC.data.length > 0) {
						pdc_deducted = await pdcService.verifyPdcChargeMatchEntry(userid, match_id, getMarketForPDC.data[0].market_id, sport_id);
						if (pdc_deducted.statusCode === CONSTANTS.SUCCESS && (pdc_deducted.data.length == 0 || pdc_deducted.data[0].is_pdc_charged == '0')) {
							if (is_pdc_distribute == 0) {
								pdc_charge = sportSetting.data.pdc_charge;
							} else {
								let pdcSetting = await userSettingSportWiseService.getPDCBySportAndUsers(sport_id, [userid]);
								pdc_charge = pdcSetting.data[userid].pdc_charge;
							}
							is_deduct_first_bet_pdc = 1;
						}
					}
				}
			}
		}

		/////////

		let userSetting = await userSettingSportWiseService.getUserSettingBySport(sport_id, userid);
		userSetting = userSetting.data;

		let getSuperAdminCommissionBySport = await userSettingSportWiseService.getSuperAdminCommissionBySport(sport_id, parent_idsArray);

		getSuperAdminCommissionBySport = JSON.parse(getSuperAdminCommissionBySport.data.super_admin_commission_json);

		let is_manual_odds = '0';
		if (marketData.data.is_manual_market == '1' || (marketData.data.is_manual_market == '0' && marketData.data.is_manual_odds == '1')) {
			is_manual_odds = '1';
		}

		if (marketData.data.is_bookmaker_market == '0') {
			await delay((userSetting.bet_delay) * 1000);
		}

		/*start  place bet  code  */
		let betFairOdss = await exchangeService.getOddsRate(market_id, selection_id, is_back, marketData.data.is_live_sport, is_manual_odds);

		let is_matched = "0", p_l, redisOdds, redisStatus, liability;
		redisOdds = betFairOdss.data.odds;
		redisStatus = betFairOdss.data.status;

		//For matka
		try {
			if (match_id == '-154' || match_id == '-156' || match_id == '-1001' || match_id == '-1002' || match_id == '-1003' || match_id == '-1004' || match_id == '-1005' || match_id == '-1013') {
				let market_runner_json = JSON.parse(marketData.data.runner_json);
				let sIndex = market_runner_json.findIndex((element) => element.selectionId == selection_id);
				if (typeof market_runner_json[sIndex].multiplyStackBy != 'undefined'){
					stack = stack * market_runner_json[sIndex].multiplyStackBy;
				}
			}
		}catch(e){}

		if (is_back == "1") {
			if (parseFloat(odds) <= parseFloat(redisOdds)) {
				is_matched = "1";
			} else {
				is_matched = "0";
			}
			odds = redisOdds;
			p_l = (odds * stack) - stack;
			liability = stack;
		} else {
			if (parseFloat(odds) >= parseFloat(redisOdds)) {
				is_matched = "1";
			} else {
				is_matched = "0";
			}
			odds = redisOdds;
			liability = (odds * stack) - stack;
			p_l = stack;
		}

		//is_matched = "1";

		let reqdaaObj = {
			user_id: userid,
			agent_id: agent_id,
			super_agent_id: super_agent_id,
			master_id: master_id,
			admin_id: admin_id,
			sport_id: sport_id,
			match_id: match_id,
			market_id: market_id,
			selection_id: selection_id,
			selection_name: selectionName.data.name,
			selection_liability_type: selectionName.data.liability_type,
			odds: odds,
			stack: stack,
			is_back: is_back,
			p_l: p_l,
			liability: -liability,
			profit: 0,
			chips: 0,
			admin: servicePartnershipData.data.admin,
			master: servicePartnershipData.data.master,
			super_agent: servicePartnershipData.data.super_agent,
			agent: servicePartnershipData.data.agent,
			master_commission: 0,
			super_agent_commission: 0,
			agent_commission: 0,
			user_commission: marketData.data.is_bookmaker_market=='1' ? userSetting.bookmaker_market_commission : userSetting.match_commission,
			is_matched: is_matched,
			device_type: 'W',
			ip_address: ip_address,
			redis_status: redisStatus,
			user_setting_data: userSetting,
			device_info: device_info,
			created_at: globalFunction.currentDate(),
			is_visible: marketData.data.is_visible,
			super_admin_commission_user_part: userSetting.super_admin_commission,
			super_admin_commission_agent_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[agent_id]) == true ? getSuperAdminCommissionBySport[agent_id] : 0 ,
			super_admin_commission_super_agent_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[super_agent_id]) == true ? getSuperAdminCommissionBySport[super_agent_id] : 0 , 
			super_admin_commission_master_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[master_id]) == true ? getSuperAdminCommissionBySport[master_id] : 0 ,
			super_admin_commission_admin_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[admin_id]) == true ? getSuperAdminCommissionBySport[admin_id] : 0 ,
		};

		let validationError = await betService.validateBet(reqdaaObj, pdc_charge);
		if(validationError.statusCode==201){
			return apiErrorRes(req, res, validationError.data);
		}
		let liabilityForBlance = reqdaaObj.liabilityForBlance;
		delete reqdaaObj.user_setting_data;
		delete reqdaaObj.liabilityForBlance;
		delete reqdaaObj.is_visible;
		delete reqdaaObj.redis_status;
		delete reqdaaObj.selection_liability_type;
		/* if(match_id < 0){
             liabilityForBlance = 0;
         }*/

		let responceSaveBet = await betService.saveBet(reqdaaObj, liabilityForBlance);


		if (responceSaveBet.statusCode === CONSTANTS.SUCCESS) {
			if (is_pdc_charge == 1) {
				if (is_pdc_refund == 1 && is_pdc_charge_on_first_bet == 0) {
					let pdc_data = {
						user_id: userid,
						agent_id: agent_id,
						super_agent_id: super_agent_id,
						master_id: master_id,
						admin_id: admin_id,
						sport_id: sport_id,
						match_id: match_id
					};
					await pdcService.refundPDC(pdc_data);
				}
				else if (is_pdc_charge_on_first_bet == 1 && is_deduct_first_bet_pdc == 1) {
					if(getMarketForPDC.data[0].market_id == market_id){
						pdc_deducted = await pdcService.verifyPdcChargeMatchEntry(userid, match_id, getMarketForPDC.data[0].market_id, sport_id);
					}
					let pdc_data = {
						user_id: userid,
						agent_id: agent_id,
						super_agent_id: super_agent_id,
						master_id: master_id,
						admin_id: admin_id,
						sport_id: sport_id,
						match_id: match_id,
						marketData: getMarketForPDC.data[0],
						pdc_charge: pdc_charge,
						user_balance: 0,
						existingPDCData: pdc_deducted.data
					};
					await pdcService.deductPDC(pdc_data, 1);
				}
			}
			return apiSuccessRes(req, res, 'bet saved successfully');
		} else {
			return apiErrorRes(req, res, 'bet not saved.');
		}

		/* end place bet code*/

	} catch (e) {
		logger.errorlog.error("saveBet",e);
		return apiErrorRes(req, res, e.message, e);
	}
}

async function saveFancyBet(req, res) {

	try {
		const result = browser(req.headers['user-agent']);
		let ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		//ip_address = ip_address.slice(7);
		let device_info = Object.keys(result)[0];

		let {
			userid,
			fancy_id,
			run,
			is_back,
			size,
			stack
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			size: Joi.number(),
			fancy_id: Joi.string().required(),
			run: Joi.number().required(),
			stack: Joi.number().required().strict(),
			is_back: Joi.string().valid("0", "1").required(),
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let parent_idsArray = req.body.parent_ids.split(',');
		let agent_id = parent_idsArray[0];
		let super_agent_id = parent_idsArray[1];
		let master_id = parent_idsArray[2];
		let admin_id = parent_idsArray[3];

		let fancyData = await fancyService.getFancyById(fancy_id);
		if (fancyData.statusCode !== CONSTANTS.SUCCESS) {
			return apiErrorRes(req, res, 'invalid fancy id');
		}

		if (fancyData.data[0].active != 1) {
			if (fancyData.data[0].active == 0) {
				return apiErrorRes(req, res, 'Fancy Inactive');
			}
			if (fancyData.data[0].active == 2) {
				return apiErrorRes(req, res, 'Fancy Suspended');
			}

		}

		let fancy_name = fancyData.data[0].name;

		let sport_id = fancyData.data[0].sport_id;
		let arrayMatchAndFancySelectionId = fancy_id.split('_');
		let match_id = arrayMatchAndFancySelectionId[0];

		let servicePartnershipData = await partnershipsService.getPartnershipByUserId(userid, sport_id);

		if (servicePartnershipData.statusCode !== CONSTANTS.SUCCESS) {
			return apiErrorRes(req, res, 'invalid service Partner ships ');
		} else {
			if (servicePartnershipData.data.user_type_id != 5) {
				return apiErrorRes(req, res, 'Not a valid user ');
			}
		}

		/////////

		let is_pdc_charge = CONSTANTS.IS_PDC_CHARGE;
		let is_pdc_distribute = CONSTANTS.IS_PDC_DISTRIBUTE;
		let is_pdc_refund = CONSTANTS.IS_PDC_REFUND;
		let is_pdc_charge_on_first_bet = CONSTANTS.IS_PDC_CHARGE_ON_FIRST_BET;
		let getMarketForPDC;
		let pdc_deducted;
		let pdc_charge = 0;
		let is_deduct_first_bet_pdc = 0;
		if (is_pdc_charge == 1 && is_pdc_charge_on_first_bet == 1) {
			let sportSetting = await sportsService.getSportSetting(sport_id);
			if (sportSetting.data.is_pdc_charge == '1') {
				let is_pdc_deducted = await pdcService.checkPdcDeductedForMatch(userid, match_id, sport_id);
				if (is_pdc_deducted.statusCode === CONSTANTS.SUCCESS && is_pdc_deducted.data.length == 0) {
					getMarketForPDC = await pdcService.getMarketForPDC(match_id, sport_id);
					if (getMarketForPDC.statusCode === CONSTANTS.SUCCESS && getMarketForPDC.data.length > 0) {
						pdc_deducted = await pdcService.verifyPdcChargeMatchEntry(userid, match_id, getMarketForPDC.data[0].market_id, sport_id);
						if (pdc_deducted.statusCode === CONSTANTS.SUCCESS && (pdc_deducted.data.length == 0 || pdc_deducted.data[0].is_pdc_charged == '0')) {
							if (is_pdc_distribute == 0) {
								pdc_charge = sportSetting.data.pdc_charge;
							} else {
								let pdcSetting = await userSettingSportWiseService.getPDCBySportAndUsers(sport_id, [userid]);
								pdc_charge = pdcSetting.data[userid].pdc_charge;
							}
							is_deduct_first_bet_pdc = 1;
						}
					}
				}
			}
		}

		/////////

		let userSetting = await userSettingSportWiseService.getUserSettingBySport(sport_id, userid);
		userSetting = userSetting.data;

		let getSuperAdminCommissionBySport = await userSettingSportWiseService.getSuperAdminCommissionBySport(sport_id, parent_idsArray);
		getSuperAdminCommissionBySport = JSON.parse(getSuperAdminCommissionBySport.data.super_admin_commission_json);

		let is_manual_odds = '0';
		if (fancyData.data[0].fancy_mode == '1' || fancyData.data[0].is_indian_fancy == '1') {
			is_manual_odds = '1';
		}


		await delay( (userSetting.session_delay) * 1000);

		/*start place bet code */

		let p_l, liability;
		stack = Number(stack);

		if (is_back == 1) {
			liability = stack;
			p_l = stack * (size / 100);
		} else {
			p_l = stack;
			liability = stack * (size / 100);
		}
		let reqdaaObj = {
			user_id: userid,
			agent_id: agent_id,
			super_agent_id: super_agent_id,
			master_id: master_id,
			admin_id: admin_id,
			sport_id: sport_id,
			match_id: match_id,
			fancy_id: fancy_id,
			fancy_name: fancy_name,
			run: run,
			stack: stack,
			is_back: is_back,
			profit: p_l,
			liability: -liability,
			chips: 0,
			type_id: 2,
			session_input_yes: 0,
			session_input_no: 0,
			point_difference: 0,
			size: size,
			admin: servicePartnershipData.data.admin,
			master: servicePartnershipData.data.master,
			super_agent: servicePartnershipData.data.super_agent,
			agent: servicePartnershipData.data.agent,
			master_commission: 0,
			super_agent_commission: 0,
			agent_commission: 0,
			user_commission: userSetting.session_commission,
			device_type: 'W',
			ip_address: ip_address,
			user_setting_data: userSetting,
			fancy_score_position_id: 0,
			fancy_score_position_json: [],
			liabilityFancy: 0,
			profitFancy: 0,
			device_info: device_info,
			created_at: globalFunction.currentDate(),
			max_session_bet_liability: fancyData.data[0].max_session_bet_liability,
			max_session_liability: fancyData.data[0].max_session_liability,
			super_admin_commission_user_part: userSetting.super_admin_commission,
			super_admin_commission_agent_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[agent_id]) == true ? getSuperAdminCommissionBySport[agent_id] : 0 ,
			super_admin_commission_super_agent_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[super_agent_id]) == true ? getSuperAdminCommissionBySport[super_agent_id] : 0 , 
			super_admin_commission_master_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[master_id]) == true ? getSuperAdminCommissionBySport[master_id] : 0 ,
			super_admin_commission_admin_part: globalFunction.isNotEmpty(getSuperAdminCommissionBySport[admin_id]) == true ? getSuperAdminCommissionBySport[admin_id] : 0 ,
			is_manual_odds: is_manual_odds
		};	

		let validationError = await betService.validateFancyBet(reqdaaObj, pdc_charge);
		if (validationError.statusCode == 201) {
			return apiErrorRes(req, res, validationError.data);
		}
		let fancy_score_position = {
			user_id: userid,
			agent_id: agent_id,
			super_agent_id: super_agent_id,
			master_id: master_id,
			admin_id: admin_id,
			match_id: match_id,
			fancy_id: fancy_id,
			admin_partnership: servicePartnershipData.data.admin,
			master_partnership: servicePartnershipData.data.master,
			super_agent_partnership: servicePartnershipData.data.super_agent,
			agent_partnership: servicePartnershipData.data.agent,
			liability: reqdaaObj.liabilityFancy,
			profit: reqdaaObj.profitFancy,
			fancy_score_position_json: JSON.stringify(reqdaaObj.fancy_score_position_json)
		};
		let fancy_score_position_id = reqdaaObj.fancy_score_position_id;
		let liabilityForBlance = reqdaaObj.liabilityForBlance;
		delete reqdaaObj.user_setting_data;
		delete reqdaaObj.liabilityFancy;
		delete reqdaaObj.profitFancy;
		delete reqdaaObj.fancy_score_position_json;
		delete reqdaaObj.fancy_score_position_id;
		delete reqdaaObj.liabilityForBlance;
		delete reqdaaObj.max_session_bet_liability;
		delete reqdaaObj.max_session_liability;
		delete reqdaaObj.is_manual_odds;

		let responceSaveBet = await betService.saveFancyBet(reqdaaObj, fancy_score_position, fancy_score_position_id, liabilityForBlance);

		if (responceSaveBet.statusCode === CONSTANTS.SUCCESS) {

			if (is_pdc_charge == 1) {
				if (is_pdc_refund == 1 && is_pdc_charge_on_first_bet == 0) {
					let pdc_data = {
						user_id: userid,
						agent_id: agent_id,
						super_agent_id: super_agent_id,
						master_id: master_id,
						admin_id: admin_id,
						sport_id: sport_id,
						match_id: match_id
					};
					await pdcService.refundPDC(pdc_data);
				}
				else if (is_pdc_charge_on_first_bet == 1 && is_deduct_first_bet_pdc == 1) {
					let pdc_data = {
						user_id: userid,
						agent_id: agent_id,
						super_agent_id: super_agent_id,
						master_id: master_id,
						admin_id: admin_id,
						sport_id: sport_id,
						match_id: match_id,
						marketData: getMarketForPDC.data[0],
						pdc_charge: pdc_charge,
						user_balance: 0,
						existingPDCData: pdc_deducted.data
					};
					await pdcService.deductPDC(pdc_data, 1);
				}
			}
			return apiSuccessRes(req, res, 'Fancy Bet Placed Successfully');
		} else {
			return apiErrorRes(req, res, 'Fancy Bet Not Placed');
		}

		/*end  place bet code */

	} catch (e) {
		logger.errorlog.error("saveFancyBet",e);
		return apiErrorRes(req, res, e.details[0].message, e);
	}
}

async function getHistory(req, res) {

	let {
		pdf_download,
		user_id,
		userTypeId,
		fromDate,
		toDate,
		page,
		matchType,
		is_download,
		sport_id,
		search

	} = req.body;

	const createSeriesSchema = Joi.object({
		user_id: Joi.number().required(),
		userTypeId: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		userid: Joi.number().required(),
		page: Joi.number().required(),
		fromDate: Joi.string().required(),
		toDate: Joi.string().required(),
		matchType: Joi.string().valid('M', 'U', 'P').required(),
		is_download: Joi.optional(),
		pdf_download: Joi.optional(),
		sport_id: Joi.optional(),
		search: Joi.optional()
	});
	try {


		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if (loginUserData.hasOwnProperty('sub_admin_roles')) {
		if (loginUserData.sub_admin_roles.length == 0) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		} else if (loginUserData.sub_admin_roles.indexOf("bet_history_sub_menu") == -1) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}

	let marketData = await betService.getBetHistory(user_id, userTypeId, fromDate, toDate, page, matchType, is_download, sport_id, search);
	// pdf download work
	if (pdf_download == 1) {

		let pdfName = 'BetHistoryM' + Date.now();
		// console.log("hiiii",marketData.data[0])
		let fileData = [];
		for (var i = 0; i < marketData.data[0].length; i++) {

			let placed = new Date(marketData.data[0][i].placed * 1000);
			let val = {

				"Placed": placed.toDateString() + " " + placed.toLocaleTimeString(),
				"Description": marketData.data[0][i].match_name + '|' + marketData.data[0][i].selection_name + '|' + marketData.data[0][i].market_name + '|' + marketData.data[0][i].bet_id,
				"UserName": marketData.data[0][i].name + '(' + marketData.data[0][i].user_name + ')',
				// "Dealer": marketData.data[0][i].agent_name+'('+marketData.data[0][i].agent_user_name+')',
				// "Master": marketData.data[0][i].master_name+'('+ marketData.data[0][i].super_agent_user_name+')',
				// "Super master": marketData.data[0][i].super_agent_name+'('+ marketData.data[0][i].master_user_name+')',
				"BetTpye": "(" + marketData.data[0][i].bet_type + ")",
				"Type": marketData.data[0][i].is_back == 1 ? "Back" : "Lay",
				"Odds": marketData.data[0][i].odds,
				"Stack": marketData.data[0][i].stack,
				"Liability": marketData.data[0][i].liability,
				"Potential Profit": marketData.data[0][i].potential_profit,
				"status": marketData.data[0][i].status

				// "creditordebit": marketData.data[i].credit_debit,
				// "balance": marketData.data[i].balance ip_address liability stack master_name
			};
			fileData.push(val);
		}

		let tabledata = [
			{
				id: 'Placed',
				header: 'Placed',
				width: 100,
				align: 'center'
			},
			{
				id: 'Description',
				header: 'Description',
				width: 120,
				align: 'center',
				fontsize: 5
			},
			{
				id: 'UserName',
				header: 'UserName',
				width: 60,
				align: 'center'
			},
			// {
			// 	id: 'Dealer',
			// 	header: 'Dealer',
			// 	width: 50,
			// 	align: 'center'
			// },
			// {
			// 	id: 'Master',
			// 	header: 'Master',
			// 	width: 30,
			// 	align: 'center'
			// },
			// {
			// 	id: 'Super master',
			// 	header: 'Super master',
			// 	width: 40,
			// 	align: 'center'
			// },
			{
				id: 'BetTpye',
				header: 'Bet Type',
				width: 40,
				align: 'center'
			},

			{
				id: 'Type',
				header: 'Type',
				width: 30,
				align: 'center'
			}, {
				id: 'Odds',
				header: 'Odds',
				width: 30,
				align: 'center'
			}, {
				id: 'Stack',
				header: 'Stack',
				width: 30,
				align: 'center'
			}, {
				id: 'Liability',
				header: 'Liability',
				width: 40,
				align: 'center'
			}, {
				id: 'Potential Profit',
				header: 'Potential Profit',
				width: 60,
				align: 'center'
			}
		];

		// ADD status for past bets
		if (matchType === "P") {
			tabledata.push(
				{
					id: 'status',
					header: 'Status',
					width: 40,
					align: 'center'
				}
			);
        // Potential Profit Delete for past bets
        for (var i = 0; i < tabledata.length; i++)
            if (tabledata[i].id === "Potential Profit") {
                tabledata.splice(i, 1);
                break;
            }
		}

		globalFunction.printPDF(req, res, pdfName, tabledata, fileData);
	} else {
		if (marketData.statusCode === CONSTANTS.SUCCESS) {
			let data = {};
			if (page == 1 || is_download == 1) {
				data = { "limit": CONSTANTS.LIMIT, "total": marketData.data[3][0].total, "data": marketData.data[0], "valuesSum": marketData.data[1][0] };
			} else {
				data = { "limit": CONSTANTS.LIMIT, "total": 0, "data": marketData.data[0], "valuesSum": {} };
			}
			return apiSuccessRes(req, res, 'bet history successfully', data);
		} else {
			//errorlog.error('Error to get bet  history for userID: '+user_id);

			return apiSuccessRes(req, res, 'Error to get bet  history');
		}
	}
}

async function getBetsByMatchId(req, res) {
	let {
		userid,
		match_id, user_type_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.optional().required(),
	});
	let loginUserData = userModel.getUserData();
	user_type_id = loginUserData.user_type_id;
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}

	let getUserDetailsFromDB = await betService.getBetsByMatchId(userid, user_type_id, match_id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to getBetsByMatchId.');
	}
}

async function getBetsByMarketId(req, res) {
	//market_type 1=market_id, 2=fancy_id
	let {
		userid,
		user_id,
		user_type_id,
		market_id,
		market_type
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number(),
		user_type_id: Joi.number(),
		market_id: Joi.optional().required(),
		market_type: Joi.optional()
	});

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}

	if (!user_id || !user_type_id) {
		user_id = userid;
		let loginUserData = userModel.getUserData();
		user_type_id = loginUserData.user_type_id;
	}

	let getUserDetailsFromDB = await betService.getBetsByMarketId(user_id, user_type_id, market_id, market_type);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', getUserDetailsFromDB.data);

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		//errorlog.error('Error to getBetsByMarketId for userID: '+userid);
		return apiSuccessRes(req, res, 'Error to getBetsByMarketId.');
	}
}

async function getAllBets(req, res) {
	let {
		userid,
		user_type_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	user_type_id = loginUserData.user_type_id;

	let getUserDetailsFromDB = await betService.getAllBets(userid, user_type_id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', getUserDetailsFromDB.data);
	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		//errorlog.error('Error to getAllBets for userID: '+userid);
		return apiSuccessRes(req, res, 'Error to getAllBets.');
	}
}


let matchResultOdds = async (req, res) => {
	let {
		sport_id,
		match_id,
		market_id,
		selection_id,
		sport_name,
		match_name,
		market_name,
		selection_name
	} = req.body;

	const resultSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		sport_id: Joi.string().required(''),
		match_id: Joi.string().required(),
		market_id: Joi.string().required(),
		selection_id: Joi.string().required(),
		sport_name: Joi.string().required(),
		match_name: Joi.string().required(),
		market_name: Joi.string().required(),
		selection_name: Joi.string().required(),
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
	let user_type_id = loginUserData.user_type_id;

	if (user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
		let oddsResultData = await betService.getResultOdds(sport_id, match_id, market_id, selection_id, sport_name, match_name, market_name, selection_name);

		if (oddsResultData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, oddsResultData.data[0].retMess, oddsResultData.data[0].resultV);
		} else {
			return apiErrorRes(req, res, 'Error to get bet result !');
		}
	} else {
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}
};

let getResultOddsPerSelection = async (req, res) => {
	let {
		sport_id,
		match_id,
		market_id,
		selection_id,
		odds,
		isWinner
	} = req.body;

	const resultSchema = Joi.object({
		sport_id: Joi.required(''),
		match_id: Joi.required(),
		market_id: Joi.required(),
		selection_id: Joi.required(),
		odds: Joi.required(),
		isWinner: Joi.required()
	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}

	let oddsResultData = await betService.getResultOddsPerSelection(sport_id, match_id, market_id, selection_id, odds, isWinner);

	if (oddsResultData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, oddsResultData.data[0].retMess, oddsResultData.data[0].resultV);
	} else {
		return apiSuccessRes(req, res, 'Error to get bet result');
	}
};

let autoResultDeclaredBySuperAdmin = async (req, res) => {
	let dataObject = req.body;
	let checkMarketIsAdded = await marketsService.getMarketByListOfID(dataObject.market_id);
	if (checkMarketIsAdded.data) {
		let checkBetExist = await betService.deleteMarketIfBetNotExist(dataObject.sport_id, dataObject.market_id)
		if (checkBetExist.statusCode===CONSTANTS.SUCCESS){
			return apiSuccessRes(req, res, "Result Declared Successfully !"); 
		} else {
		let oddsResultData;
		if (dataObject.resultId == 0) {
			oddsResultData = await marketsService.abandonedMarket(dataObject.match_id, dataObject.market_id, 0);
		} else {
			oddsResultData = await betService.getResultOdds(dataObject.sport_id, dataObject.match_id, dataObject.market_id, dataObject.selection_id, dataObject.sport_name, dataObject.match_name, dataObject.market_name, dataObject.selection_name);
		}

		if (oddsResultData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, oddsResultData.data[0].retMess, oddsResultData.data[0].resultV);
		} else {
			return apiErrorRes(req, res, 'Error to get bet result');
		}
	}
	} else {
		return apiErrorRes(req, res, 'Market not added !');
	}
};

let autoResultDeclare = async (req, res) => {

	try {
		const resultSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required()
		});
		try {
			await resultSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			//errorlog.error('Invalid param.'+error);
			return apiErrorRes(req, res, error.details[0].message);
		}

		let undeclearedMarkets = await marketsService.undeclearedMarketsForAutoDecliredResult();

		let resultApiUrl = settings.RESULT_DECLARED;

		let sport_id, match_id, market_id, selection_id, sport_name, match_name, market_name, selection_name;
		let matcheNames = "";
		for (let i in undeclearedMarkets.data) {
			let undeclearedMarket = undeclearedMarkets.data[i];

			let marketResult = await axios.get(resultApiUrl + undeclearedMarket.market_id);
			try {
				let runners = marketResult.data[0].runners;

				for (let j in runners) {
					if (runners[j].status == 'WINNER') {

						sport_id = undeclearedMarket.sport_id;
						match_id = undeclearedMarket.match_id;
						market_id = undeclearedMarket.market_id;
						sport_name = undeclearedMarket.sport_name;
						match_name = undeclearedMarket.match_name;
						market_name = undeclearedMarket.market_name;
						selection_id = runners[j].selectionId;

						let selectionNameData = await selectionService.getNameBySelectionId(selection_id, match_id);
						selection_name = selectionNameData.data.name;
						let oddsResultData = await betService.getResultOdds(sport_id, match_id, market_id, selection_id, sport_name, match_name, market_name, selection_name);
						if (oddsResultData.statusCode === CONSTANTS.SUCCESS) {

							if (matcheNames != '') {
								matcheNames += ', ';
							}
							matcheNames += match_name + "(" + market_name + ")";
						}
					}
				}
			} catch (e) {

			}
		}

		if (matcheNames != '') {
			matcheNames = 'Auto result declared for matches: ' + matcheNames;
		} else {
			matcheNames = 'No match for declare result';
		}

		return apiSuccessRes(req, res, matcheNames);

	} catch (e) {
		logger.errorlog.error("autoResultDeclare",e);
		return apiErrorRes(req, res, 'Error to get bet result ' + e);

	}



};


let deleteBet = async (req, res) => {

	let {
		bet_id,
		user_id,
		market_id,
		is_fancy,
		is_void
	} = req.body;

	const resultSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		market_id: Joi.string().required(),
		bet_id: Joi.number().required(''),
		is_fancy: Joi.number().required(),
		is_void: Joi.number().required()
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
	let user_type_id = loginUserData.user_type_id;

	if (user_type_id === CONSTANTS.USER_TYPE_ADMIN) {

		let remote_ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
		//remote_ip = remote_ip.slice(7);

		let betDeleteData = await betService.deleteBet(bet_id, user_id, market_id, is_fancy, is_void, remote_ip);

		if (betDeleteData.statusCode === CONSTANTS.SUCCESS) {

			if (CONSTANTS.IS_PDC_CHARGE == 1 && CONSTANTS.IS_PDC_REFUND == 1 && CONSTANTS.IS_PDC_CHARGE_ON_FIRST_BET == 0) {
				let pdc_data = {
					bet_id: bet_id,
					is_fancy: is_fancy
				};
				await pdcService.refundPDCRollbackOnBetDelete(pdc_data);
			}

			return apiSuccessRes(req, res, betDeleteData.data);
		} else {
			return apiErrorRes(req, res, 'Error to  bet delete !');
		}
	} else {
		//errorlog.error('Unauthorized Access deleteBet : '+userid);
		return apiSuccessRes(req, res, 'Unauthorized Access !');
	}
};



async function getAllBetsByMatchWithSearch(req, res) {
	let {
		match_id,
		page,
		userid,
		search
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		match_id: Joi.optional().required(),
		search: Joi.optional().required(),
		page: Joi.number().required()
	});
	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}
	//let loginUserData = userModel.getUserData();
	if (loginUserData.hasOwnProperty('sub_admin_roles')) {
		if (loginUserData.sub_admin_roles.length == 0) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		} else if (loginUserData.sub_admin_roles.indexOf("bet_list") == -1) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let getBetsFromDB = await betService.getAllBetsByMatchWithSearch(userid, user_type_id, match_id, page, search
	);
	if (getBetsFromDB.statusCode === CONSTANTS.SUCCESS) {

		let finalData = {};
		if (page == 1) {
			finalData = { "limit": CONSTANTS.LIMIT, "total": getBetsFromDB.data[1][0].total, "data": getBetsFromDB.data[0] };
		} else {
			finalData = { "limit": CONSTANTS.LIMIT, "total": 0, "data": getBetsFromDB.data[0] };
		}
		return apiSuccessRes(req, res, 'SUCCESS', finalData);

	} else {
		return apiErrorRes(req, res, 'Error to get bets !');
	}
}

async function getDeletedBets(req, res) {
	let {
		page,
		userid,
		search
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		search: Joi.optional().required(),
		page: Joi.number().required()
	});
	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}
	//let loginUserData = userModel.getUserData();
	if (loginUserData.hasOwnProperty('sub_admin_roles')) {
		if (loginUserData.sub_admin_roles.length == 0) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		} else if (loginUserData.sub_admin_roles.indexOf("deleted_bets_sub_menu") == -1) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}


	let getBetsFromDB = await betService.getDeletedBets(userid, user_type_id, page, search);
	if (getBetsFromDB.statusCode === CONSTANTS.SUCCESS) {

		let finalData = {};
		if (page == 1) {
			finalData = { "limit": CONSTANTS.LIMIT, "total": getBetsFromDB.data[1][0].total, "data": getBetsFromDB.data[0] };
		} else {
			finalData = { "limit": CONSTANTS.LIMIT, "total": 0, "data": getBetsFromDB.data[0] };
		}
		return apiSuccessRes(req, res, 'SUCCESS', finalData);

	} else {
		return apiErrorRes(req, res, 'Error to get bets !');
	}
}

let updateBetsOddsParSelectionId = async (req, res) => {

	let {
		odds,
		selection_id
	} = req.body;

	let oddsParSelectionId = await betService.updateBetsOddsParSelectionId({ odds, selection_id });

	if (oddsParSelectionId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, oddsParSelectionId.data);
	} else {
		return apiErrorRes(req, res, 'Error to  oddsParSelectionId !');
	}


};

async function getBetsByMarketAndUser(req, res) {
	let {
		user_id,
		user_type_id,
		match_id,
		market_id,
		type
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.optional().required(),
		user_type_id: Joi.optional().required(),
		match_id: Joi.optional().required(),
		market_id: Joi.optional().required(),
		type: Joi.optional().required()
	});

	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let getUserDetailsFromDB = await betService.getBetsByMarketAndUser(user_id, user_type_id, match_id, market_id, type);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'success', getUserDetailsFromDB.data);
	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiErrorRes(req, res, 'Bets not found !');
	} else {
		return apiErrorRes(req, res, 'Error to bets !');
	}
}

let permanentDeleteBet = async (req, res) => {

	let {
		bet_id,
		is_fancy
	} = req.body;

	const resultSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		bet_id: Joi.number().required(),
		is_fancy: Joi.number().required()
	});
	try {
		await resultSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	if (user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
		let betDeleteData = await betService.permanentDeleteBet(bet_id, is_fancy);
		if (betDeleteData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Bet deleted successfully');
		} else {
			return apiErrorRes(req, res, 'Error to delete bet !');
		}
	} else {
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}
};


router.post('/bet/saveBet', saveBet);
router.post('/bet/saveFancyBet', saveFancyBet);
router.post('/bet/getHistory', getHistory);
router.post('/bet/getBetsByMatchId', getBetsByMatchId);
router.post('/bet/getBetsByMarketId', getBetsByMarketId);
router.post('/bet/getAllBets', getAllBets);
router.post('/bet/matchResultOdds', matchResultOdds);
router.get('/autoResultDeclare', autoResultDeclare);
router.post('/autoResultDeclaredBySuperAdmin', autoResultDeclaredBySuperAdmin);
router.post('/bet/deleteBet', deleteBet);
router.post('/bet/updateBetsOddsParSelectionId', updateBetsOddsParSelectionId);
router.post('/bet/getAllBetsByMatchWithSearch', getAllBetsByMatchWithSearch);
router.post('/bet/getDeletedBets', getDeletedBets);
router.post('/bet/getBetsByMarketAndUser', getBetsByMarketAndUser);
router.post('/getResultOddsPerSelection', getResultOddsPerSelection);
router.post('/bet/permanentDeleteBet', permanentDeleteBet);

module.exports = router;
