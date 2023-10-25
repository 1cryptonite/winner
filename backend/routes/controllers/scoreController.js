/* eslint-disable quotes */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Joi = require('joi');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const matchesService = require('../services/matchesService');
const logger = require('../../utils/logger');

const https = require('https');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;

/* async function scoreBoard(req, res) {
	try {
		let match_id = req.body.match_id;
		let score_type = req.body.score_type;
		let score_key = req.body.score_key;

		if(score_type == '0' && score_key != '0'){
		//	let onlineSeriesRes = await axios.get('https://score.crakex.in:3290/matchid/CL', { httpsAgent: new https.Agent({
		//			rejectUnauthorized: false
		//		}) });

			let onlineSeriesRes = await axios.get('https://score.crakex.in:3290/node/matchid/' + score_key);


			return apiSuccessRes(req, res, 'success', onlineSeriesRes.data);
		}else {

			let onlineSeriesRes = await axios.get('https://ips.betfair.com/inplayservice/v1/scores?_ak=nzIFcwyWhrlwYMrh&alt=json&eventIds=' + match_id + '&locale=en_GB&productType=EXCHANGE&regionCode=UK');

			return apiSuccessRes(req, res, 'success', onlineSeriesRes.data[0]);
		}

	} catch (e) {
		return apiErrorRes(req, res, "Error to get score !");
	}
}   */


async function scoreBoard(req, res) {
	try {
		let match_id = req.body.match_id;
		let score_type = req.body.score_type;
		let score_key = req.body.score_key;

		if(score_type == '0' && score_key != '0'){
			/*let onlineSeriesRes = await axios.get('https://score.crakex.in:3290/matchid/CL', { httpsAgent: new https.Agent({
					rejectUnauthorized: false
				}) });*/

		//	let onlineSeriesRes = await axios.get('https://score.crakex.in:3290/node/matchid/' + score_key);
			let onlineSeriesRes = await axios.get('http://167.99.198.2/api/matches/score/' + score_key);


			return apiSuccessRes(req, res, 'success', onlineSeriesRes.data);
		}else {

			let onlineSeriesRes = await axios.get('https://ips.betfair.com/inplayservice/v1/scores?_ak=nzIFcwyWhrlwYMrh&alt=json&eventIds=' + match_id + '&locale=en_GB&productType=EXCHANGE&regionCode=UK');

			return apiSuccessRes(req, res, 'success', onlineSeriesRes.data[0]);
		}

	} catch (e) {
		logger.errorlog.error("scoreBoard",e);
		return apiErrorRes(req, res, "Error to get score !");
	}
}

async function score(req, res) {
	try {

		let onlineSeriesRes = await axios.get('https://lotusbook.io/api/member/match-center/stats/4/29630397');


			return apiSuccessRes(req, res, 'success', onlineSeriesRes.data);


	} catch (e) {
		logger.errorlog.error("score",e);
		return apiErrorRes(req, res, "Error to get score !");
	}
}

async function updatescorekey(req, res) {
	let {
		match_id,
		score_key
	} = req.body;
	const profilechema = Joi.object({
		match_id: Joi.number().required(),
		score_key: Joi.optional()

	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	if(score_key==''){
		score_key = 0;
	}

	score_type = '0';
	let reqData = {
		score_key,
		score_type
	};
	
	let getUserDetailsFromDB = await matchesService.updateMatch(reqData, match_id);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Updated Successfully');

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'not found.');
	} else {
		return apiSuccessRes(req, res, 'Error to update scoreboard.');
	}
}

async function gettvurl(req, res) {
	try {

		let onlineTvRes = await axios.get('https://sa.crakex.in/api/gettvurl');

//console.log(onlineTvRes);

			return apiSuccessRes(req, res, 'success', onlineTvRes.data.data);


	} catch (e) {
		logger.errorlog.error("gettvurl",e);
		return apiErrorRes(req, res, "Error to get tv url !");
	}
}


router.get('/gettvurl', gettvurl);
router.post('/updatescorekey', updatescorekey);
// router.post('/scoreBoard', scoreBoard);
router.post('/scoreBoard', scoreBoard);
router.get('/score', score);
module.exports = router;
