const express = require('express');
const router = express.Router();
const Joi = require('joi');
// const axios = require('axios');
// const settings = require('../../config/settings');
const notificationService = require('../services/notificationService');
const serviceUser = require('../services/userService');
const userModel = require('../model/userModel');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const logger = require('../../utils/logger');
const errorlog = logger.errorlog;
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;


async function saveNotification(req, res) {
	try {
		let {
			message
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			message: Joi.optional().required()
		});

		try {
			await createSeriesSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let datafromService1 = await serviceUser.getUserById(req.body.userid);
		if (datafromService1.statusCode === CONSTANTS.SUCCESS) {
			if (datafromService1.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
				let returnData = await notificationService.saveNotification(message);
				return apiSuccessRes(req, res, 'SUCCESS');
			}else {
				return apiErrorRes(req, res, 'Un-Authorised Access !');
			}
		}else{
			return apiErrorRes(req, res, 'Un-Authorised Access ! !');
		}
	} catch (e) {
		logger.errorlog.error("saveNotification",e);
		return apiErrorRes(req, res, 'Error in save notification !');
	}
}

async function updateNotificationStatus(req, res) {

	//status 0=Inactive, 1=Active, 2=Permanent delete from database
	try {
		let {
			id,
			status
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			id: Joi.number().required(),
			status: Joi.optional().valid('0', '1', '2').required()
		});

		try {
			await createSeriesSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let datafromService1 = await serviceUser.getUserById(req.body.userid);
		if (datafromService1.statusCode === CONSTANTS.SUCCESS) {
			if (datafromService1.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
				let returnData = await notificationService.updateNotificationStatus(id, status);
				let msg = 'Invalid status !';
				if(status == '0'){
					msg = 'Notification Deactivated';
				}
				else if(status == '1'){
					msg = 'Notification Activated';
				}
				else if(status == '2'){
					msg = 'Notification Deleted';
				}
				return apiSuccessRes(req, res, msg);
			}else {
				return apiErrorRes(req, res, 'Un-Authorised Access !');
			}
		}else{
			return apiErrorRes(req, res, 'Un-Authorised Access ! !');
		}
	} catch (e) {
		logger.errorlog.error("updateNotificationStatus",e);
		return apiErrorRes(req, res, 'Error in save notification !');
	}
}

async function getAllNotifications(req, res) {
	try {
		let {
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required()
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
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("notification_menu")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		let datafromService1 = await serviceUser.getUserById(req.body.userid);
		if (datafromService1.statusCode === CONSTANTS.SUCCESS) {
			if (datafromService1.data.user_type_id === CONSTANTS.USER_TYPE_ADMIN) {
				let returnData = await notificationService.getAllNotifications();
				return apiSuccessRes(req, res, 'SUCCESS', returnData.data);
			}else {
				return apiErrorRes(req, res, 'Un-Authorised Access !');
			}
		}else{
			return apiErrorRes(req, res, 'Un-Authorised Access ! !');
		}
	} catch (e) {
		logger.errorlog.error("getAllNotifications",e);
		return apiErrorRes(req, res, 'Error in save notification !');
	}
}

async function getAllActiveNotifications(req, res) {
	try {
		let {
			isReadStatus,
			userid
		} = req.body;

		const createSeriesSchema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.optional().required(),
			isReadStatus: Joi.optional()
		});

		try {
			await createSeriesSchema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}

		let returnData = await notificationService.getAllActiveNotifications(userid, isReadStatus);
		return apiSuccessRes(req, res, 'SUCCESS', returnData.data);

	} catch (e) {
		logger.errorlog.error("getAllActiveNotifications",e);
		return apiErrorRes(req, res, 'Error in save notification !');
	}
}

router.post('/notifications/saveNotification', saveNotification);
router.post('/notifications/updateNotificationStatus', updateNotificationStatus);
router.post('/notifications/getAllNotifications', getAllNotifications);
router.post('/notifications/getAllActiveNotifications', getAllActiveNotifications);

module.exports = router;
