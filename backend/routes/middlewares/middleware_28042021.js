//const settings = require('../../config/settings');
const globalFunction = require('../../utils/globalFunction');
const constants = require('../../utils/constants');
//const CONSTANTS = require('../../utils/constants');
const apiErrorRes = globalFunction.apiErrorRes;

var middleware = async function (req, res, next) {

	if(global._config.site_under_maintenance=="1" && req.body.userid!=1){
        return apiErrorRes(req, res, 'Site Under Maintenance.',null,constants.SITE_UNDER_MAINTENANCE);
        //return res.sendfile('under_maintenance.jpeg', { root: __dirname + "/../../" } );
	}

	if(req.headers['devicetype'] == 'A'){
		const apkServiceCheck = require('../services/apkService');
		let apkData = await apkServiceCheck.getApkData();
		let apk_active='0';
		if(apkData.statusCode === constants.SUCCESS){
			apk_active = apkData.data.is_active;
		}
		if(apk_active=='0'){
			return apiErrorRes(req, res, 'Apk not activated');
		}
	}

	const ignored_routes = [
        '/',
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
		'/api/v1/uploads/pattern.png',
		'/api/v1/uploads/footer.png',
		'/api/v1/uploads/app.apk',
		'/api/v1/autoCreateMarket',
        '/api/v1/globalConstant',
		'/api/v1/exchange/getOddsByMarketIdsWithOutKeyValuePair',
        '/api/v1/checkMaintenanceSetting',
        '/api/v1/checkMaintenanceSetting/',
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
		'/api/v1/user/verifyUserByToken',
		'/api/v1/score',
		'/api/v1/matches/updateMatchId',
		'/api/v1/market/updateMarketId',
		'/api/v1/printPDF',
		'/api/v1/matches/updateLiveSportTvUrlBySuperAdmin',
		'/api/v1/matches/updateMatchCupStatusBySuperAdmin',
		'/api/v1/virtualGameApi',
		'/api/v1/signUp'
	];
	if(ignored_routes.includes(req.path) ) {
		next();
	}
	else {
		/*let token=req.headers.authorization.split(' ');
		let findToken=global._blacklistToken.findIndex((element)=>element.token===token[token.length-1]);
		if (findToken >=0) {
			return apiErrorRes(req, res, 'Your token is expire.');
		}
		// next();*/
		// console.log(req.headers.authorization);
		// console.log(req.path)
		let token=req.headers.authorization.split(' ');
		let findToken=global._loggedInToken.findIndex((element)=>element.token===token[token.length-1]);
		if (findToken >=0) {
			next();
		}else{
			let development_mode_ip = ['127.0.0.1', '192.168.1.18', '192.168.1.21','192.168.1.33', '::ffff:127.0.0.1', '::ffff:192.168.1.18', '::ffff:192.168.1.21','::ffff:192.168.1.33'];
			let ip_address_val = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			//ip_address_val = ip_address_val.slice(7);
			let checkIp = development_mode_ip.includes(ip_address_val);
			if (checkIp) {
				next();
			}else{
				return apiErrorRes(req, res, 'Invalid Token !', null, 412);
			}
		}
	}
};

module.exports = middleware;


