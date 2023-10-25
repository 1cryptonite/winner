const express = require('express');
const router = express.Router();
const Joi = require('joi');
const axios = require('axios');
const paymentApiService = require('../services/paymentApiService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const userModel = require('../../routes/model/userModel');
const logger = require('../../utils/logger');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
let apiSuccessResVirtualGame = globalFunction.apiSuccessResVirtualGame;
let apiErrorResVirtualGame = globalFunction.apiErrorResVirtualGame;

//PaymentRush API

/*
Input Structure:
{"amount": 100.00}
*/
async function getPaymentUrl(req, res) {
    let {
        userid,
        amount
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        amount: Joi.number().greater(0).required()
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return res.status(200).json({
            status: "Failed",
            reason: error.details[0].message
        });
    }

    let loginUserData = userModel.getUserData();
    if(loginUserData.user_type_id == 5) {
        let returnData = await paymentApiService.createPaymentOrder(userid, amount);
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            let requestData = {
                "order_id": returnData.data,
                "amount": amount,
                "environment": CONSTANTS.PAYMENT_RUSH_CALLBACK_URL,
                "me_id": CONSTANTS.PAYMENT_RUSH_ME_ID
            };

            let resultResponse = await axios.post(CONSTANTS.PAYMENT_RUSH_API_URL, requestData, {
                headers: {
                    "APIKey": CONSTANTS.PAYMENT_RUSH_API_KEY
                }
            });
            resultResponse = resultResponse.data;
            return res.status(200).json(resultResponse);
        }else{
            return res.status(200).json({
                status: "Failed",
                reason: returnData.data
            });
        }
    }else{
        return res.status(200).json({
            status: "Failed",
            reason: "Payment Not Allowed !"
        });
    }
}

async function paymentCallback(req, res) {
    /*request:-  { "order_id":"123" , "Status": "Successful", "amount": 15.00, "Txt_Ref": "xxxxxxxxxx"} 
    response success:-  {"status": "OK"}
    response success:-  {"status": "Failed"}
    */
    let requestObj = Object.assign({}, req.body);
    let returnData = await paymentApiService.paymentCallback(requestObj);
    return res.status(200).json(returnData);
}

/*
Input Structure:
{"amount": 100.00, "account_number": "564875", "ifsc": "jksdh", "beneficiary_name": "jksdh", "mobile": "13215546", "withdraw_reason": "jksdh"}
*/
async function submitWithdrawRequest(req, res) {
    let {
        userid,
        amount,
        account_number,
        ifsc,
        beneficiary_name,
        mobile,
        withdraw_reason
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        amount: Joi.number().greater(0).required(),
        account_number: Joi.string().required(),
        ifsc: Joi.string().required(),
        beneficiary_name: Joi.optional(),
        mobile: Joi.optional(),
        withdraw_reason: Joi.optional()
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let reqData = {
        userid,
        amount,
        account_number,
        ifsc,
        beneficiary_name,
        mobile,
        withdraw_reason
    };

    let loginUserData = userModel.getUserData();
    if(loginUserData.user_type_id == 5) {
        let returnData = await paymentApiService.submitWithdrawRequest(reqData);
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, returnData.data);
        }else{
            return apiErrorRes(req, res, returnData.data);
        }
    }else{
        return apiErrorRes(req, res, "Action Not Allowed !");
    }
}

/*
Input Structure:
{"order_id": 100, "reject_reason": "jksdh"}
*/
async function rejectWithdrawRequest(req, res) {
    let {
        userid,
        order_id,
        reject_reason
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        order_id: Joi.optional().required(),
        reject_reason: Joi.optional()
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let loginUserData = userModel.getUserData();
    if(loginUserData.user_type_id == CONSTANTS.USER_TYPE_ADMIN) {
        let returnData = await paymentApiService.rejectWithdrawRequest(order_id, reject_reason);
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, returnData.data);
        }else{
            return apiErrorRes(req, res, returnData.data);
        }
    }else{
        return apiErrorRes(req, res, "Action Not Allowed !");
    }
}

/*
Input Structure:
{"order_id": 100}
*/
async function acceptWithdrawRequest(req, res) {
    let {
        userid,
        order_id
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        order_id: Joi.optional().required()
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return res.status(200).json({
            status: "Failed",
            reason: error.details[0].message
        });
    }

    let loginUserData = userModel.getUserData();
    if(loginUserData.user_type_id == CONSTANTS.USER_TYPE_ADMIN) {
        let returnData = await paymentApiService.checkWithdrawRequest(order_id);
        if (returnData.statusCode === CONSTANTS.SUCCESS) {
            let requestData = {
                "order_id": order_id + "",
                "amount": returnData.data.amount,
                "environment": CONSTANTS.PAYMENT_RUSH_CALLBACK_URL,
                "me_id": CONSTANTS.PAYMENT_RUSH_ME_ID,
                "account_number": returnData.data.account_number,
                "ifsc": returnData.data.ifsc,
                "beneficiary_name": returnData.data.beneficiary_name
            };

            let resultResponse = await axios.post(CONSTANTS.PAYMENT_RUSH_API_URL_WITHDRAW, requestData, {
                headers: {
                    "APIKey": CONSTANTS.PAYMENT_RUSH_API_KEY
                }
            });
            resultResponse = resultResponse.data; 
            if(resultResponse.status == 'Success'){
                await paymentApiService.updateOrderStatus(order_id, 'pending');
            }
            return res.status(200).json(resultResponse);
        }else{
            return res.status(200).json({
                status: "Failed",
                reason: returnData.data
            });
        }
    }else{
        return res.status(200).json({
            status: "Failed",
            reason: "Action Not Allowed !"
        });
    }
}

async function getPaymentOrderList(req, res) {
    let {
        userid,
        user_id,
        type,
        status,
        page
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        user_id: Joi.optional(),
        type: Joi.optional(),
        status: Joi.optional(),
        page: Joi.number().required()
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let loginUserData = userModel.getUserData();
    let userId = 0;
    if(loginUserData.user_type_id == CONSTANTS.USER_TYPE_ADMIN) {
        if(user_id != 0){
            userId = user_id;
        }     
    }else{
        userId = userid;
    }

    let returnData = await paymentApiService.getPaymentOrderList(parseInt(userId), type, status, page);
    if (returnData.statusCode === CONSTANTS.SUCCESS) {
        let finalData = {
           limit: CONSTANTS.LIMIT,
           total: returnData.data.total,
           data: returnData.data.data
        };
        return apiSuccessRes(req, res, 'SUCCESS', finalData);
    }else{
        return apiErrorRes(req, res, returnData.data);
    }
}

router.post('/paymentApi/getPaymentUrl', getPaymentUrl);
router.post('/paymentApi/paymentCallback', paymentCallback);
router.post('/paymentApi/submitWithdrawRequest', submitWithdrawRequest);
router.post('/paymentApi/rejectWithdrawRequest', rejectWithdrawRequest);
router.post('/paymentApi/acceptWithdrawRequest', acceptWithdrawRequest);
router.post('/paymentApi/getPaymentOrderList', getPaymentOrderList);

module.exports = router;
