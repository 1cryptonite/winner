const express = require('express');
const router = express.Router();
const marketsService = require('../services/marketsService');
const globalFunction = require('../../utils/globalFunction');
const logger = require('../../utils/logger');
let apiSuccessRes = globalFunction.apiSuccessRes;


let apiErrorRes = globalFunction.apiErrorRes;
const CONSTANTS = require('../../utils/constants');

const Joi = require('joi');

async function teenPattiMarketResult(req, res)
{
    try {
        let {
            market_id
        } = req.body;
        const createFancySchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            market_id: Joi.optional().required()
        });
        try {
            await createFancySchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let returnData = await marketsService.marketResultDetailsByMarketId(market_id);

        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, "successfully",returnData.data);
        } else {
            return apiSuccessRes(req, res, "Error to update status !");
        }
    } catch (e) {
        logger.errorlog.error("teenPattiMarketResult",e);
    }
}

async function marketResultListByMatchId(req, res)
{
    try {
        let {
            match_id
        } = req.body;
        const createFancySchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            match_id: Joi.optional().required()
        });
        try {
            await createFancySchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let returnData = await marketsService.marketResultListByMatchIdWithOutPagination(match_id);

        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, "successfully",returnData.data);
        } else {
            return apiSuccessRes(req, res, "Error to update status !");
        }
    } catch (e) {
        logger.errorlog.error("marketResultListByMatchId",e);
    }
}

async function marketResultListByMatchIdWithOutPagination(req, res)
{
    try {
        let {
            match_id,pageno,date,market_id
        } = req.body;
        const createFancySchema = Joi.object({
            userid: Joi.number().required(),
            pageno: Joi.optional().required(),
            parent_ids: Joi.optional().required(),
            date: Joi.optional(),
            match_id: Joi.optional().required(),
            market_id: Joi.optional()
        });
        try {
            await createFancySchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let data={
            pageno,match_id,date,market_id
        };

        let returnData = await marketsService.marketResultListByMatchId(data);

        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, "successfully",returnData.data);
        } else {
            return apiSuccessRes(req, res, "Error to update status !");
        }
    } catch (e) {
        logger.errorlog.error("marketResultListByMatchIdWithOutPagination",e);
    }
}


router.post('/result/teenPattiMarketResult', teenPattiMarketResult);
router.post('/result/marketResultListByMatchId', marketResultListByMatchId);
router.post('/result/marketResultListByMatchIdWithOutPagination', marketResultListByMatchIdWithOutPagination);
module.exports = router;
