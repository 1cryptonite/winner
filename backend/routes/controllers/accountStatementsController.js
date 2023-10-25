const express = require('express');
const router = express.Router();
const Joi = require('joi');
// const axios = require('axios');
// const settings = require('../../config/settings');
const accountStatementsservice = require('../services/accountStatementsservice');
const serviceUser = require('../services/userService');
const globalSettingService = require('../services/globalSettingService');
const userModel = require('../model/userModel');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const logger = require('../../utils/logger');

const PDFDocument = require('pdfkit');
const PdfTable = require('voilab-pdf-table');

const errorlog = logger.errorlog;
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;

async function chipInOut(req, res) {
	let {
		user_id,
		parent_id,
		description,
		amount,
		crdr
	} = req.body;

	const createMarketSchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		parent_id: Joi.number().required(),
		description: Joi.optional(),
		amount: Joi.number().greater(0).required(),
		crdr: Joi.number().valid(1, 2).required(),
	});

	try {
		await createMarketSchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
        //errorlog.error('Invalid parameter.');
		return apiErrorRes(req, res, error.details[0].message);
	}
	// subadmin permission work
	let loginUserData = userModel.getUserData();
	if (loginUserData.hasOwnProperty('sub_admin_roles')) {
		if (loginUserData.sub_admin_roles.length == 0) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		} else if (loginUserData.sub_admin_roles.indexOf("deposit_withdraw") == -1) {
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let datafromService1 = await serviceUser.getUserById(user_id);
	if (datafromService1.statusCode === CONSTANTS.SUCCESS) {
		if (datafromService1.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
			let requestData = {
				user_id,
				parent_id,
				description,
				statement_type: CONSTANTS.ACCOUNT_STATEMENT_TYPE_CHIPINOUT,
				amount,
				userCurrentBalance: datafromService1.data.balance,
				crdr
			};
			if (amount > datafromService1.data.balance && crdr === CONSTANTS.DEBIT_TWO) {
				return apiSuccessRes(req, res, 'Insufficient Credit Limit !');
			}
			let createParentAccountStatement = await accountStatementsservice.createAccStatementAndUpdateBalance(requestData);
			if (createParentAccountStatement.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'Credit Limit Updated Successfully');
			} else {
				return apiSuccessRes(req, res, 'Error to update credit limit !');
			}
		} else {

			let parentUserDetails = await serviceUser.getUserById(parent_id);
			if (parentUserDetails.statusCode === CONSTANTS.SUCCESS) {
				let requestData = {
					user_id,
					parent_id,
					parentOfParentId: parentUserDetails.data.parent_id,
					description,
					statement_type: CONSTANTS.ACCOUNT_STATEMENT_TYPE_CHIPINOUT,
					amount,
					userCurrentBalance: datafromService1.data.balance,
					parentCurrentBalance: parentUserDetails.data.balance,
					crdr
				};

				if (amount > datafromService1.data.balance && crdr === CONSTANTS.DEBIT_TWO) {
					return apiSuccessRes(req, res, 'Insufficient Credit Limit !');
				}else if (amount > parentUserDetails.data.balance && crdr === CONSTANTS.CREDIT_ONE) {
					return apiSuccessRes(req, res, 'Insufficient Credit Limit !');
				}else {
					let createParentAccountStatement = await accountStatementsservice.createAccStatementAndUpdateBalanceParentAndUser(requestData,datafromService1);
					if (createParentAccountStatement.statusCode === CONSTANTS.SUCCESS) {
						return apiSuccessRes(req, res, 'Credit Limit Updated Successfully');
					} else {
						return apiSuccessRes(req, res, 'Error to update credit limit !');
					}
				}

			} else {
				return apiSuccessRes(req, res, 'Parent details not found !');
			}
		}
	} else {
        //errorlog.error('Error to update credit limit. UserId not found. user_id : ',user_id);
        return apiSuccessRes(req, res, 'Error to update credit limit !');
	}

}

async function getProfitLoss(req, res) {

	try {
		let {
			from_date,
			to_date,
			user_id,
			offset,
			limit
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_id: Joi.number().required(),
			from_date: Joi.number().required(),
			to_date: Joi.number().required(),
			offset: Joi.number().required(),
			limit: Joi.number().required(),
			pdf_download: Joi.optional()

		});

		try {
			await createSeriesSchema.validate(req.body, {
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
			} else if (loginUserData.sub_admin_roles.indexOf("profit_loss_by_match_sub_menu") == -1) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		let getUserByUserId = await serviceUser.getUserByUserId([req.body.userid]);

		if (getUserByUserId.statusCode !== CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'account not get successfully.', []);


		} else {

			req.body['user_type'] = getUserByUserId.data.user_type_id;

			let marketData = await accountStatementsservice.getProfitLoss(req.body);
				if (marketData.statusCode != CONSTANTS.SUCCESS) {
					return apiSuccessRes(req, res, 'profit Loss not gets.', []);
				} else {

					return apiSuccessRes(req, res, 'ProfitLoss get  successfully', marketData.data);
				}
			}

	} catch (e) {
		logger.errorlog.error("getProfitLoss",e);
		//errorlog.error('Error in getProfitLoss controller ',e);
		return apiErrorRes(req, res, 'Error to create chipInOut.');
	}
}


async function accountSatement(req, res) {

	try {
		let { pdf_download
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_id: Joi.number().required(),
			user_type_id: Joi.number().required(),
			from_date: Joi.string().required(),
			to_date: Joi.string().required(),
			pageno: Joi.number().required(),
			is_download: Joi.optional(),
			pdf_download: Joi.optional(),
			filter: Joi.optional()
		});

		try {
			await createSeriesSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			//errorlog.error('Parameter validation error.  ',error);
			return apiErrorRes(req, res, error.details[0].message);
		}
		// subadmin permission work
		let loginUserData = userModel.getUserData();
		if (loginUserData.hasOwnProperty('sub_admin_roles')) {
			if (loginUserData.sub_admin_roles.length == 0) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			} else if (loginUserData.sub_admin_roles.indexOf("account_statement_sub_menu") == -1) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let marketData = await accountStatementsservice.getAccountStatement(req.body);

		// pdf download work
		if (pdf_download == 1) {
			let pdfName = 'Statement' + Date.now();

			let fileData = [];
			for (var i = 0; i < marketData.data.list.length; i++) {
				let placed=new Date(marketData.data.list[i].date*1000);
				
				let val = {
					"date": placed.toDateString()+" "+placed.toLocaleTimeString(),
					"username": marketData.data.list[i].user_name,
					"narration": marketData.data.list[i].description,
					"creditordebit": marketData.data.list[i].credit_debit,
					"balance": marketData.data.list[i].balance
				};
				fileData.push(val);
			}

			let tabledata = [
				{
					id: 'date',
					header: 'Date',
					width: 70,
					align: 'center'
				},
				{
					id: 'username',
					header: 'Username',
					width: 70,
					align: 'center'
				},
				{
					id: 'narration',
					header: 'Narration',
					width: 150,
					align: 'center'
				},
				{
					id: 'creditordebit',
					header: 'CreditOrDebit',
					width: 70,
					align: 'center'
				},
				{
					id: 'balance',
					header: 'Balance',
					width: 70,
					align: 'center'
				}
			];

			globalFunction.printPDF(req, res, pdfName, tabledata, fileData);
		} else {
			if (marketData.statusCode == CONSTANTS.SUCCESS && marketData.data.list.length > 0) {
				let data = marketData.data.list.reduce((a, b) => ({ balanceSum: a.balance + b.balance, creditDebitSum: a.credit_debit + b.credit_debit }));
				return apiSuccessRes(req, res, 'Account statement successfully', { ...marketData.data, ...data });
			} else {
				return apiSuccessRes(req, res, 'Data not found.');
			}
		}
	} catch (e) {
		logger.errorlog.error("accountSatement",e);
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}


async function accountDetails(req, res) {

	try {
		let {
			match_id,
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			match_id: Joi.string().required(),


		});

		try {
			await createSeriesSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			//errorlog.error('Parameter validation error in accountDetails  ',error);
			return apiErrorRes(req, res, error.details[0].message);
		}

		// subadmin permission work
		let loginUserData = userModel.getUserData();
		if (loginUserData.hasOwnProperty('sub_admin_roles')) {
			if (loginUserData.sub_admin_roles.length == 0) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			} else if (loginUserData.sub_admin_roles.indexOf("view_account") == -1) {
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let getUserByUserId = await serviceUser.getUserByUserId([req.body.userid]);

		if (getUserByUserId.statusCode !== CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'account not get successfully.', []);


		} else {

			let user_type = getUserByUserId.data.user_type_id;
			let reqObj = {

				user_type: user_type,
				user_id: req.body.userid,
				match_id: match_id
			};
			let marketData = await accountStatementsservice.getAccountDetails(reqObj);

			if (marketData.statusCode == CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'account details get  successfully', marketData.data);
			} else {
				return apiSuccessRes(req, res, 'account details not not get successfully.', []);
			}
		}
	} catch (e) {
		logger.errorlog.error("accountDetails",e);
		return apiErrorRes(req, res, 'Error in accountDetails ');
	}
}


async function chipInOutStatement(req, res) {

	try {
		let {
			from_date,
			to_date,
			user_id,
			page
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_id: Joi.number().required(),
			from_date: Joi.optional(),
			to_date: Joi.optional(),
			page: Joi.number().required()
		});

		try {
			await createSeriesSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			//errorlog.error('Parameter validation error in chipInOutStatement  ',error);
			return apiErrorRes(req, res, error.details[0].message);
		}

		let returnData = await accountStatementsservice.chipInOutStatement(req.body);

		let finalData = {};
		if (page == 1) {
			finalData = { "limit": CONSTANTS.LIMIT, "total": returnData.data[1][0].total, "data": returnData.data[0] };
		} else {
			finalData = { "limit": CONSTANTS.LIMIT, "total": 0, "data": returnData.data[0] };
		}
		return apiSuccessRes(req, res, 'SUCCESS', finalData);
	} catch (e) {
		logger.errorlog.error("chipInOutStatement",e);
		return apiErrorRes(req, res, 'Error in chipInOutStatement');
	}
}


router.post('/chipInOut', chipInOut);
router.post('/getProfitLoss', getProfitLoss);
router.post('/accountSatement', accountSatement);
router.post('/accountDetails', accountDetails);
router.post('/accountStatement/chipInOutStatement', chipInOutStatement);

module.exports = router;
