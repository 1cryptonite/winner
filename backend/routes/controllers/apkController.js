const express = require('express');
const router = express.Router();
const apiService = require('../services/apkService');
const userModel = require('../model/userModel');
const globalFunction = require('../../utils/globalFunction');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const settings = require('../../config/settings');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const logger = require('../../utils/logger');
const Joi = require('joi');



async function updateApkVersion(req, res)
{
    try {
        if (!req.files) {
            return apiErrorRes(req, res, 'Enter valid params !');
        } else {
            let {
                user_id,
                apk_name,
                apk_version,
                is_active,
                message
            } = req.body;
            let fileApk = req.files.fileApk;
            const createFancySchema = Joi.object({
                userid: Joi.number().required(),
                parent_ids: Joi.optional().required(),
                user_id: Joi.number().required(),
                apk_name: Joi.optional().required(),
                apk_version: Joi.optional().required(),
                is_active: Joi.optional().required(),
                message: Joi.optional().required()
            });
            try {
                await createFancySchema.validate(req.body, {
                    abortEarly: true
                });
            } catch (error) {
                return apiErrorRes(req, res, error.details[0].message);
            }
            if (fileApk.mimetype == 'application/vnd.android.package-archive') {
                let returnData = await apiService.updateApkVersion(user_id, apk_name, apk_version, is_active, message);
                if (returnData.statusCode === CONSTANTS.SUCCESS) {
                    await fileApk.mv(settings.filePath + "/app.apk");
                    let response_data = {
                        "apk_name":apk_name,
                        "apk_version":apk_version,
                        "is_active":is_active,
                        "message":message,
                        "apk_link":settings.filePath+"/app.apk"
                    };
                    return apiSuccessRes(req, res, 'File uploaded successfully.',response_data);
                } else {
                    return apiErrorRes(req, res, 'File upload failed !');
                }
            } else {
                return apiErrorRes(req, res, 'Invalid file type !');
            }
        }
    } catch (e) {
        logger.errorlog.error("updateApkVersion",e);
        return apiErrorRes(req, res, 'File upload failed !');
    }
}

async function getApkData(req, res)
{
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
            }else if(loginUserData.sub_admin_roles.indexOf("apk_setting_sub_menu")==-1){
                return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
            }
        }

        let returnData = await apiService.getApkData();
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Success', returnData.data);
        } else {
            return apiErrorRes(req, res, 'Data not available !');
        }
    } catch (e) {
        logger.errorlog.error("getApkData",e);
        return apiErrorRes(req, res, 'Error to get data !');
    }
}

async function changeIsActiveStatus(req, res)
{
    try {
        let {
            is_active
        } = req.body;
        const createFancySchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            is_active: Joi.optional().required()
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
            }else if(loginUserData.sub_admin_roles.indexOf("apk_status")==-1){
                return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
            }
        }

        let returnData = await apiService.changeIsActiveStatus(is_active);
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, "Status updated successfully");
        } else {
            return apiSuccessRes(req, res, "Error to update status !");
        }
    } catch (e) {
        logger.errorlog.error("changeIsActiveStatus",e);
    }
}

router.post('/apk/updateApkVersion', updateApkVersion);
router.get('/apk/getApkData', getApkData);
router.post('/apk/changeIsActiveStatus', changeIsActiveStatus);
module.exports = router;
