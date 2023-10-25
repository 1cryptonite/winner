const express = require('express');
const router = express.Router();
const apiService = require('../services/apiService');
const globalFunction = require('../../utils/globalFunction');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const settings = require('../../config/settings');
const CONSTANTS = require('../../utils/constants');
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

async function getApiData(req, res)
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

        let returnData = await apiService.getApiData();
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Success', returnData.data);
        } else {
            return apiErrorRes(req, res, 'Data not available !');
        }
    } catch (e) {
        logger.errorlog.error("getApiData",e);
        return apiErrorRes(req, res, 'Error to get data !');
    }
}

router.post('/api/updateApkVersion', updateApkVersion);
router.get('/api/getApiData', getApiData);
module.exports = router;
