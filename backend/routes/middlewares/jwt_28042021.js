const expressJwt = require('express-jwt');
//const globalFunction = require('../../utils/globalFunction');

const settings = require('../../config/settings');
const userModel = require('../model/userModel');
//const userService = require('../services/serviceUser');

module.exports = jwt;


function jwt() {
	const secret = settings.secret;
	return expressJwt({
		secret,
		isRevoked
	}).unless({
		path: [
			'/view/token',
			'/api/v1/login',
			'/api/v1/userLogin',
			'/api/v1/register',
			'/api/v1/forgotPassword',
			'/api/v1/getLiveMatchMarketIdList',
			'/api/v1/forgotPasswordVerifyOtp',
			'/api/v1/getMarketSession',
			'/api/v1/uploads/logo.png',
            '/api/v1/uploads/default.css',
			'/api/v1/uploads/default.apk',
			'/api/v1/uploads/favicon.ico',
			'/api/v1/uploads/bg_logo.png',
			'/api/v1/uploads/social_logo.png',
			'/api/v1/uploads/footer.png',
			'/api/v1/uploads/pattern.png',
			'/api/v1/uploads/app.apk',
            '/api/v1/autoCreateMarket',
            '/api/v1/globalConstant',
			'/api/v1/exchange/getOddsByMarketIdsWithOutKeyValuePair',
            '/api/v1/checkMaintenanceSetting',
            '/api/v1/updateMarketCardsData',
            '/api/v1/autoResultDeclaredBySuperAdmin',
            '/api/v1/updateMarketCardsData',
			'/api/v1/matches/createMatchBySuperAdmin',
			'/api/v1/market/createMarketBySuperAdmin',
			'/api/v1/fancy/createFancyBySuperAdmin',
			'/api/v1/fancy/setResultFancyBySuperAdmin',
			'/api/v1/series/createSeriesBySuperAdmin',
			'/api/v1/market/abandonedMarketBySuperAdmin',
			'/api/v1/fancy/abandonedFancyBySuperAdmin',
			'/api/v1/getResultOddsPerSelection',
			'/api/v1/fancy/updateFancyStatusBySuperAdmin',
			'/api/v1/fancy/updateFancyMessageBySuperAdmin',
			'/api/v1/report/makeSuperAdminCommissionSettlement',
			'/api/v1/report/deleteSuperAdminCommissionSettlement',
			'/api/v1/report/superAdminCommissionDetail',
			'/api/v1/printPDF',
			'/api/v1/user/verifyUserByToken',
			'/api/v1/score',
			'/api/v1/matches/updateMatchId',
			'/api/v1/market/updateMarketId',
			'/api/v1/accountSatement_test',
			'/api/v1/matches/updateLiveSportTvUrlBySuperAdmin',
			'/api/v1/matches/updateMatchCupStatusBySuperAdmin',
			'/api/v1/virtualGameApi',
			'/api/v1/signUp'
		]
	});
}

async function isRevoked(req, payload, done) {
	//console.log('payload.sub  ',JSON.stringify(payload.sub));
	// const user = await userService.getUserByUserId(payload.sub);
	// if (!user.data) {
	// 	return done(null, true);
	// }
	req.body.userid = payload.sub.id;
	req.body.parent_ids = payload.sub.parent_id;
	// if (user.data.isDisabled) {
	// 	// logger.info("isDelete....................");
	// 	req.body.isDisabled = user.data.isDisabled;
	// 	return done(null, true);
	// }

	await userModel.setUserData( payload.sub);

	done();
}