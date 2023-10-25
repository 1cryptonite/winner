const express = require('express');
const router = express.Router();
const Joi = require('joi');
const virtualGameApiService = require('../services/virtualGameApiService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const logger = require('../../utils/logger');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
let apiSuccessResVirtualGame = globalFunction.apiSuccessResVirtualGame;
let apiErrorResVirtualGame = globalFunction.apiErrorResVirtualGame;

//Brino Casino Games
async function virtualGameApi(req, res) {

    //{"credentials":{"login":"","password":""},"data":{"token":"test-token",pn:""},"method":"getPlayerInfo","ip":"150.107.190.4"}
   /* let {
        credentials,
        data,
        method,
        ip
    } = req.body;

    const inputSchema = Joi.object({
        credentials: Joi.optional().required(),
        data: Joi.optional().required(),
        method: Joi.string().required(),
        ip: Joi.optional().required(),
    });

    try {
        await inputSchema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorResVirtualGame(req, res, method, "101", error.details[0].message, data.token);
    }*/
    let requestObj = Object.assign({}, req.body);
    let data = requestObj.data;
    let method = requestObj.method;

    if(method == "getPlayerInfo"){
        let findToken = global._loggedInToken.findIndex((element)=>element.token == data.token);
        if (findToken < 0) {
            return apiErrorResVirtualGame(req, res, method, "101", "Invalid Token !", data.token);
        }
        let userId = global._loggedInToken[findToken].user_id;
        let userData = await virtualGameApiService.getPlayerInfoVirtualGame(userId);
        if (userData.statusCode === CONSTANTS.SUCCESS) {
            //{"returnSet":{"token":"test-token","loginName":"Developer","currency":"INR","amount":0.0},"method":"getPlayerInfo","success":1}
            let returnSet = {
                token: data.token,
                loginName: userData.data.user_name,
                currency: "INR",
                amount: userData.data.balance
            }
            return apiSuccessResVirtualGame(req, res, method, returnSet);
        }else{
            return apiErrorResVirtualGame(req, res, method, "101", "Invalid Token !", data.token);
        }
    }
    else if(method == "getBalance"){
        let findToken = global._loggedInToken.findIndex((element)=>element.token == data.token);
        if (findToken < 0) {
            return apiErrorResVirtualGame(req, res, method, "101", "Invalid Token !", data.token);
        }
        let userId = global._loggedInToken[findToken].user_id;
        let userData = await virtualGameApiService.getBalanceVirtualGame(userId);
        if (userData.statusCode === CONSTANTS.SUCCESS) {
            //{"returnSet":{"token":"test-token","currency":"INR","amount":0.0},"method":"getBalance","success":1}
            let returnSet = {
                token: data.token,
                currency: "INR",
                amount: userData.data.balance
            }
            return apiSuccessResVirtualGame(req, res, method, returnSet);
        }else{
            return apiErrorResVirtualGame(req, res, method, "101", "Invalid Token !", data.token);
        }
    }
    // else if(method == "bet"){
    //     //input = amount(double), pn(string), siteId(string), token(string), game(string), roundId(string)
    //     let userData = await virtualGameApiService.bet(userId, data);
    //     if (userData.statusCode === CONSTANTS.SUCCESS) {
    //         //{"returnSet":{"token":"test-token"(string), "pn":"3233sdf"(string), "isValid":true/false(bool)},"method":"getBalance","success":1}
    //         let returnSet = {
    //             token: data.token,
    //             pn: data.pn,
    //             isValid: true
    //         }
    //         return apiSuccessResVirtualGame(req, res, method, returnSet);
    //     }else{
    //         return apiErrorResVirtualGame(req, res, method, "101", userData.data, data.token);
    //     }
    // }
    else if (method == "bet") {
        //(deprecated)input = stack(double), pn(string), siteId(string), token(string), game(string), roundId(string), transactionId(string)
        //updated input = stack(double), expo(double), pn(string), siteId(string), token(string), game(string), roundId(string), transactionId(string)
        let findToken = global._loggedInToken.findIndex((element)=>element.token == data.token);
        if (findToken < 0) {
            return apiErrorResVirtualGame(req, res, method, "101", "Invalid Token !", data.token);
        }
        let userId = global._loggedInToken[findToken].user_id;
        let userData = await virtualGameApiService.brinoPlaceBet(userId, data);
        if (userData.statusCode === CONSTANTS.SUCCESS) {
            //{"returnSet":{"token":"test-token"(string), "pn":"3233sdf"(string), "isValid":true/false(bool)},"method":"bet","success":1}
            let returnSet = {
                token: data.token,
                pn: data.pn,
                amount:userData.data.amount,
                isValid: true
            }
            return apiSuccessResVirtualGame(req, res, method, returnSet);
        } else {
            return apiErrorResVirtualGame(req, res, method, "101", userData.data, data.token);
        }
    }
    else if (method == "result") {
        //(deprecated)input = stack(double), pl(double)(pl includes winning stack+pl), pn(string), siteId(string), token(string), game(string), roundId(string)
        //updated input = stack(double), pl(double)(real pl of user), pn(string), siteId(string), token(string), game(string), roundId(string), userName(string)

        let userData = await virtualGameApiService.brinoResult(data);
        if (userData.statusCode === CONSTANTS.SUCCESS) {
            //{"returnSet":{"token":"test-token"(string), "pn":"3233sdf"(string), "isValid":true/false(bool)},"method":"result","success":1}
            let returnSet = {
                token: data.token,
                pn: data.pn,
                amount: userData.data.amount,
            }
            return apiSuccessResVirtualGame(req, res, method, returnSet);
        } else {
            return apiErrorResVirtualGame(req, res, method, "101", userData.data, data.token);
        }
    }
    else if (method == "gameCancel") {
        //input = stack(double), pn(string), siteId(string), token(string), game(string), roundId(string), userName(string)
        let userData = await virtualGameApiService.brinoCancelGame(data);
        if (userData.statusCode === CONSTANTS.SUCCESS) {
            //{"returnSet":{"token":"test-token"(string), "pn":"3233sdf"(string), "isValid":true/false(bool)},"method":"gameCancel","success":1}
            let returnSet = {
                token: data.token,
                pn: data.pn,
                amount: userData.data.amount,
            }
            return apiSuccessResVirtualGame(req, res, method, returnSet);
        } else {
            return apiErrorResVirtualGame(req, res, method, "101", userData.data, data.token);
        }
    }
    else{
        return apiErrorResVirtualGame(req, res, method, "101", "Invalid Method !", data.token);
    }

}

async function verifyToken(req, res) {

    /*request:-  {"token":"457457fgj57jfjfjkh","ip":"150.107.190.4"}
    response success:-  {"username": "ajay", "status": true, "message": "Success"}
    response failure:-  {"username": "", "status": false, "message": "Token expired"}
    */
    let requestObj = Object.assign({}, req.body);
    let findToken = global._loggedInToken.findIndex((element)=>element.token === requestObj.token);
    if (findToken < 0) {
        return res.status(200).json({
            username: "",
            status: false,
            message: 'Token expired'
        });
    }else{
        return res.status(200).json({
            username: global._loggedInToken[findToken].user_name,
            status: true,
            message: 'Success'
        });
    }
}

async function fantasyVerifyToken(req, res) {

    /*request:-  {"token":"457457fgj57jfjfjkh"}
    response success:-  {"code":0,"error":false,"msg":"User Login successfully.","data":{"userid":"xyz123","username":"ajay","email":"ajay@mailinator.com","phone":4035373708}}
    response failure:-  {"code":1,"error":true,"msg":"User Login successfully.","data":{"userid":"","username":"","email":"","phone":""}}
    */
    let requestObj = Object.assign({}, req.body);
    let findToken = global._loggedInToken.findIndex((element)=>element.token === requestObj.token);
    if (findToken < 0) {
        return res.status(200).json({
            "code": 1,
            "error": true,
            "msg": "Invalid token",
            "data": {
                "userid": "",
                "username": "",
                "email": "",
                "phone": ""
            }
        });
    }else{
        return res.status(200).json({
            "code": 0,
            "error": false,
            "msg": "Success",
            "data": {
                "userid": global._loggedInToken[findToken].user_id + "",
                "username": global._loggedInToken[findToken].user_name,
                "email": "",
                "phone": ""
            }
        });
    }
}

/*Check balance and deduct from balance to join the group*/
async function fantasyJoinContest(req, res) {
    /*request:-  {"token":"457457fgj57jfjfjkh", "amount":100, "matchId":"indeng_2021_t20_0142", "contestId":7, "poolContestId":15, "txnId":20}
    response success:-  {“code”:”0”,"error":false,"msg":"Available Amount.","data":{"amount":2000}}
    response failure:-  {“code”:”1”,"error":true,"msg":"Available Amount.","data":{"amount":2000}}
    */
    let requestObj = Object.assign({}, req.body);
    let findToken = global._loggedInToken.findIndex((element)=>element.token === requestObj.token);
    if (findToken < 0) {
        return res.status(200).json({
            "code": 1,
            "error": true,
            "msg": "Invalid token",
            "data": {
                "amount": 0
            }
        });
    }else{
        let userId = global._loggedInToken[findToken].user_id;
        let returnData = await virtualGameApiService.fantasyJoinContest(userId, requestObj);
        return res.status(200).json(returnData);
    }
}

async function fantasyResult(req, res) {
    /*request:-  {"userId":"4563", "amount":100, "matchId":"indeng_2021_t20_0142", "contestId":7, "poolContestId":15, "txnId":20}
    response success:-  {“code”:”0”,"error":false,"msg":"Available Amount.","data":{"amount":2000}}
    response failure:-  {“code”:”1”,"error":true,"msg":"Available Amount.","data":{"amount":2000}}
    */
    let requestObj = Object.assign({}, req.body);
    let returnData = await virtualGameApiService.fantasyResult(requestObj);
    return res.status(200).json(returnData);
}

async function fantasyGetBalance(req, res) {
    /*request:-  {"token":"457457fgj57jfjfjkh"}
    response success:-  {“code”:”0”,"error":false,"msg":"Available Amount.","data":{"amount":2000}}
    response failure:-  {“code”:”1”,"error":true,"msg":"Available Amount.","data":{"amount":2000}}
    */
    let requestObj = Object.assign({}, req.body);
    let findToken = global._loggedInToken.findIndex((element)=>element.token === requestObj.token);
    if (findToken < 0) {
        return res.status(200).json({
            "code": 1,
            "error": true,
            "msg": "Invalid token",
            "data": {
                "amount": 0
            }
        });
    }else{
        let userId = global._loggedInToken[findToken].user_id;
        let returnData = await virtualGameApiService.fantasyGetBalance(userId);
        return res.status(200).json(returnData);
    }
}

/*Check balance and deduct from balance to join the group*/
async function fantasyRollbackContest(req, res) {
    /*request:-  {"userId":"123", "amount":100, "matchId":"indeng_2021_t20_0142", "contestId":7, "poolContestId":15, "txnId":20}
    response success:-  {“code”:”0”,"error":false,"msg":"Available Amount.","data":{"amount":2000}}
    response failure:-  {“code”:”1”,"error":true,"msg":"Available Amount.","data":{"amount":2000}}
    */
    let requestObj = Object.assign({}, req.body);
    let returnData = await virtualGameApiService.fantasyRollbackContest(requestObj);
    return res.status(200).json(returnData);
}

router.post('/virtualGameApi', virtualGameApi);
router.post('/brino/verifyToken', verifyToken);
router.post('/brinoFantasy/fantasyVerifyToken', fantasyVerifyToken);
router.post('/brinoFantasy/fantasyJoinContest', fantasyJoinContest);
router.post('/brinoFantasy/fantasyResult', fantasyResult);
router.post('/brinoFantasy/fantasyGetBalance', fantasyGetBalance);
router.post('/brinoFantasy/fantasyRollbackContest', fantasyRollbackContest);

module.exports = router;
