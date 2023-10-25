const express = require('express');
const router = express.Router();
const Joi = require('joi');

const fs = require('fs');
const PDFDocument = require('pdfkit');
const PdfTable = require('voilab-pdf-table');

//const pdf = require('html-pdf');

const globalSettingService = require('../services/globalSettingService');
const apiService = require('../services/apkService');
const settings = require('../../config/settings');
const userModel = require('../model/userModel');
const globalFunction = require('../../utils/globalFunction');
const loadGlobalSetting = require('../../utils/loadGlobalSetting');
const constants = require('../../utils/constants');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;



async function getGlobalSetting(req, res) {
	try {
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required()
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
			}else if(loginUserData.sub_admin_roles.indexOf("global_setting_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		let globalList = await globalSettingService.getGlobalSetting();
		if (globalList.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'globalsetting get successfully', globalList.data);
		} else {
			return apiSuccessRes(req, res, 'Error to get Fancy.');
		}
	} catch (e) {
		logger.errorlog.error("getGlobalSetting",e);
 	}
}

async function checkMaintenanceSetting(req, res) {
    try {

        if (global._config.site_under_maintenance=="1") {
            return apiErrorRes('Site Under Maintenance.',null,constants.SITE_UNDER_MAINTENANCE);
        } else {
            return apiSuccessRes(req, res, 'ok');
        }
    } catch (e) {
		logger.errorlog.error("checkMaintenanceSetting",e);
    }
}


async function updateGlobalSetting(req, res) {
	try {
		let {
			site_title,
			site_message,
			one_click_stack,
			match_stack,
			session_stack,
			bet_allow_time_before,
			country_code,
			phone_no
		} = req.body;
		const createFancySchema = Joi.object({
			userid: Joi.number().required(), 		
			parent_ids: Joi.optional().required(),
			site_title: Joi.string().required(),
			site_message: Joi.string().required(),
			one_click_stack: Joi.string().required(),
			match_stack: Joi.string().required(),
			session_stack: Joi.string().required(),
			bet_allow_time_before: Joi.number().required(),
			country_code: Joi.optional().required(),
			phone_no: Joi.optional().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let reqParam = {
			site_title,
			site_message,
			one_click_stack,
			match_stack,
			session_stack,
			bet_allow_time_before,
			country_code,
			phone_no

		};

		let loginUserData = userModel.getUserData();
		let user_type_id = loginUserData.user_type_id;
		if(user_type_id !== CONSTANTS.USER_TYPE_ADMIN) {
			return apiErrorRes(req, res, 'Unauthorized Access !');
		}

		let globalList = await globalSettingService.updateGlobalSetting(reqParam);
		if (globalList.statusCode === CONSTANTS.SUCCESS) {
			await loadGlobalSetting();
			return apiSuccessRes(req, res, 'globalsetting update successfully');
		} else {
			return apiSuccessRes(req, res, 'Error to get Fancy.');
		}
	} catch (e) {
		logger.errorlog.error("updateGlobalSetting",e);
 	}
}

async function uploadSocialIcon(req, res) {
	try {

		if (!req.files) {
			return apiErrorRes(req, res, 'enter valid params!');
		} else {

			let fileImage = req.files.fileImage;

			const createFancySchema = Joi.object({
				userid: Joi.number().required(),
				parent_ids: Joi.optional().required(),
			});
			try {
				await createFancySchema.validate(req.body, {
					abortEarly: true
				});
			} catch (error) {
				return apiErrorRes(req, res, error.details[0].message);
			}

			let loginUserData = userModel.getUserData();
			let user_type_id = loginUserData.user_type_id;
			if(user_type_id !== CONSTANTS.USER_TYPE_ADMIN) {
				return apiErrorRes(req, res, 'Unauthorized Access !');
			}

			if (fileImage.mimetype == 'image/png') {
				let globalList = await globalSettingService.uploadSocialIcon('social_logo.png');
				if (globalList.statusCode === CONSTANTS.SUCCESS) {
					await fileImage.mv(settings.filePath + '/social_logo.png');
					return apiSuccessRes(req, res, 'file upload successfully');
				} else {
					return apiSuccessRes(req, res, 'Error to upload logo');
				}
			} else {
				return apiSuccessRes(req, res, 'image need  in png format');
			}
		}
	} catch (e) {
		logger.errorlog.error("uploadSocialIcon",e);
		return apiSuccessRes(req, res, 'Error to file upload.');
	}
}

async function uploadlogo(req, res) {
	try {
		if (!req.files) {
			return apiErrorRes(req, res, 'enter valid params!');
		} else {
			let fileImage = req.files.fileImage;
			const createFancySchema = Joi.object({
				userid: Joi.number().required(),
				parent_ids: Joi.optional().required(),
			});
			try {
				await createFancySchema.validate(req.body, {
					abortEarly: true
				});
			} catch (error) {
				return apiErrorRes(req, res, error.details[0].message);
			}

			let loginUserData = userModel.getUserData();
			let user_type_id = loginUserData.user_type_id;
			if(user_type_id !== CONSTANTS.USER_TYPE_ADMIN) {
				return apiErrorRes(req, res, 'Unauthorized Access !');
			}

			if (fileImage.mimetype == 'image/png') {
				let globalList = await globalSettingService.uploadImage('logo.png');
				if (globalList.statusCode === CONSTANTS.SUCCESS) {
					await fileImage.mv(settings.filePath + '/logo.png');
					return apiSuccessRes(req, res, 'file upload successfully');
				} else {
					return apiSuccessRes(req, res, 'Error to upload logo');
				}
			} else {
				return apiSuccessRes(req, res, 'image need  in png format');
			}
		}
	} catch (e) {
		logger.errorlog.error("uploadlogo",e);
		return apiSuccessRes(req, res, 'Error to file upload.');
	}
}
async function uploadfavicon(req, res) {
	try {
		if (!req.files) {
			return apiErrorRes(req, res, 'enter valid params!');
		} else {

			let faviconIcon = req.files.fileImage;
			const createFancySchema = Joi.object({
				userid: Joi.number().required(),
				parent_ids: Joi.optional().required(),

			});
			try {
				await createFancySchema.validate(req.body, {
					abortEarly: true
				});
			} catch (error) {

				return apiErrorRes(req, res, error.details[0].message);

			}

			let loginUserData = userModel.getUserData();
			let user_type_id = loginUserData.user_type_id;
			if(user_type_id !== CONSTANTS.USER_TYPE_ADMIN) {
				return apiErrorRes(req, res, 'Unauthorized Access !');
			}

			if (faviconIcon.mimetype == 'image/x-icon' || faviconIcon.mimetype == 'image/vnd.microsoft.icon') {

				let globalList = await globalSettingService.uploadfavicon('favicon.ico');

				if (globalList.statusCode === CONSTANTS.SUCCESS) {

					await faviconIcon.mv(settings.filePath + '/favicon.ico');

					return apiSuccessRes(req, res, 'file upload successfully');

				} else {
					return apiSuccessRes(req, res, 'Error to get Fancy.');
				}

			} else {
				return apiSuccessRes(req, res, 'image need  in ico format');

			}
		}
	} catch (e) {
		logger.errorlog.error("uploadfavicon",e);
	}
}
async function getGlobalMatchStack(req, res) {
	try {
		const createFancySchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required()
		});
		try {
			await createFancySchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let globalList = await globalSettingService.getGlobalSetting();
		if (globalList.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'match_stack get successfully', globalList.data[0].match_stack);
		} else {
			return apiSuccessRes(req, res, 'Error to get Fancy.');
		}
	} catch (e) {
		logger.errorlog.error("getGlobalMatchStack",e);
		return apiErrorRes(req, res, 'There are the error to get GlobalMatchStack');
	}
}

async function globalConstant(req, res) {
    try {
		let returnData = await apiService.getApkData();
		let ApkData = {};
		if(returnData.statusCode === CONSTANTS.SUCCESS){
			ApkData = returnData.data;
		}
    	let data = {
			theam_code: global._config.theam_code,
			phone_no: global._config.phone_no,
			country_code: global._config.country_code,
			site_title: global._config.site_title,
			super_admin_commission_type: CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE,
            ApkData: ApkData,
			is_pdc_charge:CONSTANTS.IS_PDC_CHARGE,
			is_pdc_distribute:CONSTANTS.IS_PDC_DISTRIBUTE,
			is_pdc_refund:CONSTANTS.IS_PDC_REFUND
		};
        return apiSuccessRes(req, res, 'Global Constant', data);
    } catch (e) {
		logger.errorlog.error("globalConstant",e);
		return apiErrorRes(req, res, 'Error to get data !');
    }
}


async function printPDF(req, res) {
	try {
		const doc = new PDFDocument();
		const table = new PdfTable(doc);
		let pdfName =  Date.now();
		//let filename = 'test.pdf';

		filename = encodeURIComponent(pdfName) + '.pdf';
		let pdfListData = await globalSettingService.printPDF();

		//console.log("checkdev",pdfListData)

		let fileData = [];

		for (var i = 0; i < pdfListData.data.length; i++) {

			let val = {name: pdfListData.data[i].name, username: pdfListData.data[i].user_name, mobile: pdfListData.data[i].user_type_id, ip: pdfListData.data[i].profit_loss};
			fileData.push(val);
		}

		// add some plugins (here, a 'fit-to-width' for a column)
		table.addPlugin(new (require('voilab-pdf-table/plugins/fitcolumn'))({
			column: 'name'
		}));
		// set defaults to your columns
		table.setColumnsDefaults({
			headerBorder: 'B',
			align: 'right'
		});
		// add table columns
		table.addColumns([
			{
				id: 'name',
				header: 'Name',
				align: 'left'
			},
			{
				id: 'username',
				header: 'Username',
				width: 70,
				align: 'left'
			},
			{
				id: 'user_type_id',
				header: 'User id',
				width: 150,
				align: 'left'
			},
			{
				id: 'profit_loss',
				header: 'Profit loss',
				width: 70,
				align: 'left'
			}
		]);

		// add events (here, we draw headers on each new page)

		table.onPageAdded(function (tb) {
			tb.addHeader();
		});
		table.addBody(fileData);
// Set the font size
doc.fontSize(4).fillColor('blue');
		doc.pipe(res);
		doc.end();
		res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
		res.setHeader('Content-type', 'application/text');
		return res.download(filename);

	} catch (e) {
		logger.errorlog.error("printPDF",e);
	}
}

router.get('/getGlobalSetting', getGlobalSetting);
router.post('/updateGlobalSetting', updateGlobalSetting);
router.post('/uploadSocialIcon', uploadSocialIcon);
router.post('/uploadlogo', uploadlogo);
router.post('/uploadfavicon', uploadfavicon);
router.post('/getGlobalMatchStack', getGlobalMatchStack);
router.get('/checkMaintenanceSetting', checkMaintenanceSetting);
router.get('/globalConstant', globalConstant);
router.get('/printPDF', printPDF);

module.exports = router;
