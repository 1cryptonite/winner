const express = require('express');
const router = express.Router();
const Joi = require('joi');
const globalFunction = require('../../utils/globalFunction');
const reportService = require('../../routes/services/reportService');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const userService = require('../services/userService');
const userModel = require('../../routes/model/userModel');

let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;

async function profitLossMatchWise(req, res) {

	try {
		let {
			user_id,
            user_type_id,
            sport_id,
            to_date,
            from_date,
			match_id,market_id,
			pdf_download
			
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
            user_type_id: Joi.number().required(),
            user_id: Joi.number().required(),
            sport_id: Joi.string().required(),
            match_id: Joi.string().required(),
            market_id: Joi.string().required(),
            to_date: Joi.string().required(),
			from_date: Joi.string().required(),
			pdf_download: Joi.optional(),
			

		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});
        // subadmin permission work
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("profit_loss_by_match_sub_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let profitLossData = await reportService.profitLossMatchWise(user_id,user_type_id,sport_id,match_id,market_id,to_date,from_date);
		//console.log("checkdev",profitLossData.data.length)
		// pdf download work
if (pdf_download == 1) {
	let pdfName = 'profitLossMatchWise' + Date.now();
	//console.log('uuuuu',profitLossData.data.length);
	let fileData = [];
	for (var i = 0; i < profitLossData.data.length; i++) {
		// console.log('yyyyy',profitLossData.data[i]);
		let val = {
			"UID":profitLossData.data[i].reffered_name,
			"STAKE": profitLossData.data[i].stack,
			"PLAYER P/L": profitLossData.data[i].player_p_l,
			"DOWNLINE": profitLossData.data[i].downline_p_l,
			"COMM.": profitLossData.data[i].super_comm,
			"CASINO COMM.": profitLossData.data[i].super_admin_commission,	
			"PDC": profitLossData.data[i].pdc_pl,
			"UPLINE P/L": profitLossData.data[i].upline_p_l
		};
		fileData.push(val);
	}

	let tabledata = [
		{
			id: 'UID',
			header: 'UID',
			width: 120,
			align: 'center'
		},
		{
			id: 'STAKE',
			header: 'STAKE',
			width: 50,
			align: 'center'
		},
		{
			id: 'PLAYER P/L',
			header: 'PLAYER P/L',
			width: 70,
			align: 'center'
		},
		{
			id: 'DOWNLINE',
			header: 'DOWNLINE',
			width: 70,
			align: 'center'
		},
		{
			id: 'COMM.',
			header: 'COMM.',
			width: 40,
			align: 'center'
		},{
			id: 'CASINO COMM.',
			header: 'CASINO COMM.',
			width: 70,
			align: 'center'
		},{
			id: 'PDC',
			header: 'PDC',
			width: 30,
			align: 'center'
		},{
			id: 'UPLINE P/L',
			header: 'UPLINE P/L',
			width: 50,
			align: 'center'
		}
	];

	globalFunction.printPDF(req, res, pdfName, tabledata, fileData);
} else {

		if (profitLossData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'success', profitLossData.data);
		} else {
			return apiSuccessRes(req, res, 'not found data');
		}}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function profitLossUpline(req, res) {

    try {
        let {
            user_id,
            user_type_id,
            to_date,
			from_date,
			pdf_download
			
        } = req.body;

        const createSeriesSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            user_type_id: Joi.number().required(),
            user_id: Joi.number().required(),
            to_date: Joi.string().required(),
			from_date: Joi.string().required(),
			pdf_download: Joi.optional()
			
        });

        await createSeriesSchema.validate(req.body, {
            abortEarly: true
        });
        // subadmin permission work
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("profit_loss_by_upline_sub_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

        let profitLossData = await reportService.profitLossUpline(user_id,user_type_id,to_date,from_date);
// pdf download work
if (pdf_download == 1) {
	let pdfName = 'profitLossUpline' + Date.now();

	let fileData = [];
	for (var i = 0; i < profitLossData.data.length; i++) {
		let val = {
			"UID": profitLossData.data[i].name+"("+profitLossData.data[i].user_name+")",
			"STAKE": profitLossData.data[i].stack,
			"PLAYER P/L": profitLossData.data[i].player_p_l,
			"DOWNLINE": profitLossData.data[i].downline_p_l,
			"COMM.": profitLossData.data[i].super_comm,
			"CASINO COMM.": profitLossData.data[i].super_admin_commission,
			"PDC": profitLossData.data[i].pdc_pl,
			"UPLINE P/L": profitLossData.data[i].upline_p_l
		};
		fileData.push(val);
	}

	let tabledata = [
		{
			id: 'UID',
			header: 'UID',
			width: 70,
			align: 'center'
		},
		{
			id: 'STAKE',
			header: 'STAKE',
			width: 50,
			align: 'center'
		},
		{
			id: 'PLAYER P/L',
			header: 'PLAYER P/L',
			width: 70,
			align: 'center'
		},
		{
			id: 'DOWNLINE',
			header: 'DOWNLINE',
			width: 70,
			align: 'center'
		},
		{
			id: 'COMM.',
			header: 'COMM.',
			width: 50,
			align: 'center'
		},{
			id: 'CASINO COMM.',
			header: 'CASINO COMM.',
			width: 70,
			align: 'center'
		},{
			id: 'PDC',
			header: 'PDC',
			width: 50,
			align: 'center'
		},{
			id: 'UPLINE P/L',
			header: 'UPLINE P/L',
			width: 50,
			align: 'center'
		}
	];

	globalFunction.printPDF(req, res, pdfName, tabledata, fileData);
} else {
    let getUserById = await userService.getUserById(user_id);
	let finalData = { "user_id": user_id, parent_user_type_id: getUserById.data.parent_user_type_id, "parent_id": getUserById.data.parent_id, data : profitLossData.data};

        if (profitLossData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'success', finalData);
        } else {
            return apiSuccessRes(req, res, 'not found data');
        }}
    } catch (e) {
        return apiErrorRes(req, res, 'Enter valid param!', e);
    }
}

async function profitLossUplineBySport(req, res) {

    try {
        let {
        	parent_id,
            user_id,
            user_type_id,
            to_date,
			from_date
        } = req.body;

        const createSeriesSchema = Joi.object({
        	parent_id: Joi.number().required(),
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            user_type_id: Joi.number().required(),
            user_id: Joi.number().required(),
            to_date: Joi.string().required(),
			from_date: Joi.string().required(),
        });

        await createSeriesSchema.validate(req.body, {
            abortEarly: true
        });

        let profitLossData = await reportService.profitLossUplineBySport(user_id,user_type_id,to_date,from_date,parent_id);

        if (profitLossData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'success', profitLossData.data);
        } else {
            return apiSuccessRes(req, res, 'not found data');
        }
    } catch (e) {
        return apiErrorRes(req, res, 'Enter valid param!', e);
    }
}

async function settlementReport(req, res) {

	try {
		let {
			user_id,
			user_type_id,
			search
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_type_id: Joi.number().required(),
			user_id: Joi.number().required(),
			search: Joi.optional()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});
        // subadmin permission work
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("settlement_sub_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let getUserById = await userService.getUserById(user_id);
		let parent_id = '';
		let parent_user_type_id = '';
		if (getUserById.statusCode === CONSTANTS.SUCCESS) {
			parent_id = getUserById.data.parent_id;
			let getParentUserById = await userService.getUserById(parent_id);
			if (getParentUserById.statusCode === CONSTANTS.SUCCESS) {
				parent_user_type_id = getParentUserById.data.user_type_id;
			}
		}

		let ownData = await reportService.ownDataInSettlementReport(user_id, user_type_id);

		let finalData = {"user_id": user_id, "user_type_id": user_type_id, "parent_id": parent_id, "parent_user_type_id": parent_user_type_id, "plusData": ownData.data.plusData, "minusData": ownData.data.minusData, "data_receiving_from" : [], "data_paid_to" : []};

		let totalPlus = ownData.data.totalPlus;
		let totalMinus = Math.abs(ownData.data.totalMinus);

		let returnData = await reportService.settlementReport(user_id, user_type_id, search);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {

			//finalData.data_receiving_from = returnData.data;
			//finalData.data_paid_to = returnData.data;
			for (let i in returnData.data){
				let element = returnData.data[i];

				if(element.settlement_amount > 0){
					totalMinus = totalMinus + element.settlement_amount;
					element.settlement_amount = element.settlement_amount.toFixed(2);
					finalData.data_receiving_from.push(element);
				}else{
					element.settlement_amount = Math.abs(element.settlement_amount);
					totalPlus = totalPlus + element.settlement_amount;
					element.settlement_amount = element.settlement_amount.toFixed(2);
					finalData.data_paid_to.push(element);
				}
			}
		}
		finalData.totalPlus = totalPlus.toFixed(2);
		finalData.totalMinus = totalMinus.toFixed(2);
		return apiSuccessRes(req, res, 'SUCCESS', finalData);
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function makeSettlement(req, res) {

	try {
		let {
			user_id,
			user_type_id,
			parent_id,
			amount,
			type,
			comment
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_type_id: Joi.number().required(),
			user_id: Joi.number().required(),
			parent_id: Joi.number().required(),
			amount: Joi.number().greater(0).required(),
			type: Joi.number().valid(1, 2).required(),
			comment: Joi.optional()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let getUserData = await userService.getUserById(user_id);
		let getParentData = await userService.getUserById(parent_id);

		
		if (getUserData.statusCode === CONSTANTS.SUCCESS) {

			if(getUserData.data.self_lock_settlement == '0' && getUserData.data.parent_lock_settlement == '0') {

				if (type == 1 && comment == '') {
					comment = 'Cash recevied from ('+getParentData.data.user_name+') ';		
					parent_comment = 'Cash given to ('+getUserData.data.user_name+') ';									
				//	comment = 'Cash Debit';
				} else if (type == 2 && comment == '') {
				//	comment = 'Cash Credit'; 
					comment = 'Cash given to ('+getParentData.data.user_name+') ';	
					parent_comment = 'Cash recevied from ('+getUserData.data.user_name+') ';				
				}

				let returnData = await reportService.makeSettlement(user_id, user_type_id, parent_id, amount, type, comment,parent_comment);

				if (returnData.statusCode === CONSTANTS.SUCCESS) {
					return apiSuccessRes(req, res, returnData.data);
				} else {
					return apiErrorRes(req, res, returnData.data);
				}
			} else {
				return apiErrorRes(req, res, 'Settlement Locked !');
			}
		} else {
			return apiErrorRes(req, res, 'Invalid User !');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function settlementCollectionHistory(req, res) {

	try {
		let {
			user_id,
			user_type_id,
			parent_id,
			page,
			opening_balance
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_type_id: Joi.number().required(),
			user_id: Joi.number().required(),
			parent_id: Joi.number().required(),
			page: Joi.number().required(),
			opening_balance: Joi.number().required()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let returnData = await reportService.settlementCollectionHistory(user_id, user_type_id, parent_id, page, opening_balance);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			let finalData = {};
			if(page == 1){
				finalData = {"limit" : CONSTANTS.LIMIT, "total" : returnData.data[1][0].total, "opening_balance" : returnData.data[2].opening_balance, "data" : returnData.data[0]};
			}else{
				finalData = {"limit" : CONSTANTS.LIMIT, "total" : 0, "opening_balance" : returnData.data[2].opening_balance, "data" : returnData.data[0]};
			}
			return apiSuccessRes(req, res, 'SUCCESS', finalData);
		} else {
			return apiSuccessRes(req, res, 'not found data');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function deleteSettlement(req, res) {

	try {
		let {
			userid,
			settlement_id,
			password
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			settlement_id: Joi.number().required(),
			password: Joi.optional().required()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		/*let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;

		if(user_type_id === CONSTANTS.USER_TYPE_ADMIN){*/

			let getUserDetails = await userService.verifyUser(userid, password);
			if (getUserDetails.statusCode === CONSTANTS.SUCCESS) {

				let returnData = await reportService.deleteSettlement(settlement_id);

				if (returnData.statusCode === CONSTANTS.SUCCESS) {
					return apiSuccessRes(req, res, returnData.data);
				} else {
					return apiErrorRes(req, res, returnData.data);
				}

			} else {
				return apiErrorRes(req, res, 'Un-authorized user !');
			}

		/*}else{
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}*/

	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function superAdminCommissionDetail(req, res) {
	try {
		let {
			page
		} = req.body;

		const createSeriesSchema = Joi.object({
			page: Joi.number().required()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});
        // subadmin permission work
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("casino_commission_sub_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
			}
		}

		let returnData = await reportService.superAdminCommissionDetail(page);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'SUCCESS', returnData.data);
		} else {
			return apiErrorRes(req, res, returnData.data);
		}

	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function makeSuperAdminCommissionSettlement(req, res) {

	try {
		let {
			amount,
			comment
		} = req.body;

		const createSeriesSchema = Joi.object({
			amount: Joi.number().greater(0).required(),
			comment: Joi.optional()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let returnData = await reportService.makeSuperAdminCommissionSettlement(amount, comment);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, returnData.data);
		} else {
			return apiErrorRes(req, res, returnData.data);
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function deleteSuperAdminCommissionSettlement(req, res) {

	try {
		let {
			super_admin_commission_settlement_id
		} = req.body;

		const createSeriesSchema = Joi.object({
			super_admin_commission_settlement_id: Joi.number().required()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let returnData = await reportService.deleteSuperAdminCommissionSettlement(super_admin_commission_settlement_id);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, returnData.data);
		} else {
			return apiErrorRes(req, res, returnData.data);
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function settlementHistoryByParent(req, res) {

	try {
		let {
			user_id,
			page
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_id: Joi.number().required(),
			page: Joi.number().required()
		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let returnData = await reportService.settlementHistoryByParent(user_id, page);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'SUCCESS', returnData.data);
		} else {
			return apiSuccessRes(req, res, 'not found data');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

async function fancyStackUserWise(req, res) {

	try {
		let {
			user_type_id,userid
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			user_type_id: Joi.number().required(),

		});

		await createSeriesSchema.validate(req.body, {
			abortEarly: true
		});

		let returnData = await reportService.fancyStackUserWise(user_type_id,userid);

		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'SUCCESS', returnData.data);
		} else {
			return apiSuccessRes(req, res, 'not found data');
		}
	} catch (e) {
		return apiErrorRes(req, res, 'Enter valid param!', e);
	}
}

router.post('/report/profitLossMatchWise', profitLossMatchWise);
router.post('/report/profitLossUpline', profitLossUpline);
router.post('/report/profitLossUplineBySport', profitLossUplineBySport);
router.post('/report/settlementReport', settlementReport);
router.post('/report/makeSettlement', makeSettlement);
router.post('/report/settlementCollectionHistory', settlementCollectionHistory);
router.post('/report/deleteSettlement', deleteSettlement);
router.post('/report/superAdminCommissionDetail', superAdminCommissionDetail);
router.post('/report/makeSuperAdminCommissionSettlement', makeSuperAdminCommissionSettlement);
router.post('/report/deleteSuperAdminCommissionSettlement', deleteSuperAdminCommissionSettlement);
router.post('/report/settlementHistoryByParent', settlementHistoryByParent);
router.post('/report/fancyStackUserWise', fancyStackUserWise);

module.exports = router;
