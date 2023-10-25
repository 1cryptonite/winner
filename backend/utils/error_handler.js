let globalFunction = require('./globalFunction');
//const CONSTANTS = require('./constants');
const apiErrorRes = globalFunction.apiErrorRes;


function errorHandler(err, req, res, next) {
	if (typeof (err) === 'string') {
		return apiErrorRes(req, res, 'Eroor'+next);
	}
	if (err.name === 'UnauthorizedError') {
		return apiErrorRes(req, res, 'Send valid token!');
	}
	return apiErrorRes(req, res, err.message);

}
module.exports = errorHandler;