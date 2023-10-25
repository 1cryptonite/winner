const express = require('express');
const router = express.Router();
const Joi = require('joi');
const _ = require('lodash');
const axios = require('axios');
const userService = require('../services/userService');
const globalSettingService = require('../services/globalSettingService');
const apkService = require('../services/apkService');
const partnershipsService = require('../services/partnershipsService');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const CONSTANTS_MESSAGE = require('../../utils/constantsMessage');
const userModel = require('../../routes/model/userModel');
const logger = require('../../utils/logger');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const browser = require('browser-detect');

async function verifyUserByToken(req, res) {
	let {
		token,
		mode
	} = req.body;

	const profilechema = Joi.object({
		token: Joi.string().required(),
		mode: Joi.string(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return res.status(201).json({
			message: error.details[0].message,
			code: 201
		});

	}

	let findToken=global._loggedInToken.findIndex((element)=>element.token==token);

	if (findToken >=0 || mode ==1) {
		return apiSuccessRes(req, res, 'varify');
	} else {
		return res.status(201).json({
			message: 'yha kuchh nhi milega bhai......',
			code: 201
		});
	}

}


async function getUserByUserName(req, res) {
    let {
        user_name
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        user_name: Joi.required(),
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let getUserDetailsFromDB = await userService.getUserByUserName(user_name);
    if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
        return apiSuccessRes(req, res, 'user name available!');
    } else if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
        return apiErrorRes(req, res, 'user name already exist!');
    } else {
        return apiErrorRes(req, res, 'Some Thing Is Wrong!');
    }

}

async function register(req, res) {
	let {
		userid,
		user_name,
		password,
		parent_id,
		remark,
		user_type_id,
		name,
		create_no_of_child
	} = req.body;

	const registerchema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_name: Joi.string().required(),
		password: Joi.string().required(),
		parent_id: Joi.number().integer().positive().required().strict(),
		name: Joi.string().required(),
		remark: Joi.optional(),
		user_type_id: Joi.number().required().positive().strict(),
		create_no_of_child: Joi.number().required().positive().allow(0).strict(),
	});
	try {
		await registerchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("add_user")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let reqdaa = {
		user_name,
		password,
		parent_id,
		remark,
		user_type_id,
		name,
		create_no_of_child
	};
	let getUserDetailsFromDB = await userService.getUserByUserName(user_name);
	if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
		let parentDetails = await userService.getUserByUserId(parent_id);
		if (parentDetails.statusCode === CONSTANTS.SUCCESS) {
			let err = '';
			let parentIdArray = [userid, parentDetails.data.id, parentDetails.data.parent_admin_id, parentDetails.data.parent_master_id, parentDetails.data.parent_super_agent_id, parentDetails.data.parent_agent_id];
			let isAllowedParentId = parentIdArray.includes(parent_id);
			let allowedUserTypeArray = [2, 3, 4, 5];
			let isAllowedUserType = allowedUserTypeArray.includes(user_type_id);
			if (parentDetails.data.user_type_id >= user_type_id || user_type_id == CONSTANTS.USER_TYPE_ADMIN || isAllowedUserType == false || isAllowedParentId == false || parent_id == 0) {
				err = 'Wrong Request!';
			}

			if(err === '') {
				if (parentDetails.data.user_type_id != CONSTANTS.USER_TYPE_ADMIN) {
					let getChildCount = await userService.getChildCount(parent_id);
					if (getChildCount.data >= parentDetails.data.create_no_of_child) {
						err = 'Your limit to create maximum ' + parentDetails.data.create_no_of_child + ' child is already reached !';
					}
				}
			}

			 if(err === ''){
				 reqdaa.parent_lock_user = parentDetails.data.lock_user;
				 reqdaa.parent_lock_betting = parentDetails.data.lock_betting;
				 reqdaa.parent_lock_fancy_bet = parentDetails.data.lock_fancy_bet;
				 reqdaa.parent_close_account = parentDetails.data.close_account;
				 reqdaa.parent_lock_settlement = parentDetails.data.lock_settlement;
				 //new code for add user any level
				 reqdaa.parent_user_type_id = parentDetails.data.user_type_id
				 reqdaa.parent_agent_id = parentDetails.data.parent_agent_id
				 reqdaa.parent_super_agent_id = parentDetails.data.parent_super_agent_id
				 reqdaa.parent_master_id = parentDetails.data.parent_master_id
				 reqdaa.parent_admin_id = parentDetails.data.parent_admin_id
				 if (parentDetails.data.user_type_id == 1) {
					 reqdaa.parent_admin_id = parentDetails.data.id
				 } else if (parentDetails.data.user_type_id == 2) {
					 reqdaa.parent_master_id = parentDetails.data.id
				 } else if (parentDetails.data.user_type_id == 3) {
					 reqdaa.parent_super_agent_id = parentDetails.data.id
				 } else if (parentDetails.data.user_type_id == 4) {
					 reqdaa.parent_agent_id = parentDetails.data.id
				 }
					//console.log("reqdaa",reqdaa);
				 let datafromService = await userService.createUser(reqdaa);
				 if (datafromService.statusCode === CONSTANTS.SUCCESS) {
					 return apiSuccessRes(req, res, 'User created successfully');
				 } else {
					 return apiErrorRes(req, res, 'Error to register user !');
				 }
			 }else{
				 return apiErrorRes(req, res, err);
			 }
		} else {
			return apiErrorRes(req, res, 'Invalid parent !');
		}

	} else if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
		return apiErrorRes(req, res, 'user_name already exist !');
	} else {
		return apiErrorRes(req, res, 'Error to register user !');
	}
}

async function login(req, res) {

	let {
		user_name,
		password
	} = req.body;
	const loginchema = Joi.object({
		user_name: Joi.string().required(),
		password: Joi.string().required(),
		g_captcha: Joi.optional()
	});
	try {
		await loginchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	//console.log("login------------------")
    let devicetype = req.headers['devicetype'];
    let ip_address;
    if(req.headers.hasOwnProperty('cf-connecting-ip') && req.headers['cf-connecting-ip']!=''){
		ip_address = req.headers['cf-connecting-ip'];
    }else{
    	ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //	ip_address = ip_address.slice(7);
    }
    
	let reqdaa = {
		user_name: user_name,
		password: password,
        ip_address,
        devicetype
	};

	/*let captcha = req.body.g_captcha;
	let url = 'https://www.google.com/recaptcha/api/siteverify?secret=' + encodeURIComponent (CONSTANTS.GOOGLE_CAPTCHA_SECRET_KEY) + '&response=' + encodeURIComponent(captcha);
	let response = await axios.get(url);*/

	//if(response.data.success == true && response.data.success >= 0.5){
	if(1){

		let getUserDetailsFromDB = await userService.findUserAndVerifyPassword(reqdaa);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {

			let user_id = getUserDetailsFromDB.data.user_id;
			let user_type_id = getUserDetailsFromDB.data.user_type_id;
			let token = getUserDetailsFromDB.data.token;
			let name = getUserDetailsFromDB.data.name;
			let browser_info = req.headers['user-agent'];
			let device_info = req.headers['user-agent'];
			let curTime = globalFunction.currentDate();

			let loginLogsData = {
				user_id: user_id,
				login_time: curTime,
				is_online: '1',
				ip_adress: ip_address,
				session_id: token,
				browser_info: browser_info,
				device_info: device_info
			};

			global._loggedInToken.push({user_id: user_id, user_name: user_name, name: name, user_type_id: user_type_id, token: token, loginTime: curTime, browser_info: browser_info, ip_address: ip_address,IsBetRunning:0});

			await userService.createUserLoginLogs(loginLogsData);

			return apiSuccessRes(req, res, 'Logged in successfully', getUserDetailsFromDB.data);
		}
		else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND || getUserDetailsFromDB.statusCode === CONSTANTS.ACCESS_DENIED) {
			return apiErrorRes(req, res, 'Invalid username or password !');
		}
		else{
			return apiErrorRes(req, res, 'Error to login user !');
		}
	}else{
		return apiErrorRes(req, res, 'Invalid Captcha !');
	}
}

async function userLogin(req, res) {

	let {
		user_name,
		password
	} = req.body;
	const loginchema = Joi.object({
		user_name: Joi.string().required(),
		password: Joi.string().required(),
		g_captcha: Joi.optional()
	});
	try {
		await loginchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let reqdaa = 	{
		user_name: user_name,
		password: password,
	};

    let devicetype = req.headers['devicetype'];
	if(devicetype=='A'){
		let apkData = await apkService.getApkData();
        let apk_active='0';
        if(apkData.statusCode === CONSTANTS.SUCCESS){
            apk_active = apkData.data.is_active;
        }
        if(apk_active=='0'){
            return apiErrorRes(req, res, 'Apk not activated');
		}
	}

	/*let captcha = req.body.g_captcha;
	let url = 'https://www.google.com/recaptcha/api/siteverify?secret=' + encodeURIComponent (CONSTANTS.GOOGLE_CAPTCHA_SECRET_KEY) + '&response=' + encodeURIComponent(captcha);
	let response = await axios.get(url);*/

	// if(response.data.success == true && response.data.success >= 0.5){
	if(1){
		let getUserDetailsFromDB = await userService.userLogin(reqdaa);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {

			let user_id = getUserDetailsFromDB.data.user_id;
			let user_type_id = getUserDetailsFromDB.data.user_type_id;
			let token = getUserDetailsFromDB.data.token;
			let name = getUserDetailsFromDB.data.name;
			let lastLoginDetails = await userService.getUserLoginLogs(user_id);
			let lastLoginTime = lastLoginDetails.statusCode === CONSTANTS.SUCCESS && lastLoginDetails.data[0].login_time ? lastLoginDetails.data[0].login_time : null;
			let ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
			//ip_address = ip_address.slice(7);
			const resuleTemp = browser();

			//let browser_info = resuleTemp.name;
			//let device_info = resuleTemp.os;

			let browser_info = req.headers['user-agent'];
			let device_info = req.headers['user-agent'];
			let curTime = globalFunction.currentDate();

			let loginLogsData = {
				user_id: user_id,
				login_time: curTime,
				is_online: '1',
				ip_adress: ip_address,
				session_id: token,
				browser_info: browser_info,
				device_info: device_info
			};

			if (global._loggedInToken.length > 0) {
				let findToken = global._loggedInToken.findIndex( (element)=>element.user_id === user_id );
				if (findToken >= 0) {
					global._loggedInToken.splice(findToken, 1);
				}
			}
			global._loggedInToken.push({user_id: user_id, user_name: user_name, name: name, user_type_id: user_type_id, token: token, loginTime: curTime, browser_info: browser_info, ip_address: ip_address,IsBetRunning:0});

			await userService.createUserLoginLogs(loginLogsData);
			let resData = {
				...getUserDetailsFromDB.data,
				lastLoginTime,
				terms_conditions: global._config.terms_conditions
			};
			return apiSuccessRes(req, res, 'Logged in successfully', resData);
		}
		else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND || getUserDetailsFromDB.statusCode === CONSTANTS.ACCESS_DENIED) {
			return apiErrorRes(req, res, 'Invalid username or password !');
		}
		else {
			return apiErrorRes(req, res, 'Error to login user !');
		}
	}else{
		return apiErrorRes(req, res, 'Invalid Captcha !');
	}
}

async function logout(req, res) {
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let token=req.headers.authorization.split(' ');
	let findToken=global._loggedInToken.findIndex((element)=>element.token===token[token.length-1]);
	if (findToken >= 0) {
		global._loggedInToken.splice(findToken, 1);
	}
	return apiSuccessRes(req, res, 'Logout Successfully');
}


async function updateuserStatusLock(req, res) {

	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("user_lock")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.data.parent_lock_user === '1') {
		return apiSuccessRes(req, res, 'Parent already locked.');
	} else if (getUserByUserId.data.self_lock_user === '1') {
		return apiSuccessRes(req, res, 'Already locked.');
	} else if (getUserByUserId.statusCode === CONSTANTS.NOT_FOUND) {
		return apiErrorRes(req, res, 'Not found.');
	} else {
		let getUserDetailsFromDB = await userService.updateuserStatusLock(user_id);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Locked Successfully', getUserDetailsFromDB.data);
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not found.');
		} else {
			return apiErrorRes(req, res, 'Error to get user.');
		}
	}

}
async function updateuserStatusUnlock(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);
	if (getUserByUserId.data.parent_lock_user === '1') {
		return apiSuccessRes(req, res, 'Parent already locked.');
	} else if (getUserByUserId.data.self_lock_user === '0') {
		return apiSuccessRes(req, res, 'Already Unlocked');
	} else if (getUserByUserId.data.parent_lock_user === '0') {
		let getUserDetailsFromDB = await userService.updateuserStatusUnlock(user_id);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Unlocked Successfully', getUserDetailsFromDB.data);
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not found.');
		} else {
			return apiErrorRes(req, res, 'Error to get user.');
		}
	} else {
		return apiSuccessRes(req, res, 'Error to find user details.');
	}
}
async function getOwnChild(req, res) {
	let {
		userid,
		user_id,
		search,
		page
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.string().allow('').optional(),
		search: Joi.optional(),
		page: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	// subadmin permission
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("user_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let id = user_id;
	let isOwn =false;
	if (user_id === '') {
		id = userid;
		isOwn=true;
	}
	let getUserByUserId = await userService.getOwnChild(id, isOwn, search, page);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {

		let getUserById = await userService.getUserById(id);
		let parent_id = '';
		if (getUserById.statusCode === CONSTANTS.SUCCESS) {
			parent_id = getUserById.data.parent_id;
		}

		let finalData = {};

		if(getUserByUserId.data[1][0].total){

			if(page == 1){
				finalData = {"user_id": id, "parent_id": parent_id, "limit" : CONSTANTS.LIMIT, "total" : getUserByUserId.data[1][0].total, "data" : getUserByUserId.data[0],"liability" : getUserByUserId.data[2][0].sum_liability,"total_balance" : getUserByUserId.data[2][0].sum_total_balance,"available_balance" : getUserByUserId.data[2][0].sum_balance,"profit_loss" : getUserByUserId.data[2][0].sum_profit_loss,"freechips" : getUserByUserId.data[2][0].sum_freechips};
			}else{
				finalData = {"user_id": id, "parent_id": parent_id, "limit" : CONSTANTS.LIMIT, "total" : 0, "data" : getUserByUserId.data[0],"liability" : getUserByUserId.data[2][0].sum_liability,"total_balance" : getUserByUserId.data[2][0].sum_total_balance,"available_balance" : getUserByUserId.data[2][0].sum_balance,"profit_loss" : getUserByUserId.data[2][0].sum_profit_loss,"freechips" : getUserByUserId.data[2][0].sum_freechips};
			}

		}else{

			if(page == 1){
				finalData = {"user_id": id, "parent_id": parent_id, "limit" : CONSTANTS.LIMIT, "total" : getUserByUserId.data[1][0].total, "data" : getUserByUserId.data[0],"liability" : 0,"total_balance" : 0,"available_balance" : 0,"profit_loss" : 0,"freechips" : 0};
			}else{
				finalData = {"user_id": id, "parent_id": parent_id, "limit" : CONSTANTS.LIMIT, "total" : 0, "data" : getUserByUserId.data[0],"liability" : 0,"total_balance" : 0,"available_balance" : 0,"profit_loss" : 0,"freechips" : 0};
			}
			
		}
		
		return apiSuccessRes(req, res, 'SUCCESS', finalData);
	} else {
		return apiSuccessRes(req, res, 'Error to find .');
	}
}
async function updateUser(req, res) {

	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.data.parent_lock_user === '1') {
		return apiSuccessRes(req, res, 'Parent already locked.');
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}
async function getUser(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}

async function getUserBasicDetails(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("view_account")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	
	let getUserByUserId = await userService.getUserBasicDetails(user_id);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}

async function updatePassword(req, res) {
	let {
		userid,
		oldPassword,
		newPassword,
		confirmNewPassword
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		oldPassword: Joi.string().required(),
		newPassword: Joi.string().required(),
		confirmNewPassword: Joi.string().required(),

	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	if (newPassword !== confirmNewPassword) {
		return apiErrorRes(req, res, 'New password and confirm new password is not same !');
	}
	// subadmin permission work
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("change_pwd_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.abandon);
		}
	}
	let getUserByUserId = await userService.findUserByIdAndVerifyPassword(userid, oldPassword);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		let updatePasswordID = await userService.updatePassword(newPassword, userid, true);
		if (updatePasswordID.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Password updated successfully', getUserByUserId.data);
		} else {
			return apiErrorRes(req, res, 'Error to update password !');
		}
	} else if (getUserByUserId.statusCode === CONSTANTS.ACCESS_DENIED) {
		return apiErrorRes(req, res, 'Invalid current password !');
	} else {
		return apiErrorRes(req, res, 'Error to update password !');
	}
}
async function updateChildPassword(req, res) {
	let {
		childUserId,
		newPassword,
		confirmNewPassword
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		childUserId: Joi.string().required(),
		newPassword: Joi.string().required(),
		confirmNewPassword: Joi.string().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("change_pwd")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	if (newPassword !== confirmNewPassword) {
		return apiErrorRes(req, res, 'New password and confirm new password is not same.');
	}
	let getUserByUserId = await userService.updatePassword(newPassword, childUserId, false);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Password updated.');
	} else if (getUserByUserId.statusCode === CONSTANTS.ACCESS_DENIED) {
		return apiSuccessRes(req, res, 'Invalid current password.');
	} else {
		return apiSuccessRes(req, res, 'Error to update password.');
	}
}
async function getUserPartnership(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserPartnership(user_id);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else if (getUserByUserId.statusCode === CONSTANTS.NOT_FOUND) {
		return apiSuccessRes(req, res, 'Partnership not available.', []);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}
async function getClosedUserList(req, res) {
	let {
		userid,
		limit,
		userName,
		pageno
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		limit: Joi.number().required(),
		pageno: Joi.number().required(),
		userName: Joi.optional(),
		parent_ids: Joi.optional(),
	}).unknown(true);
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	// subadmin permission work
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("close_user_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let data={
		userid,
		limit,
		userName,
		pageno
	};
	let getUserByUserId = await userService.getClosedUserList(data);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}
async function getUserBalanceById(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	let getUserByUserId = await userService.getUserBalanceById(user_id);

	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}
async function updateuserStatusClose(req, res) {

	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.data.user_type_id != 1) {
		if (getUserByUserId.data.self_close_account === '1') {
			return apiSuccessRes(req, res, 'Already Closed !');
		} else if (getUserByUserId.data.parent_close_account === '1') {
			return apiSuccessRes(req, res, 'Parent Already Closed !');
		} else if (getUserByUserId.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not Found !');
		} else {
			let getUserDetailsFromDB = await userService.updateuserStatusClose(user_id, getUserByUserId);
			if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, getUserDetailsFromDB.data);
			} else {
				return apiErrorRes(req, res, getUserDetailsFromDB.data);
			}
		}
	}else{
		return apiErrorRes(req, res, 'Invalid Input !');
	}

}
async function updateuserStatusReopen(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);
	if (getUserByUserId.data.self_close_account === '0') {
		return apiSuccessRes(req, res, 'Already Reopen.');
	} else if (getUserByUserId.data.self_close_account === '1') {
		let getUserDetailsFromDB = await userService.updateuserStatusReopen(user_id);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Reopen Successfully');
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not found.');
		} else {
			return apiErrorRes(req, res, 'Error to get user.');
		}
	} else {
		return apiSuccessRes(req, res, 'Error to find user details.');
	}
}
async function updateUserBasicDetails(req, res) {
	let {
		user_id,
		name,
		mobile,
		remark,
		create_no_of_child
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		name: Joi.string().allow('').optional(),
		odd_commision: Joi.string().allow(0).optional(),
		mobile: Joi.string().allow('').optional(),
		create_no_of_child: Joi.allow(null).optional(),
		remark: Joi.optional(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("update_user")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let reqData = {
		name,
		mobile,
		remark,
		create_no_of_child
	};
	let getUserByUserId = await userService.updateUserByUserId(reqData, user_id);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Updated Successfully');
	} else {
		return apiSuccessRes(req, res, 'Error to find updated user details.');
	}
}
async function updateUserStatusBettingLock(req, res) {

	let {
		user_id,
		is_child_lock
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		is_child_lock: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("lock_betting")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.data.parent_lock_betting === '1' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'Parent betting already locked.');
	} else if (getUserByUserId.data.self_lock_betting === '1' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'User betting  already locked.');
	} else if (getUserByUserId.statusCode === CONSTANTS.NOT_FOUND) {
		return apiErrorRes(req, res, 'Not found.');
	} else {
		let getUserDetailsFromDB = await userService.updateUserStatusBettingLock(user_id, is_child_lock);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'User betting locked successfully.', getUserDetailsFromDB.data);
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not found.');
		} else {
			return apiErrorRes(req, res, 'Error to get user.');
		}
	}

}
async function updateUserStatusBettingUnlock(req, res) {
	let {
		user_id,
		is_child_lock
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		is_child_lock: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);
	if (getUserByUserId.data.parent_lock_betting === '1' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'Parent betting already locked.');
	} else if (getUserByUserId.data.self_lock_betting === '0' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'User betting already unlocked.');
	} else if (getUserByUserId.data.parent_lock_betting === '0' || is_child_lock == 1) {

		let parent_locked = 0;
		if(getUserByUserId.data.user_type_id != 1){
			let getParent = await userService.getUserByUserId(getUserByUserId.data.parent_id);
			if (getParent.data.self_lock_betting === '1' || getParent.data.parent_lock_betting === '1') {
				parent_locked = 1;
			}
		}

		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("lock_betting")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		if(parent_locked === 0) {
			let getUserDetailsFromDB = await userService.updateUserStatusBettingUnlock(user_id, is_child_lock);
			if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'User betting unlocked successfully.', getUserDetailsFromDB.data);
			} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
				return apiErrorRes(req, res, 'Not found.');
			} else {
				return apiErrorRes(req, res, 'Error to get user.');
			}
		}else{
			return apiSuccessRes(req, res, 'Parent betting already locked.');
		}
	} else {
		return apiSuccessRes(req, res, 'Error to find user details.');
	}
}
async function getPartnershipList(req, res) {
	try {
		let {
			user_id,
			user_type_id
		} = req.body;
		const profilechema = Joi.object({
			userid: Joi.number().required(),
			parent_ids: Joi.string(),
			user_id: Joi.number().required(),
			user_type_id: Joi.number().required()
		});
		try {
			await profilechema.validate(req.body, {
				abortEarly: true
			});
		} catch (error) {
			return apiErrorRes(req, res, error.details[0].message);
		}
		let loginUserData = userModel.getUserData();
		if(loginUserData.hasOwnProperty('sub_admin_roles')){
			if(loginUserData.sub_admin_roles.length==0){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}else if(loginUserData.sub_admin_roles.indexOf("partnership")==-1){
				return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
			}
		}

		let partnershipByUserId = await partnershipsService.getPartnershipListByUserId(user_id, user_type_id);
		if (partnershipByUserId.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Success.', partnershipByUserId.data);
		} else {
			return apiSuccessRes(req, res, 'Not found.');
		}
	} catch (e) {
		logger.errorlog.error("getPartnershipList",e);
		return apiErrorRes(req, res, e);
	}

}


async function updatePartnership(req, res) {
    let errors = [];
    let unsuccessfullResult = [];
    let sportIds = [];
    let user_id = '';
    let user_type_id = '';
    let partnershipArray = req.body;
    //await partnershipArray.forEach(async function (entry) {

    for (const entry of partnershipArray) {
        sportIds.push(entry.sport_id);
        user_id = entry.user_id;
        user_type_id = entry.user_type_id;
    }

    let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("partnership")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

    let err = '';
    if(user_id != '' && user_type_id != '') {
        let checkUpdateAllow = await partnershipsService.checkPartnershipUpdateAllow(user_id, user_type_id, sportIds);
        if (checkUpdateAllow.statusCode === CONSTANTS.SUCCESS) {
            if(checkUpdateAllow.data === false){
                err = 'Partnership update not allowed in running match !';
            }
        }else{
            err = 'An error occurred !';
        }
    }else{
        err = 'Data not available !';
    }

    if(err == '') {

        for (const entry of partnershipArray) {
            let {
                user_id,
                partnership,
                sport_id,
				name,
                user_type_id,
				parent_partnership
            } = entry;
            const addPartnershipschema = Joi.object({
                userid: Joi.number().required(),
                user_type_id: Joi.number().required(),
                user_id: Joi.number().required(),
                sport_id: Joi.number().required(),
				name: Joi.optional(),
				parent_partnership: Joi.optional(),
                partnership: Joi.number().required().positive().allow(0).max(100)
            });

            try {
                addPartnershipschema.validate(req.body, {
                    abortEarly: true
                });

                let checkParentPartnership = await partnershipsService.checkParentPartnership(user_id, sport_id, partnership);
				if (checkParentPartnership.statusCode === CONSTANTS.SUCCESS) {
					let validatePartnership = await partnershipsService.validatePartnership(user_id, sport_id, partnership);

					if (validatePartnership.statusCode === CONSTANTS.NOT_FOUND) {
						let ownPartnership = await partnershipsService.getPartnershipByUserId(user_id, sport_id);
						let parentPartnership = await partnershipsService.getPartnershipByUserId(ownPartnership.data.parent_id, sport_id);

						if(parentPartnership.data.partnership >= partnership){
							let newPartnership = partnership - ownPartnership.data.partnership;
							await partnershipsService.updatePartnershipByUserAndSportId(user_id, sport_id, newPartnership, user_type_id, parentPartnership.data.user_type_id);
						}

					} else {
						// unsuccessfullResult.push(JSON.parse(JSON.stringify(validatePartnership.data[0])));//Not done.
						unsuccessfullResult.push(name);//Not done.
					}
				} else {
					unsuccessfullResult.push(name);//Not done.
				}

            } catch (error) {
                errors.push(apiErrorRes(req, res, error.details[0].message));
            }
        }


        if (unsuccessfullResult.length > 0) {
            /*let error = _.groupBy(unsuccessfullResult, function (res) {
                return res.sport_id;
            });
            let updatedResult = [];
            for (var key in error) {
                let tempKey = key;
                let value = error[key];
                let joinedElemet = value.map(e => e.user_id).join(',');
                updatedResult.push({sport_id: tempKey, userId: joinedElemet});
            }*/
            return apiSuccessRes(req, res, 'Can not update partnership of following sports : ' + unsuccessfullResult.toString());
        } else {
            return apiSuccessRes(req, res, 'Partnership updated successfully');
        }
    }else{
        return apiErrorRes(req, res, err);
    }
}
async function getUserBalance(req, res) {
	let {
		userid
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserByUserId(userid);
	let getUserSettingSportWise = await userService.getUserSettingSportWiseByUserId(userid);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		let globalSetting = await globalSettingService.getGlobalSetting();

		let resData = {
			liability: Number((getUserByUserId.data.liability || 0).toFixed(2)),			
			total_balance: Number((getUserByUserId.data.total_balance || 0).toFixed(2)),
			balance: Number((getUserByUserId.data.balance || 0).toFixed(2)),
			profit_loss: Number((getUserByUserId.data.profit_loss).toFixed(2)),
			freechips: Number((getUserByUserId.data.freechips).toFixed(2)),
			lock_user: getUserByUserId.data.lock_user,
			close_account: getUserByUserId.data.close_account,
			lock_settlement: getUserByUserId.data.lock_settlement,
			chip: getUserByUserId.data.chip,
			session_liability: getUserByUserId.data.session_liability,
			un_match_liability: getUserByUserId.data.un_match_liability,
			site_message: globalSetting.data[0].site_message ? globalSetting.data[0].site_message : '',
			is_online: getUserByUserId.data.is_online,
			setting:getUserSettingSportWise.data
		};
		return apiSuccessRes(req, res, 'Success.', resData);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}
async function getUserMatchStack(req, res) {
	let {
		userid
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}


	let getUserByUserId = await userService.getUserByUserId(userid);
	if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'Success.', getUserByUserId.data.match_stack? getUserByUserId.data.match_stack: global._config.match_stack);
	} else {
		return apiSuccessRes(req, res, 'User already locked.');
	}

}
async function updateUserMatchStack(req, res) {
	let {
		userid,
		match_stack
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		match_stack: Joi.string().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	if (match_stack) {

		let splitedData=match_stack.split(',');

		let newArrayOfString=[];


		for (let i = 0; i < 5; i++) {
			if (!splitedData[i]) {
				newArrayOfString.push(0);
			}else{
				newArrayOfString.push(splitedData[i]);
			}
		}
		let commaString=newArrayOfString.join(",");
		let reqData = {
			match_stack:commaString
		};
		let getUserByUserId = await userService.updateUserByUserId(reqData, userid);
		if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Updated Successfully.', getUserByUserId.data);
		} else {
			return apiSuccessRes(req, res, 'Something Went Wrong.');
		}
	}else {
		return apiSuccessRes(req, res, 'Please send valid matchStack string.');
	}

	// let reqData = {
	// 	match_stack
	// };
	// let getUserByUserId = await userService.updateUserByUserId(reqData, userid);
	// if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
	// 	//console.log('userid  ',getUserByUserId.data);
	// 	return apiSuccessRes(req, res, 'Success.', getUserByUserId.data);
	// } else {
	// 	return apiSuccessRes(req, res, 'User already locked.');
	// }

}
async function removeDataDatewise(req, res) {

	let {userid,fromDate,toDate,password}=req.body;
	const registerchema = Joi.object({
		parent_ids: Joi.optional().required(),
		fromDate: Joi.optional().required(),
		toDate: Joi.optional().required(),
		userid: Joi.number().required(),
		password: Joi.optional().required()
	});
	try {
		await registerchema.validate(req.body, {
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
		}else if(loginUserData.sub_admin_roles.indexOf("remove_data_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let getUserDetails = await userService.verifyAdmin(userid, password);
	if (getUserDetails.statusCode === CONSTANTS.SUCCESS) {
		let datafromService = await userService.removeDataDatewise(fromDate,toDate);
		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			if(datafromService.data[0].resultV == 1) {
				return apiSuccessRes(req, res, datafromService.data[0].retMess, datafromService.data[0].resultV);
			}else{
				return apiErrorRes(req, res, datafromService.data[0].retMess, datafromService.data[0].resultV);
			}
		} else {
			return apiErrorRes(req, res, 'Error to data cleared !');
		}
	} else {
		return apiErrorRes(req, res, 'Un-authorized user !');
	}

}

async function removeDataWithOutUser(req, res) {

	let {userid,fromDate,toDate,password}=req.body;
	const registerchema = Joi.object({
		parent_ids: Joi.optional().required(),
		userid: Joi.number().required(),
		password: Joi.optional().required()
	});
	try {
		await registerchema.validate(req.body, {
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
		}else if(loginUserData.sub_admin_roles.indexOf("remove_data_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	let getUserDetails = await userService.verifyAdmin(userid, password);
	if (getUserDetails.statusCode === CONSTANTS.SUCCESS) {
		let datafromService = await userService.removeDataWithOutUser();
		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			if(datafromService.data[0].resultV == 1) {
				return apiSuccessRes(req, res, datafromService.data[0].retMess, datafromService.data[0].resultV);
			}else{
				return apiErrorRes(req, res, datafromService.data[0].retMess, datafromService.data[0].resultV);
			}
		} else {
			return apiErrorRes(req, res, 'Error to data cleared !');
		}
	} else {
		return apiErrorRes(req, res, 'Un-authorized user !');
	}

}

async function removeOldData(req, res) {

	let {userid, password}=req.body;
	const registerchema = Joi.object({
		parent_ids: Joi.optional().required(),
		userid: Joi.number().required(),
		password: Joi.optional().required()
	});
	try {
		await registerchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("clear_all_data_sub_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let getUserDetails = await userService.verifyAdmin(userid, password);
	if (getUserDetails.statusCode === CONSTANTS.SUCCESS) {
		let datafromService = await userService.removeOldData();
		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'All data cleared successfully');
		} else {
			return apiErrorRes(req, res, 'Error to data cleared !');
		}
	} else {
		return apiErrorRes(req, res, 'Un-authorized user !');
	}

}

async function updateUserOneClickStack(req, res) {
	let {
		userid,
		one_click
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		one_click: Joi.string().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	if (one_click) {

		let splitedData=one_click.split(',');

		let newArrayOfString=[];
		for (let i = 0; i < 3; i++) {
			if (!splitedData[i]) {
				newArrayOfString.push(0);
			}else{
				newArrayOfString.push(splitedData[i]);
			}
		}
		let commaString=newArrayOfString.join(",");
		let reqData = {
			one_click:commaString
		};
		let getUserByUserId = await userService.updateUserOneClickStack(reqData, userid);
		if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'Updated Successfully.', getUserByUserId.data);
		} else {
			return apiSuccessRes(req, res, 'Something Went Wrong.');
		}
	}else {
		return apiSuccessRes(req, res, 'Please send valid one_click string.');
	}


}
async function getUserOneClickStack(req, res) {
    let {
        userid
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required()
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let getUserByUserId = await userService.getUserByUserId(userid);
    if (getUserByUserId.statusCode === CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Success.', getUserByUserId.data.one_click? getUserByUserId.data.one_click: global._config.one_click_stack);
    } else {
        return apiSuccessRes(req, res, 'User already locked.');
    }

}

async function logoutAllUser(req, res) {
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	if(user_type_id === CONSTANTS.USER_TYPE_ADMIN){
		await userService.logoutAllUser();
		global._loggedInToken=[]; //logout all user by removing all login tokens
		return apiSuccessRes(req, res, 'All users logged out successfully');
	}else{
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}
}

async function getOnlineUsers(req, res) {
	let {
		userid,user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number(),
		search_user_type_id: Joi.number()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let onlineUserData = [];
	let userList = [];
	let loginUserData = await userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	if(user_type_id != CONSTANTS.USER_TYPE_ADMIN){
		userList = await userService.getChild(userid);
	}

	// subadmin permission work
	//let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("online_user_menu")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}
	for (let element of global._loggedInToken) {
		if(user_id) {
			if(element.user_id == user_id) {
				onlineUserData.push(element);
			}
		} else {
			if (user_type_id == CONSTANTS.USER_TYPE_ADMIN && element.user_type_id != CONSTANTS.USER_TYPE_ADMIN) {
				onlineUserData.push(element);
			} else if (user_type_id != CONSTANTS.USER_TYPE_ADMIN && userList.includes(element.user_id)) {
				onlineUserData.push(element);
			}
		}
	}
	onlineUserData.reverse();
	return apiSuccessRes(req, res, 'SUCCESS', onlineUserData);
}

async function updateUserStatusFancyBetLock(req, res) {

	let {
		user_id,
		is_child_lock
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		is_child_lock: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.data.parent_lock_fancy_bet === '1' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'Parent fancy bet already locked.');
	} else if (getUserByUserId.data.self_lock_fancy_bet === '1' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'User fancy bet already locked.');
	} else if (getUserByUserId.statusCode === CONSTANTS.NOT_FOUND) {
		return apiErrorRes(req, res, 'Not found.');
	} else {
		let getUserDetailsFromDB = await userService.updateUserStatusFancyBetLock(user_id, is_child_lock);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'User fancy bet locked successfully.', getUserDetailsFromDB.data);
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not found.');
		} else {
			return apiErrorRes(req, res, 'Error to get user.');
		}
	}

}

async function updateUserStatusFancyBetUnlock(req, res) {
	let {
		user_id,
		is_child_lock
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		is_child_lock: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}
	let getUserByUserId = await userService.getUserByUserId(user_id);
	if (getUserByUserId.data.parent_lock_fancy_bet === '1' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'Parent fancy bet already locked.');
	} else if (getUserByUserId.data.self_lock_fancy_bet === '0' && is_child_lock != 1) {
		return apiSuccessRes(req, res, 'User fancy bet already unlocked.');
	} else if (getUserByUserId.data.parent_lock_fancy_bet === '0' || is_child_lock == 1) {

		let parent_locked = 0;
		if(getUserByUserId.data.user_type_id != 1){
			let getParent = await userService.getUserByUserId(getUserByUserId.data.parent_id);
			if (getParent.data.self_lock_fancy_bet === '1' || getParent.data.parent_lock_fancy_bet === '1') {
				parent_locked = 1;
			}
		}
		if(parent_locked === 0) {
			let getUserDetailsFromDB = await userService.updateUserStatusFancyBetUnlock(user_id, is_child_lock);
			if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'User betting unlocked successfully.', getUserDetailsFromDB.data);
			} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
				return apiErrorRes(req, res, 'Not found.');
			} else {
				return apiErrorRes(req, res, 'Error to get user.');
			}
		}else{
			return apiSuccessRes(req, res, 'Parent fancy bet already locked.');
		}

	} else {
		return apiSuccessRes(req, res, 'Error to find user details.');
	}
}

async function searchUser(req, res) {
	let {
		userid,
		search,
		page
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		search: Joi.optional(),
		page: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	let userData = await userService.searchUser(userid, user_type_id, search, page);
	if (userData.statusCode === CONSTANTS.SUCCESS) {
		let finalData = {};
		if(page == 1){
			finalData = {"limit" : CONSTANTS.LIMIT, "total" : userData.data[1][0].total, "data" : userData.data[0]};
		}else{
			finalData = {"limit" : CONSTANTS.LIMIT, "total" : 0, "data" : userData.data[0]};
		}
		return apiSuccessRes(req, res, 'SUCCESS', finalData);

	} else {
		return apiErrorRes(req, res, 'No result found !');
	}
}

async function searchUserForAutoSuggest(req, res) {
	let {
		userid,
		search
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		search: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	let user_type_id = loginUserData.user_type_id;

	let userData = await userService.searchUserForAutoSuggest(userid, user_type_id, search);
	if (userData.statusCode === CONSTANTS.SUCCESS) {
		return apiSuccessRes(req, res, 'SUCCESS', userData.data);
	} else {
		return apiErrorRes(req, res, 'No result found !');
	}
}

async function deleteClosedAccount(req, res) {

	let {userid, user_id, password}=req.body;
	const registerchema = Joi.object({
		parent_ids: Joi.optional().required(),
		userid: Joi.number().required(),
		user_id: Joi.number().required(),
		password: Joi.optional().required()
	});
	try {
		await registerchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let getUserDetails = await userService.verifyAdmin(userid, password);
	if (getUserDetails.statusCode === CONSTANTS.SUCCESS) {
		let datafromService = await userService.deleteClosedAccount(user_id);
		if (datafromService.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, datafromService.data);
		} else {
			return apiErrorRes(req, res, datafromService.data);
		}
	} else {
		return apiErrorRes(req, res, 'Un-authorized user !');
	}

}


async function selectedUserLogout(req, res) {
	let {
		user_id
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	 global._loggedInToken.forEach(async (element, index) => {
		if(element.user_id === user_id)
		{
			global._loggedInToken.splice(index, 1);
		}
	});

	return apiSuccessRes(req, res, 'User Logout Successfully');
}


async function updateUserStatusSettlementLock(req, res) {

	let {
		user_id,
		is_child_lock
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		is_child_lock: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, 'Enter valid param!', error);
	}
	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("lock_settlement")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let getUserByUserId = await userService.getUserByUserId(user_id);

	if (getUserByUserId.data.parent_lock_settlement === '1' && is_child_lock != 1) {
		return apiErrorRes(req, res, 'Parent settlement already locked ' +
			'1');
	} else if (getUserByUserId.data.self_lock_settlement === '1' && is_child_lock != 1) {
		return apiErrorRes(req, res, 'User settlement already locked !');
	} else if (getUserByUserId.statusCode === CONSTANTS.NOT_FOUND) {
		return apiErrorRes(req, res, 'Not found !');
	} else {
		let getUserDetailsFromDB = await userService.updateUserStatusSettlementLock(user_id, is_child_lock);
		if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
			return apiSuccessRes(req, res, 'User settlement locked successfully', getUserDetailsFromDB.data);
		} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
			return apiErrorRes(req, res, 'Not found !');
		} else {
			return apiErrorRes(req, res, 'Error to get user !');
		}
	}

}

async function updateUserStatusSettlementUnlock(req, res) {
	let {
		user_id,
		is_child_lock
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		user_id: Joi.number().required(),
		is_child_lock: Joi.optional()
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	if(loginUserData.hasOwnProperty('sub_admin_roles')){
		if(loginUserData.sub_admin_roles.length==0){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}else if(loginUserData.sub_admin_roles.indexOf("lock_settlement")==-1){
			return apiErrorRes(req, res, CONSTANTS_MESSAGE.NO_PERMISSION_MESSAGE);
		}
	}

	let getUserByUserId = await userService.getUserByUserId(user_id);
	if (getUserByUserId.data.parent_lock_settlement === '1' && is_child_lock != 1) {
		return apiErrorRes(req, res, 'Parent settlement already locked !');
	} else if (getUserByUserId.data.self_lock_settlement === '0' && is_child_lock != 1) {
		return apiErrorRes(req, res, 'User settlement already unlocked !');
	} else if (getUserByUserId.data.parent_lock_settlement === '0' || is_child_lock == 1) {

		let parent_locked = 0;
		if(getUserByUserId.data.user_type_id != 1){
			let getParent = await userService.getUserByUserId(getUserByUserId.data.parent_id);
			if (getParent.data.self_lock_settlement === '1' || getParent.data.parent_lock_settlement === '1') {
				parent_locked = 1;
			}
		}

		if(parent_locked === 0) {
			let getUserDetailsFromDB = await userService.updateUserStatusSettlementUnlock(user_id, is_child_lock);
			if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
				return apiSuccessRes(req, res, 'User settlement unlocked successfully', getUserDetailsFromDB.data);
			} else if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
				return apiErrorRes(req, res, 'Not found.');
			} else {
				return apiErrorRes(req, res, 'Error to get user.');
			}
		}else{
			return apiErrorRes(req, res, 'Parent settlement already locked !');
		}
	} else {
		return apiErrorRes(req, res, 'Error to get user !');
	}
}

async function signUp(req, res) {
	let {
		user_name,
		password,
		name,
		mobile
	} = req.body;

	const registerchema = Joi.object({
		user_name: Joi.string().required(),
		password: Joi.string().required(),
		name: Joi.string().required(),
		mobile: Joi.string().required()
	});
	try {
		await registerchema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let reqdaa = {
		user_name,
		password,
		name,
		mobile
	};
	let checkUsernameExists = await userService.checkUsernameExists(user_name);
	if (checkUsernameExists.statusCode === CONSTANTS.SUCCESS) {
		if(checkUsernameExists.data == 0) {
			let getAdminDetail = await userService.getAdminDetail();
			if (getAdminDetail.statusCode === CONSTANTS.SUCCESS) {
				reqdaa.parent_id = getAdminDetail.data.id;
				reqdaa.parent_admin_id = getAdminDetail.data.id;
				reqdaa.parent_user_type_id = getAdminDetail.data.user_type_id;
				reqdaa.user_type_id = 5;
				let dataFromService = await userService.signUp(reqdaa);
				if (dataFromService.statusCode === CONSTANTS.SUCCESS) {
					return apiSuccessRes(req, res, 'Signup Successfully');
				} else {
					return apiErrorRes(req, res, 'An Error Occurred In Signup !');
				}
			} else {
				return apiErrorRes(req, res, 'An Error Occurred In Signup !');
			}
		} else{
			return apiErrorRes(req, res, 'Username Already Exists !');
		}
	} else {
		return apiErrorRes(req, res, 'An Error Occurred In Signup !');
	}
}

async function getSignupUserList(req, res) {
	let {
		userid,
		search,
		page
	} = req.body;
	const profilechema = Joi.object({
		userid: Joi.number().required(),
		parent_ids: Joi.optional().required(),
		search: Joi.optional(),
		page: Joi.number().required(),
	});
	try {
		await profilechema.validate(req.body, {
			abortEarly: true
		});
	} catch (error) {
		return apiErrorRes(req, res, error.details[0].message);
	}

	let loginUserData = userModel.getUserData();
	if(loginUserData.user_type_id == 1) {
		let returnData = await userService.getSignupUserList(search, page);
		if (returnData.statusCode === CONSTANTS.SUCCESS) {
			let finalData = {
				"limit": CONSTANTS.LIMIT,
				"total": (page == 1) ? returnData.data[1][0].total : 0,
				"data": returnData.data[0]
			};
			return apiSuccessRes(req, res, 'SUCCESS', finalData);
		} else {
			return apiErrorRes(req, res, 'An Error Occurred !');
		}
	}else{
		return apiErrorRes(req, res, 'Unauthorized Access !');
	}
}

router.post('/updateUserStatusBettingLock', updateUserStatusBettingLock);
router.post('/updateUserStatusBettingUnlock', updateUserStatusBettingUnlock);
router.post('/getOwnChild', getOwnChild);
router.post('/updateuserStatusLock', updateuserStatusLock);
router.post('/updateuserStatusClose', updateuserStatusClose);
router.post('/updateUser', updateUser);
router.post('/updateuserStatusUnlock', updateuserStatusUnlock);
router.post('/updateuserStatusReopen', updateuserStatusReopen);
router.post('/register', register);
router.post('/check_user_name', getUserByUserName);
router.post('/getUser', getUser);
router.post('/getUserBasicDetails', getUserBasicDetails);
router.post('/userLogin', userLogin);
router.post('/login', login);
router.post('/logout', logout);
router.post('/updatePartnership', updatePartnership);
router.post('/updatePassword', updatePassword);
router.post('/updateChildPassword', updateChildPassword);
router.post('/getUserPartnership', getUserPartnership);
router.post('/getClosedUserList', getClosedUserList);
router.post('/getUserBalanceById', getUserBalanceById);
router.post('/updateUserBasicDetails', updateUserBasicDetails);
router.post('/getPartnershipList', getPartnershipList);
router.get('/getUserBalance', getUserBalance);
router.get('/getUserMatchStack', getUserMatchStack);
router.get('/getUserOneClickStack', getUserOneClickStack);
router.post('/updateUserMatchStack', updateUserMatchStack);
router.post('/updateUserOneClickStack', updateUserOneClickStack);
router.post('/removeDataDatewise', removeDataDatewise);
router.post('/removeDataWithOutUser', removeDataWithOutUser);
router.post('/deleteUserAndBet', removeOldData);
router.post('/user/logoutAllUser', logoutAllUser);
router.post('/user/getOnlineUsers', getOnlineUsers);
router.post('/updateUserStatusFancyBetLock', updateUserStatusFancyBetLock);
router.post('/updateUserStatusFancyBetUnlock', updateUserStatusFancyBetUnlock);
router.post('/user/search', searchUser);
router.post('/user/searchUserForAutoSuggest', searchUserForAutoSuggest);
router.post('/user/deleteClosedAccount', deleteClosedAccount);
router.post('/user/selectedUserLogout', selectedUserLogout);
router.post('/user/updateUserStatusSettlementLock', updateUserStatusSettlementLock);
router.post('/user/updateUserStatusSettlementUnlock', updateUserStatusSettlementUnlock);
router.post('/user/verifyUserByToken', verifyUserByToken);
router.post('/signUp', signUp);
router.post('/user/getSignupUserList', getSignupUserList);
module.exports = router;
