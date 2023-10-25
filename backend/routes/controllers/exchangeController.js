const express = require('express');
const router = express.Router();
const Joi = require('joi');
// const axios = require('axios');
// const settings = require('../../config/settings');
const exchangeService = require('../services/exchangeService');
const marketsService = require('../services/marketsService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');


let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;
async function getOddsByMarketId(req, res) {
	let {
		market_id,
		is_manual_odds
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(), 		
		parent_ids: Joi.optional().required(),
		market_id: Joi.number().required(),
		is_manual_odds: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		//errorlog.error('Invalid param.'+error);
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await exchangeService.getOddsByMarketId(market_id, is_manual_odds);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else {
		//errorlog.error('Data not found. for market id :  '+market_id);
		return apiSuccessRes(req, res, 'Data not found.');
	}

}


async function getOddsByMarketIdsWithOutKeyValuePair(req, res) {


	let market_id = req.query.market_id.split(',');

	let odds = await exchangeService.getOddsByMarketIdsWithOutKeyValuePair(market_id);

	return res.status(200).send(odds.data);

}

async function getLiveMatchMarketIdList(req, res) {

	// const profilechema = Joi.object({
	// 	userid: Joi.number().required(), 		
	// 	parent_ids: Joi.optional().required()
	// });
	// try {
	// 	await profilechema.validate(req.body, {
	// 		abortEarly: true
	// 	});
	// } catch (error) {
	// 	return apiErrorRes(req, res, error.details[0].message);
	// }
	let getUserByUserId = await marketsService.getLiveMatchMarketIdList();

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else {
		return apiSuccessRes(req, res, 'Match List not found.');
	}

}
router.post('/getOddsByMarketId', getOddsByMarketId);
router.get('/getLiveMatchMarketIdList', getLiveMatchMarketIdList);
router.get('/exchange/getOddsByMarketIdsWithOutKeyValuePair', getOddsByMarketIdsWithOutKeyValuePair);
module.exports = router;
