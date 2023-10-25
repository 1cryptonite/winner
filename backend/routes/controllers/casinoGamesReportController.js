const express = require('express');
const router = express.Router();
const Joi = require('joi');
const casinoGamesReportService = require('../services/casinoGamesReportService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const logger = require('../../utils/logger');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;

async function plReport(req, res) {
    try {
        let {
            user_id,
            user_type_id,
            game_type,
            from_date,
            to_date,
            page
        } = req.body;

        const inputSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            user_type_id: Joi.number().required(),
            user_id: Joi.number().required(),
            game_type: Joi.string().required(),
            from_date: Joi.optional(),
            to_date: Joi.optional(),
            page: Joi.number().required()
        });

        await inputSchema.validate(req.body, {
            abortEarly: true
        });

        let returnData = await casinoGamesReportService.plReport(user_id, user_type_id, game_type, from_date, to_date, page);

        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            let finalData = {"limit" : CONSTANTS.LIMIT, "total" : 0, "data" : returnData.data[0]};
            if(page == 1){
                finalData.total = returnData.data[1][0].total;
            }
            return apiSuccessRes(req, res, 'SUCCESS', finalData);
        } else {
            return apiErrorRes(req, res, 'An Error Occurred !');
        }
    } catch (e) {
        logger.errorlog.error("plReport",e);
        return apiErrorRes(req, res, 'An Error Occurred !', e);
    }
}

router.post('/casinoGamesReport/plReport', plReport);

module.exports = router;
