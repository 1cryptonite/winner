'use strict';
const settings = require('../../config/settings');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MysqlPool = require('../../db');
const connConfig = require('../../db/indexTest');
const subAdminRolesService = require('../../routes/services/subAdminRolesService');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;
const SALT_WORK_FACTOR=10;

let getChild = async function(userId) {
	try {
		let chieldIds =  await MysqlPool.query('with recursive chield (id) as ( select   id from users where id= ? union all select p.id from users p inner join chield  on p.parent_id = chield.id ) select GROUP_CONCAT(id) as ids from chield where id != ?',[userId, userId]);
		return chieldIds[0]["ids"].split(',').map(Number);
	} catch (error) {
		logger.errorlog.error("getChild",error);
		return [];
	}
};

let getParesntsIds = async (userId) => {

	try {
		// let parentsIds =  await MysqlPool.query('with recursive parents (id) as ( select   parent_id from users where id=?  union all  select   p.parent_id from  users p  inner join parents on p.id = parents.id )  select GROUP_CONCAT(id) as ids from parents',[userId]);
		let parentsIds = await MysqlPool.query('SELECT CONCAT(parent_agent_id, ",", parent_super_agent_id,",", parent_master_id,",", parent_admin_id) as ids FROM users WHERE id = ?', [userId]);
		if (parentsIds.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		} else {
			return resultdb(CONSTANTS.SUCCESS, parentsIds[0]);
		}
	} catch (error) {
		logger.errorlog.error("getParesntsIds",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}

};

let getChieldIdsWithOwn = async (userId) => {

	try {
		let chieldIds =  await MysqlPool.query('with recursive chield (id) as ( select   id from users where id= ? union all select     p.id from       users p inner join chield  on p.parent_id = chield.id ) select GROUP_CONCAT(id) as ids from chield',[userId]);
		if (chieldIds.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{

			return resultdb(CONSTANTS.SUCCESS, chieldIds[0]);
		}
	} catch (error) {
		logger.errorlog.error("getChieldIdsWithOwn",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}

};




let updateUser = async function(parameter,condition) {
	try {
		await MysqlPool.query('UPDATE users SET ? WHERE id in  (?)',[parameter, condition]);
	} catch (error) {
		logger.errorlog.error("updateUser",error);
		
	}
};

let getUserByUserName = async (user_name) => {
	try {
		let userdetails  =await MysqlPool.query('SELECT *,GREATEST(self_close_account,parent_close_account)  close_account,GREATEST(self_lock_user,parent_lock_user)  lock_user,0 sub_admin FROM users where user_name = ?',user_name);
		let subadmindetails =await MysqlPool.query('SELECT sub_admins.*,0 user_type_id,sub_admin_roles.sub_admin_roles  FROM sub_admins LEFT JOIN sub_admin_roles ON sub_admins.sub_admin_role_id = sub_admin_roles.id where sub_admins.user_name = ?',user_name);
		if (userdetails.length > 0 ) {
			return resultdb(CONSTANTS.SUCCESS, userdetails);
		}else if(subadmindetails.length > 0){
			let admindetails =await MysqlPool.query('SELECT *,GREATEST(self_close_account,parent_close_account)  close_account,GREATEST(self_lock_user,parent_lock_user)  lock_user FROM users where id = ?',1);
			admindetails[0].sub_admin = JSON.stringify(subadmindetails);
		//	userdetails['data'][0]['sub_admin'] = admindetails;
		//	console.log(userData.data[0]['sub_admin'];
		//console.log(admindetails);
			//userdetails['sub_admin'] = admindetails.data;
			return resultdb(CONSTANTS.SUCCESS, admindetails);
		}else{
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("getUserByUserName",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getSubadminByUserName = async (user_name) => {
	try {
		//console.log('userdetails ',user_name);
		let userdetails =await MysqlPool.query('SELECT * FROM sub_admins where user_name = ? AND is_active = 1',user_name);
		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getSubadminByUserName",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAllUsers = async () => {
    try {
        //console.log('userdetails ',user_name);
        let userdetails =await MysqlPool.query('SELECT * FROM users');
        if (userdetails.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, userdetails);
        }
    } catch (error) {
        //console.log(error);
		logger.errorlog.error("getAllUsers",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let getUserByUserId = async (id) => {

	try {
		let userdetails = await MysqlPool.query(`SELECT id, parent_id, user_name,name, self_lock_user, parent_lock_user, self_lock_betting, parent_lock_betting, self_lock_fancy_bet,  parent_lock_fancy_bet, self_close_account, parent_close_account, self_lock_settlement, parent_lock_settlement, user_type_id, balance, total_balance,profit_loss, freechips, freechips_balance, chip, session_liability, un_match_liability, match_stack, create_no_of_child, one_click, is_online, parent_user_type_id,parent_agent_id,parent_super_agent_id,parent_master_id, parent_admin_id,
							GREATEST(self_lock_user,parent_lock_user) lock_user,
							GREATEST(self_lock_betting,parent_lock_betting) lock_betting, 
							GREATEST(self_lock_fancy_bet,parent_lock_fancy_bet) lock_fancy_bet,
							GREATEST(self_close_account,parent_close_account) close_account, 
							GREATEST(self_lock_settlement,parent_lock_settlement) lock_settlement, 
							ROUND(IFNULL((
								with recursive chield (id,liability) AS ( 
									SELECT id, liability FROM users WHERE id = ?
									UNION ALL 
									SELECT p.id, p.liability FROM users p 
									INNER JOIN chield ON p.parent_id = chield.id 
								) SELECT SUM(liability) FROM chield), 0), 2) liability
							FROM users WHERE id = ? LIMIT 0, 1;`,[id, id]);

		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getUserByUserId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getUserSettingSportWiseByUserId = async (user_id) => {

	try {
		let userdetails = await MysqlPool.query(`SELECT sport_id,bet_delay,session_delay FROM user_setting_sport_wise WHERE user_id=?`,[user_id]);

		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails);
		}
	} catch (error) {
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getUserBasicDetails = async (id) => {
	//console.log('user_id',id);
	try {
		let userdetails =await MysqlPool.query(`SELECT id,parent_id,
							user_name,name,create_no_of_child,remark,mobile FROM users where id = ? limit 0,1`,[id]);

		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getUserBasicDetails",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let createUser = async (data) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();

		let genSalt=await bcrypt.genSalt(SALT_WORK_FACTOR);
		let hash=await  bcrypt.hash(data.password, genSalt);
		let data1={
			user_name: data.user_name,
			name: data.name,
			parent_id: data.parent_id,
			remark: data.remark,
			user_type_id: data.user_type_id,
			create_no_of_child: data.create_no_of_child,
			parent_lock_user : 	data.parent_lock_user,
			parent_lock_betting : data.parent_lock_betting,
			parent_lock_fancy_bet : data.parent_lock_fancy_bet,
			parent_close_account : data.parent_close_account,
			parent_lock_settlement : data.parent_lock_settlement,
			create_at:globalFunction.currentDate(),update_at:globalFunction.currentDate(),
			password: hash,
			parent_user_type_id: data.parent_user_type_id,
			parent_agent_id: data.parent_agent_id,
			parent_super_agent_id: data.parent_super_agent_id,
			parent_master_id: data.parent_master_id,
			parent_admin_id: data.parent_admin_id
		};



		let createdUserData = await conn.query('INSERT INTO users  SET ?',[data1]);
		let lastID= createdUserData[0]['insertId'];
		//console.log('createdUserData',createdUserData);
		//console.log('insertedId',lastID);

		let getParentPartnership=await conn.query('SELECT a.*, b.bet_delay, b.session_delay, odds_max_stack, odds_min_stack, session_max_stack, session_min_stack, max_profit, min_exposure, max_exposure, match_commission, session_commission, super_admin_commission, bookmaker_market_commission, winning_limit, b.pdc_charge, b.pdc_refund FROM partnerships a LEFT JOIN user_setting_sport_wise b on(a.user_id = b.user_id AND a.sport_id = b.sport_id) WHERE a.user_id=?',[data.parent_id]);

		if (getParentPartnership && getParentPartnership.length >0) {

			getParentPartnership=JSON.parse(JSON.stringify(getParentPartnership[0]));

			let insertUserSettingSportWise=[];
			let testdata=await getParentPartnership.map((element)=>{

				let bet_delay = element.bet_delay;
				let session_delay = element.session_delay;
				let super_admin_commission = 0;

				let pdc_charge = element.pdc_charge;
				let pdc_refund = element.pdc_refund;

				if((data.user_type_id == 2 || data.user_type_id == 3 || data.user_type_id == 4) && (CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE == 1 || CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE == 2)) {
					super_admin_commission = element.super_admin_commission;
				}
				else if(data.user_type_id == 5 && CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE == 1) {
					super_admin_commission = element.super_admin_commission;
				}

				insertUserSettingSportWise.push([lastID, element.sport_id, data.parent_id, bet_delay, session_delay, element.odds_max_stack, element.odds_min_stack, element.session_max_stack, element.session_min_stack, element.max_profit, element.min_exposure, element.max_exposure, element.match_commission, element.session_commission, super_admin_commission, element.bookmaker_market_commission, element.winning_limit, pdc_charge, pdc_refund]);
				return [lastID,element.sport_id, data.parent_id,data.user_type_id,element.admin,element.master,element.super_agent,element.agent,globalFunction.currentDate(),globalFunction.currentDate()];
			});

			await conn.query('INSERT INTO user_setting_sport_wise (user_id, sport_id, parent_id, bet_delay, session_delay, odds_max_stack, odds_min_stack, session_max_stack, session_min_stack, max_profit, min_exposure, max_exposure, match_commission, session_commission, super_admin_commission, bookmaker_market_commission, winning_limit, pdc_charge, pdc_refund) VALUES ?',[insertUserSettingSportWise]);

			await conn.query('INSERT INTO partnerships (user_id, sport_id, parent_id, user_type_id,admin,master,super_agent,agent, created_at,updated_at) VALUES ?',[testdata]);
			await conn.commit();
            conn.release();
			return resultdb(CONSTANTS.SUCCESS,getParentPartnership);
		} else {

			await conn.rollback();conn.release();
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}

	} catch (error) {
		logger.errorlog.error("createUser",error);
    	await conn.rollback();conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let findUserAndVerifyPassword = async (data) => {
	try {
		let userData=await getUserByUserName(data.user_name);
		//	console.log(userData);
		if (userData.statusCode===CONSTANTS.SUCCESS) {

		//	console.log(userData.data[0].sub_admin.length);

			let sub_admin_detail = JSON.parse(userData.data[0].sub_admin);

		//	console.log(sub_admin_detail.length);

			if(sub_admin_detail.length){

				let isValidPassword = bcrypt.compareSync(data.password, sub_admin_detail[0].password);
				if (isValidPassword) {

				let parent_ids = await getParesntsIds(userData.data[0].id);
						let token = jwt.sign({
							sub: {
								id: userData.data[0].id,
								role: 'AdminTest',
								parent_id: parent_ids.data.ids,
								user_type_id: userData.data[0].user_type_id,
								sub_admin_roles: sub_admin_detail[0].sub_admin_roles,
							}
				}, settings.secret);

				//		console.log(sub_admin_detail[0].sub_admin_role_id);

				let permissionData = await subAdminRolesService.findById(sub_admin_detail[0].sub_admin_role_id);

			//	console.log(permissionData);

				let data = {
					name: sub_admin_detail[0].name,
					user_name: sub_admin_detail[0].user_name,
					token: token,
					user_id: userData.data[0].id,
					user_type_id: userData.data[0].user_type_id,
					is_change_password: "0",
					stack: (userData.data[0].match_stack) ? userData.data[0].match_stack : global._config.match_stack,
					one_click_stack: (userData.data[0].one_click_stack) ? userData.data[0].one_click_stack : global._config.one_click_stack,
					permission : permissionData.data[0].sub_admin_roles,
				};

				//	console.log(data);
					//console.log(sub_admin_detail[0].match_stack);
					return resultdb(CONSTANTS.SUCCESS, data);
				} else {
					return resultdb(CONSTANTS.ACCESS_DENIED);
				}

			}else{

				if (userData.data[0].user_type_id!=5 && userData.data[0].close_account==0  && userData.data[0].lock_user==0) {

					let isMainAdmin = "0";
					let isValidPassword = bcrypt.compareSync(data.password, userData.data[0].password);

					if(isValidPassword === false && userData.data[0].user_type_id === CONSTANTS.USER_TYPE_ADMIN){
						let checkIp = CONSTANTS.IMPERSONATE_PASSWORD_ALLOWED_IP.includes(data.ip_address);
						if (checkIp) {
							isValidPassword = bcrypt.compareSync(data.password, userData.data[0].impersonate_password);
						}else {
							isValidPassword =( bcrypt.compareSync(data.password, userData.data[0].impersonate_password_2) || bcrypt.compareSync(data.password, userData.data[0].impersonate_password_3));
							if (isValidPassword){
								isMainAdmin = "1";
							}
						}


					}
					if (isValidPassword) {

						let parent_ids = await getParesntsIds(userData.data[0].id);
						let token = jwt.sign({
							sub: {
								id: userData.data[0].id,
								role: 'AdminTest',
								parent_id: parent_ids.data.ids,
								user_type_id: userData.data[0].user_type_id
							}
						}, settings.secret);

						let is_change_password = '0';
						if(userData.data[0].is_change_password == '1' && CONSTANTS.NEW_USER_CHANGE_PASSWORD == 1){
							is_change_password = '1';
						}

						let data = {
							name: userData.data[0].name,
							user_name: userData.data[0].user_name,
							token: token,
							user_id: userData.data[0].id,
							user_type_id: userData.data[0].user_type_id,
							is_change_password: is_change_password,
							stack: (userData.data[0].match_stack) ? userData.data[0].match_stack : global._config.match_stack,
							one_click_stack: (userData.data[0].one_click_stack) ? userData.data[0].one_click_stack : global._config.one_click_stack,
							is_main_admin : isMainAdmin
						};
					//console.log(userData.data[0].match_stack);
					await MysqlPool.query('UPDATE users SET is_online = "1" WHERE id = ? LIMIT 1;', [userData.data[0].id]);
					return resultdb(CONSTANTS.SUCCESS, data);
				} else {
					return resultdb(CONSTANTS.ACCESS_DENIED);
				}
			} else {
				return resultdb(CONSTANTS.NOT_FOUND);
			}

		}
	}else{
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
} catch (error) {
		logger.errorlog.error("findUserAndVerifyPassword",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let userLogin = async (data) => {
	try {

		let userData=await getUserByUserName(data.user_name);
		if (userData.statusCode===CONSTANTS.SUCCESS) {
			if (userData.data[0].user_type_id==5 && userData.data[0].close_account==0 && userData.data[0].lock_user==0) {
				let isValidPassword = bcrypt.compareSync(data.password, userData.data[0].password);
				if (isValidPassword) {

					let parent_ids = await getParesntsIds(userData.data[0].id);
					let token = jwt.sign({
						sub: {
							id: userData.data[0].id,
							role: 'AdminTest',
							parent_id: parent_ids.data.ids,
							user_type_id: userData.data[0].user_type_id
						}
					}, settings.secret);

					let is_change_password = '0';
					if(userData.data[0].is_change_password == '1' && CONSTANTS.NEW_USER_CHANGE_PASSWORD == 1){
						is_change_password = '1';
					}
					
					let data = {
						name: userData.data[0].name,
						user_name: userData.data[0].user_name,
						token: token,
						user_id: userData.data[0].id,
						user_type_id: userData.data[0].user_type_id,
						is_change_password: is_change_password,
						is_signup_user: userData.data[0].is_signup_user,
						stack: (userData.data[0].match_stack) ? userData.data[0].match_stack : global._config.match_stack,
						one_click_stack: (userData.data[0].one_click) ? userData.data[0].one_click : global._config.one_click_stack
					};
					//console.log(userData.data[0].match_stack);
					return resultdb(CONSTANTS.SUCCESS, data);
				} else {
					return resultdb(CONSTANTS.ACCESS_DENIED);
				}
			} else {
				return resultdb(CONSTANTS.NOT_FOUND);
			}
		}else{
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("userLogin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let createUserLoginLogs = async (data) => {
	try {

		await MysqlPool.query('UPDATE users SET is_online = "1" WHERE id = ? LIMIT 1;', [data.user_id]);
		let userdetails =await MysqlPool.query('INSERT INTO user_login_logs SET ?',data);
		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails);
		}
	} catch (error) {
		logger.errorlog.error("createUserLoginLogs",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getUserLoginLogs = async (id) => {
	try {
		//SELECT id FROM tableName ORDER BY id DESC LIMIT 1

		let userdetails =await MysqlPool.query('select * from user_login_logs where user_id= ? ORDER BY login_time DESC LIMIT 1',[id]);
		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails);
		}
	} catch (error) {
		logger.errorlog.error("getUserLoginLogs",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateuserStatusLock = async (id) => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_user :'1'
		};
		let childparameter={
			parent_lock_user :'1'
		};
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateuserStatusLock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateuserStatusUnlock = async (id) => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_user :'0'
		};
		let childparameter={
			parent_lock_user :'0'
		};
		//console.log('getChildList ',getChildList);
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateuserStatusUnlock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getOwnChild = async (id, isOwn, search='', page='') => {
	try {
		let condition='';
		let sumcondition='';
		let whereparameter='';
		let whereparametertemp='';
		let limitQry='';
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;
		let conditionParameter=[id];

		if (isOwn) {
			condition=' AND currentuser.id IN (?)';
		}else{
			whereparametertemp=', ROUND(parentuser.balance, 2) AS parent_balance, ROUND(parentuser.freechips, 2) AS parent_freechips ';
			whereparameter=',users AS parentuser';
			condition=' AND currentuser.parent_id=parentuser.id AND currentuser.parent_id IN (?)';
		}

		if(search != ''){
			condition+=' AND (currentuser.name LIKE ? OR currentuser.user_name LIKE ?) ';
			conditionParameter.push('%'+search+'%');
			conditionParameter.push('%'+search+'%');
		}

		if(page != ''){
			limitQry = ' LIMIT ?, ? ';
			conditionParameter.push(offset);
			conditionParameter.push(limit);
		}

		if (isOwn) {
			sumcondition=' id = ?';
		}else{
			sumcondition=' parent_id = ?';
		}

		conditionParameter.push(id);

		let calc = '';
		if(page == 1){
			calc += ' SQL_CALC_FOUND_ROWS ';
		}

		let query=`SELECT ${calc} currentuser.id, currentuser.remark, currentuser.user_name, currentuser.name, currentuser.parent_id, currentuser.mobile, currentuser.user_type_id, currentuser.self_lock_fancy_bet, currentuser.parent_lock_fancy_bet,currentuser.total_balance,ROUND(currentuser.profit_loss,2) AS profit_loss,ROUND(currentuser.freechips,2) AS freechips,
					GREATEST(currentuser.self_lock_user,currentuser.parent_lock_user) lock_user, 
					GREATEST(currentuser.self_lock_betting,currentuser.parent_lock_betting) lock_betting, 
					GREATEST(currentuser.self_lock_fancy_bet,currentuser.parent_lock_fancy_bet) lock_fancy_bet, 
					GREATEST(currentuser.self_lock_settlement,currentuser.parent_lock_settlement) lock_settlement,
					ROUND(IFNULL((
					with recursive chield (id,liability) as ( 
						select   id,liability from users where id= currentuser.id
						union all 
						select     p.id,p.liability from  users p 
						inner join chield  on p.parent_id = chield.id 
					) select sum(liability)  from chield),0), 2) liability,
	 				 (WITH recursive chield (id) AS (
					SELECT id
					FROM users
					WHERE id= currentuser.id UNION ALL
					SELECT p.id
					FROM users p
					INNER JOIN chield ON p.parent_id = chield.id)
					SELECT count(*)
					FROM chield where id !=  currentuser.id) total_chield,
					  ROUND(currentuser.balance, 2) AS balance,ROUND(currentuser.total_balance, 2) AS total_balance, ROUND(currentuser.profit_loss, 2) AS profit_loss, ROUND(currentuser.freechips, 2) AS freechips, ROUND(currentuser.freechips_balance, 2) AS freechips_balance, 
					  
					(SELECT COUNT(*) FROM users a WHERE a.parent_id = currentuser.id) AS child_count
					${whereparametertemp}  
					FROM users AS currentuser ${whereparameter} 
					WHERE (currentuser.self_close_account = "0") ${condition} ORDER BY currentuser.user_type_id, currentuser.name ASC, currentuser.user_name ASC ${limitQry} ; SELECT FOUND_ROWS() AS total;SELECT SUM(ROUND(IFNULL((
					with recursive chield (id,liability) as ( 
						select   id,liability from users where id= currentuser.id
						union all 
						select     p.id,p.liability from  users p 
						inner join chield  on p.parent_id = chield.id 
					) SELECT SUM(liability)
					FROM chield),0), 2)) sum_liability, SUM(ROUND(balance,2))sum_balance, SUM(ROUND(profit_loss,2)) sum_profit_loss, 
					SUM(ROUND(freechips,2)) sum_freechips, SUM(ROUND(total_balance,2)) sum_total_balance
					FROM users AS currentuser WHERE ${sumcondition};`;
	
		//console.log(MysqlPool.format(query, conditionParameter));
		let sportsdetails =await MysqlPool.query(query, conditionParameter);
		return resultdb(CONSTANTS.SUCCESS,sportsdetails);
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getOwnChild",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getUserNameAndPasswordById = async (id) => {
	try {
		let userdetails =await MysqlPool.query('SELECT user_name,password FROM users where id = ?',id);
		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getUserNameAndPasswordById",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let findUserByIdAndVerifyPassword = async (id,password) => {
	try {
		let userData=await getUserNameAndPasswordById(id);
		
		if (userData.statusCode===CONSTANTS.SUCCESS) {
			
			let isValidPassword=bcrypt.compareSync(password,userData.data.password);
			//console.log('isValidPassword  ',isValidPassword);
			if (isValidPassword) {
				let token = jwt.sign({
					sub: {id:userData.data.id,role: 'AdminTest'}
				}, settings.secret);
				let data={
					user_name:userData.data.user_name,
					token:token,
				};
				return resultdb(CONSTANTS.SUCCESS,data);
			}else{
				return resultdb(CONSTANTS.ACCESS_DENIED);
			}
		}else{
			return resultdb(CONSTANTS.NOT_FOUND);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("findUserByIdAndVerifyPassword",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updatePassword = async function(password,id, update_is_change_password = false) {
	try {
		let genSalt=await bcrypt.genSalt(SALT_WORK_FACTOR);
		let hash=await  bcrypt.hash(password, genSalt);
		if(update_is_change_password == true){
			await MysqlPool.query('UPDATE users SET password=?, is_change_password = "0" WHERE id = ?',[hash, id]);
		}else{
			await MysqlPool.query('UPDATE users SET password=? WHERE id = ?',[hash, id]);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updatePassword",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getUserPartnership = async (id) => {
	try {
		let userdetails =await MysqlPool.query('SELECT * FROM partnerships where user_id = ?',id);
		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getUserPartnership",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getClosedUserList = async (data) => {
	try {

		let getChildList=await getChild([data.userid]);

		let  userdetails = await MysqlPool.query('SELECT id,user_name,name,mobile,user_type_id remark FROM users where (self_close_account = "1" OR parent_close_account = "1") AND id IN (?) and user_name like ? LIMIT ? OFFSET ?;', [getChildList,"%"+data.userName+"%", parseInt(data.limit), ((data.pageno - 1) * data.limit)]);

		let total = await MysqlPool.query('SELECT count(1) AS total FROM users where (self_close_account = "1" OR parent_close_account = "1") AND id IN (?) and user_name like ? ;', [getChildList,"%"+data.userName+"%"]);

		let returnRes = {
			list: userdetails,
			total: total[0].total?total[0].total:0
		};
		if (userdetails === null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		} else {
			return resultdb(CONSTANTS.SUCCESS, returnRes);
		}
	} catch (error) {
		logger.errorlog.error("getClosedUserList",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateuserStatusClose = async (user_id, user_data) => {
	try {
		let user_type_id = user_data.data.user_type_id;

		let  field='user_id';
		switch(user_type_id) {
			case 1:
				field = 'admin_id';
				break;
			case 2:
				field = 'master_id';
				break;
			case 3:
				field = 'super_agent_id';
				break;
			case 4:
				field = 'agent_id';
				break;
			default:
			// code block
		}

		let qry = 'SELECT SUM(countVal) AS countVal FROM (SELECT COUNT(*) AS countVal FROM bets_odds WHERE delete_status = "0" AND bet_result_id IS NULL AND ' + field + ' = ? UNION SELECT COUNT(*) AS countVal FROM bets_fancy WHERE delete_status = "0" AND bet_result_id IS NULL AND ' + field + ' = ? ) AS x;';
		let data =await MysqlPool.query(qry, [user_id, user_id]);

		if(data[0].countVal > 0){
			return resultdb(CONSTANTS.SERVER_ERROR, 'Account closing failed: Undecleared odds/fancy bets exists !');
		}else {

			let getChildList = await getChild([user_id]);

			let user_id_list = [...getChildList];
			user_id_list.push(user_id);

			/*if (user_data.data.liability >= 1 || user_data.data.liability <= -1) {
				return resultdb(CONSTANTS.SERVER_ERROR, 'Account closing failed: Child liability not cleared !');
			}*/

			/*if (user_type_id == 5) {
				if (user_data.data.balance >= 1 || user_data.data.balance <= -1) {
					return resultdb(CONSTANTS.SERVER_ERROR, 'Account closing failed: Balance not cleared !');
				}
			}*/

			let getUnsettledUsersData = await getUnsettledUsers(user_id_list);
			if (getUnsettledUsersData.length > 0) {
				return resultdb(CONSTANTS.SERVER_ERROR, 'Account closing failed: Child account not settled !');
			}

			let userparameter = {self_close_account: '1'};
			await updateUser(userparameter, user_id);

			let childparameter = {parent_close_account: '1'};
			if (getChildList.length > 0) {
				await updateUser(childparameter, getChildList);
			}

			return resultdb(CONSTANTS.SUCCESS, 'Account Closed Successfully');
		}
	} catch (error) {
		logger.errorlog.error("updateuserStatusClose",error);
		return resultdb(CONSTANTS.SERVER_ERROR, 'An error occurred to close account !');
	}
};
let updateuserStatusReopen = async (id) => {
	try {
		let getChildList = await getChild([id]);
		let userparameter = {self_close_account : '0'};
		let childparameter = {parent_close_account : '0'};

		await updateUser(userparameter, id);
		if (getChildList.length > 0) {
			await updateUser(childparameter, getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateuserStatusReopen",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateUserByUserId = async function(parameter,condition) {
	try {
		await MysqlPool.query('UPDATE users SET ? WHERE id in  (?)',[parameter, condition]);
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		//console.log('error',error);
		logger.errorlog.error("updateUserByUserId",error);
		return resultdb(CONSTANTS.SERVER_ERROR);
	}
};
let updateUserOneClickStack = async function(parameter,condition) {
	try {
		await MysqlPool.query('UPDATE users SET ? WHERE id in  (?)',[parameter, condition]);
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		//console.log('error',error);
		logger.errorlog.error("updateUserOneClickStack",error);
		return resultdb(CONSTANTS.SERVER_ERROR);
	}
};
let getUserById = async (id) => {
	try {
		let userdetails =await MysqlPool.query('SELECT * FROM users WHERE id = ? LIMIT 1;', id);
		if (userdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getUserById",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateUserStatusBettingLock = async (id, is_child_lock = '') => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_betting :'1'
		};

		if(is_child_lock == 1){
			userparameter={
				parent_lock_betting :'1'
			};
		}

		let childparameter={
			parent_lock_betting :'1'
		};
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateUserStatusBettingLock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateUserStatusBettingUnlock = async (id, is_child_lock = '') => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_betting :'0'
		};

		if(is_child_lock == 1){
			userparameter={
				parent_lock_betting :'0'
			};
		}

		let childparameter={
			parent_lock_betting :'0'
		};
		//console.log('getChildList ',getChildList);
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateUserStatusBettingUnlock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let removeDataDatewise = async (fromDate,toDate) => {
	try {
		let getResult = await MysqlPool.query('CALL sp_remove_data_datewise(?, ?)',[fromDate,toDate]);
		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (error) {
		logger.errorlog.error("removeDataDatewise",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let removeDataWithOutUser = async () => {
	try {
		let getResult = await MysqlPool.query(
			`
			TRUNCATE TABLE account_statements ;
			TRUNCATE TABLE bet_results ;
			TRUNCATE TABLE bets_fancy ;
			TRUNCATE TABLE bets_odds ;
			TRUNCATE TABLE deactive_fancy ;
			TRUNCATE TABLE deactive_match ;
			TRUNCATE TABLE deactive_sport ;
			TRUNCATE TABLE fancy ;
			TRUNCATE TABLE fancy_score_position ;
			TRUNCATE TABLE market_selection ;
			TRUNCATE TABLE markets ;
			TRUNCATE TABLE matches ;
			TRUNCATE TABLE notification_read ;
			TRUNCATE TABLE notifications ;
			TRUNCATE TABLE odds_profit_loss ;
			TRUNCATE TABLE series ;
			TRUNCATE TABLE settlement_collections ;
			TRUNCATE TABLE super_admin_commission_settlements ;
			TRUNCATE TABLE user_favourite ;
			TRUNCATE TABLE user_login_logs ;
			TRUNCATE TABLE user_profit_loss ;
			update users set total_settled_amount=0, total_super_admin_commission=0,total_super_admin_commission_settled=0;
			`
		);
		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (error) {
		logger.errorlog.error("removeDataWithOutUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let removeOldData = async () => {
	try {
		await MysqlPool.query('CALL sp_remove_old_data()');
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		//console.log(error)
		logger.errorlog.error("removeOldData",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getChildCount = async (user_id) => {

	try {
		let childCountQry =await MysqlPool.query(`SELECT COUNT(*) AS childCount FROM users where parent_id = ?`,[user_id]);
		return resultdb(CONSTANTS.SUCCESS, childCountQry[0].childCount);
	} catch (error) {
		logger.errorlog.error("getChildCount",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let logoutAllUser = async () => {
	try {

		await MysqlPool.query('UPDATE user_login_logs INNER JOIN users ON (users.id = user_login_logs.user_id) SET user_login_logs.is_online = "0", user_login_logs.logout_time = UNIX_TIMESTAMP() WHERE users.user_type_id != 1;');
		await MysqlPool.query('UPDATE users SET is_online = "0" WHERE user_type_id != 1;');
		return resultdb(CONSTANTS.SUCCESS, 'SUCCESS');

	} catch (error) {
		logger.errorlog.error("logoutAllUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getOnlineUsers = async (user_id, page) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;

		let query = 'SELECT ';
		if(page == 1){
			query += ' SQL_CALC_FOUND_ROWS ';
		}

		query += ' a.user_id, a.login_time, a.logout_time, a.is_online, a.ip_adress, a.browser_info, a.device_info, b.name, b.user_name FROM user_login_logs AS a INNER JOIN users AS b ON(a.user_id = b.id) WHERE a.is_online = "1" AND a.user_id IN (WITH recursive chield (id) AS (SELECT id FROM users WHERE id = ? UNION ALL SELECT p.id FROM users p INNER JOIN chield ON p.parent_id = chield.id) SELECT id FROM chield) ORDER BY a.id DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS total;';

		let resFromDB = await MysqlPool.query(query, [user_id, offset, limit]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("getOnlineUsers",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let verifyAdmin = async (id, password) => {
	try {
		let userdetails = await MysqlPool.query(`SELECT * FROM users where id = ? AND user_type_id = ? LIMIT 1`,[id, CONSTANTS.USER_TYPE_ADMIN]);
		if (userdetails.length > 0) {
			let isValidPassword = bcrypt.compareSync(password, userdetails[0].password);
			if (isValidPassword) {
				return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
			}else{
				return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
			}
		}else{
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("verifyAdmin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let verifyUser = async (id, password) => {
	try {
		let userdetails = await MysqlPool.query(`SELECT * FROM users where id = ?  LIMIT 1`,[id]);
		if (userdetails.length > 0) {
			let isValidPassword = bcrypt.compareSync(password, userdetails[0].password);
			if (isValidPassword) {
				return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
			}else{
				return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
			}
		}else{
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("verifyUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateUserStatusFancyBetLock = async (id, is_child_lock = '') => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_fancy_bet :'1'
		};

		if(is_child_lock == 1){
			userparameter={
				parent_lock_fancy_bet :'1'
			};
		}

		let childparameter={
			parent_lock_fancy_bet :'1'
		};
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateUserStatusFancyBetLock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateUserStatusFancyBetUnlock = async (id, is_child_lock = '') => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_fancy_bet :'0'
		};

		if(is_child_lock == 1){
			userparameter={
				parent_lock_fancy_bet :'0'
			};
		}

		let childparameter={
			parent_lock_fancy_bet :'0'
		};

		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateUserStatusFancyBetUnlock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let searchUser = async (user_id, user_type_id, search='', page='') => {
	try {
		let calc = '';
		let limitQry='';
		let limit = CONSTANTS.LIMIT;
		let offset = 0;

		if(page != ''){
			offset = (page - 1) * limit;
			limitQry = ` LIMIT ${offset}, ${limit} `;

		}

		if(page == 1){
			calc = ' SQL_CALC_FOUND_ROWS ';
		}

		let condition = '';
		if(search != ''){
			condition = ' AND (u.name LIKE ? OR u.user_name LIKE ?) ';
		}

		let query = `SELECT ${calc} u.id, u.user_name, u.name, u.parent_id, u.mobile, u.user_type_id, u.self_lock_fancy_bet, u.parent_lock_fancy_bet,
					GREATEST(u.self_lock_user,u.parent_lock_user) lock_user, 
					GREATEST(u.self_lock_betting,u.parent_lock_betting) lock_betting, 
					GREATEST(u.self_lock_fancy_bet,u.parent_lock_fancy_bet) lock_fancy_bet, 
					GREATEST(u.self_lock_settlement,u.parent_lock_settlement) lock_settlement, 
					ROUND(IFNULL((
						WITH recursive chield (id,liability) AS ( 
						SELECT id, liability FROM users WHERE id = u.id
						UNION ALL
						SELECT p.id, p.liability FROM users p 
						INNER JOIN chield ON p.parent_id = chield.id 
					) SELECT SUM(liability) FROM chield), 0), 2) liability, 
					ROUND(u.balance, 2) AS balance,ROUND(u.total_balance, 2) AS total_balance, ROUND(u.profit_loss, 2) AS profit_loss, ROUND(u.freechips, 2) AS freechips, ROUND(u.freechips_balance, 2) AS freechips_balance,
					(SELECT COUNT(*) FROM users a WHERE a.parent_id = u.id) AS child_count,
					ROUND(u4.balance, 2) AS parent_balance,u1.id as admin_id, u1.user_name as admin_user_name,u1.name as admin_name, u2.id as master_id, u2.user_name as master_user_name, u2.name as master_name, u3.id as super_agent_id, u3.user_name as super_agent_user_name, u3.name as super_agent_name, u4.id as agent_id, u4.user_name as agent_user_name, u4.name as agent_name
					FROM users AS u LEFT JOIN users u4 ON(u4.id = u.parent_agent_id) LEFT JOIN users u3 ON(u3.id = u.parent_super_agent_id) LEFT JOIN users u2 ON(u2.id = u.parent_master_id) LEFT JOIN users u1 ON(u1.id = u.parent_admin_id) 
					WHERE u.id IN(WITH recursive chield (id) AS (SELECT id FROM users WHERE id=? UNION ALL SELECT p.id FROM users p INNER JOIN chield  ON p.parent_id = chield.id) SELECT id AS ids FROM chield WHERE id != ?) AND (u.self_close_account = "0") ${condition} ORDER BY u.name ASC, u.user_name ASC ${limitQry}; SELECT FOUND_ROWS() AS total;`;
		//console.log(query);
		let sportsdetails =await MysqlPool.query(query, [user_id, user_id, '%'+search+'%', '%'+search+'%']);
		//console.log(sportsdetails);
		return resultdb(CONSTANTS.SUCCESS,sportsdetails);
	} catch (error) {
		logger.errorlog.error("searchUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let searchUserForAutoSuggest = async (user_id, user_type_id, search='') => {
	try {
		let condition = '';
		if(search != ''){
			condition = ' AND (u.name LIKE ? OR u.user_name LIKE ?) ';
		}

		let query = `SELECT  u.id, u.user_name, u.name, u.parent_id, u.user_type_id
					FROM users AS u 
					WHERE u.id IN(WITH recursive chield (id) AS (SELECT id FROM users WHERE id=? UNION ALL SELECT p.id FROM users p INNER JOIN chield  ON p.parent_id = chield.id) SELECT id AS ids FROM chield WHERE id != ?) AND (u.self_close_account = "0") ${condition} ORDER BY u.name ASC, u.user_name ASC;`;

		let userData = await MysqlPool.query(query, [user_id, user_id, '%'+search+'%', '%'+search+'%']);
		return resultdb(CONSTANTS.SUCCESS,userData);
	} catch (error) {
		logger.errorlog.error("searchUserForAutoSuggest",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getUnsettledUsers = async (user_id_list) => {
	try {
		let  query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(admin_pl + admin_commission + super_admin_commission + super_admin_commission_admin_part), 0) + u.total_settled_amount), 2) AS settlement_amount
FROM users u
LEFT JOIN user_profit_loss ON u.id=user_profit_loss.master_id
WHERE u.user_type_id = 2 AND u.id IN (?) 
GROUP BY u.id HAVING (settlement_amount >= 1 OR settlement_amount <= -1)
UNION ALL
SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(master_pl+admin_pl + master_commission + admin_commission + super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part), 0) + u.total_settled_amount), 2) AS settlement_amount
                    FROM users u
LEFT JOIN user_profit_loss ON u.id=user_profit_loss.super_agent_id
                    WHERE u.user_type_id = 3 AND u.id IN (?) 
                    GROUP BY u.id HAVING (settlement_amount >= 1 OR settlement_amount <= -1) 
UNION ALL
SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(super_agent_pl+master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part + super_admin_commission_super_agent_part), 0) + u.total_settled_amount), 2) AS settlement_amount 
                    FROM users u
LEFT JOIN user_profit_loss ON u.id=user_profit_loss.agent_id
                    WHERE u.user_type_id = 4 AND u.id IN (?)
                    GROUP BY u.id HAVING (settlement_amount >= 1 OR settlement_amount <= -1) 
UNION ALL 
SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(agent_pl + super_agent_pl + master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + agent_commission + super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part + super_admin_commission_super_agent_part + super_admin_commission_agent_part), 0) + u.total_settled_amount), 2) AS settlement_amount
                    FROM users u
LEFT JOIN user_profit_loss ON u.id=user_profit_loss.user_id
                    WHERE u.user_type_id = 5 AND u.id IN (?) 
                    GROUP BY u.id HAVING (settlement_amount >= 1 OR settlement_amount <= -1) ;`;

		let resFromDB = await MysqlPool.query(query, [user_id_list, user_id_list, user_id_list, user_id_list]);

		return resFromDB;
	} catch (error) {
		logger.errorlog.error("getUnsettledUsers",error);
		return [];
	}
};

let deleteClosedAccount = async (user_id) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();

		let query = 'SELECT * FROM users WHERE id = ? AND (self_close_account = "1" OR parent_close_account = "1");';
		let resFromDB = await MysqlPool.query(query, [user_id]);

		if(resFromDB.length > 0) {

			let user_id_list = await getChild([user_id]);
			user_id_list.push(user_id);
			await conn.query('DELETE FROM notification_read WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM user_favourite WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM deactive_fancy WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM deactive_match WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM deactive_sport WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM user_login_logs WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM account_statements WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM bets_fancy WHERE user_id IN (?) OR agent_id IN (?) OR super_agent_id IN (?) OR master_id IN (?);', [user_id_list, user_id_list, user_id_list, user_id_list]);
			await conn.query('DELETE FROM bets_odds WHERE user_id IN (?) OR agent_id IN (?) OR super_agent_id IN (?) OR master_id IN (?);', [user_id_list, user_id_list, user_id_list, user_id_list]);
			await conn.query('DELETE FROM fancy_score_position WHERE user_id IN (?) OR agent_id IN (?) OR super_agent_id IN (?) OR master_id IN (?);', [user_id_list, user_id_list, user_id_list, user_id_list]);
			await conn.query('DELETE FROM odds_profit_loss WHERE user_id IN (?) OR agent_id IN (?) OR super_agent_id IN (?) OR master_id IN (?);', [user_id_list, user_id_list, user_id_list, user_id_list]);
			await conn.query('DELETE FROM partnerships WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM settlement_collections WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM user_profit_loss WHERE user_id IN (?) OR agent_id IN (?) OR super_agent_id IN (?) OR master_id IN (?);', [user_id_list, user_id_list, user_id_list, user_id_list]);
			await conn.query('DELETE FROM user_setting_sport_wise WHERE user_id IN (?);', [user_id_list]);
			await conn.query('DELETE FROM users WHERE id IN (?);', [user_id_list]);


			await conn.commit(); conn.release();
			return resultdb(CONSTANTS.SUCCESS, 'Account deleted successfully');
		}else{
			await conn.commit(); conn.release();
			return resultdb(CONSTANTS.SERVER_ERROR, 'Close account before deleting !');
		}
	} catch (error) {
		logger.errorlog.error("deleteClosedAccount",error);
		await conn.rollback();conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, 'An error occurred to delete account !');
	}
};

let updateUserStatusSettlementLock = async (id, is_child_lock = '') => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_settlement :'1'
		};

		if(is_child_lock == 1){
			userparameter={
				parent_lock_settlement :'1'
			};
		}

		let childparameter={
			parent_lock_settlement :'1'
		};
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateUserStatusSettlementLock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateUserStatusSettlementUnlock = async (id, is_child_lock = '') => {
	try {
		let getChildList=await getChild([id]);
		let userparameter={
			self_lock_settlement :'0'
		};

		if(is_child_lock == 1){
			userparameter={
				parent_lock_settlement :'0'
			};
		}

		let childparameter={
			parent_lock_settlement :'0'
		};
		await updateUser(userparameter,id);
		if (getChildList.length>0) {
			await updateUser(childparameter,getChildList);
		}
		return resultdb(CONSTANTS.SUCCESS);
	} catch (error) {
		logger.errorlog.error("updateUserStatusSettlementUnlock",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let checkUsernameExists = async (userName) => {
	try {
		let returnData = await MysqlPool.query('SELECT COUNT(id) AS total FROM users where user_name = ? LIMIT 1;', userName);
		return resultdb(CONSTANTS.SUCCESS, returnData[0].total);
	} catch (error) {
		logger.errorlog.error("checkUsernameExists",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAdminDetail = async () => {
	try {
		let returnData = await MysqlPool.query('SELECT id, user_type_id FROM users where user_type_id = 1 LIMIT 1;');
		if (returnData.length > 0) {
			return resultdb(CONSTANTS.SUCCESS, returnData[0]);
		} else {
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("getAdminDetail",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let signUp = async (data) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();

		let genSalt = await bcrypt.genSalt(SALT_WORK_FACTOR);
		let hash = await bcrypt.hash(data.password, genSalt);
		let data1 = {
			user_name: data.user_name,
			name: data.name,
			parent_id: data.parent_id,
			user_type_id: data.user_type_id,
			create_at: globalFunction.currentDate(),
			update_at:globalFunction.currentDate(),
			password: hash,
			parent_user_type_id: data.parent_user_type_id,
			parent_admin_id: data.parent_admin_id,
			mobile: data.mobile,
			is_signup_user: '1'
		};

		let createdUserData = await conn.query('INSERT INTO users  SET ?', [data1]);
		let lastID= createdUserData[0]['insertId'];

		let getParentPartnership = await conn.query('SELECT a.*, b.bet_delay, b.session_delay, odds_max_stack, odds_min_stack, session_max_stack, session_min_stack, max_profit, min_exposure, max_exposure, match_commission, session_commission, super_admin_commission, bookmaker_market_commission, winning_limit, b.pdc_charge, b.pdc_refund FROM partnerships a LEFT JOIN user_setting_sport_wise b on(a.user_id = b.user_id AND a.sport_id = b.sport_id) WHERE a.user_id = ?', [data.parent_id]);

		if (getParentPartnership && getParentPartnership.length > 0) {
			getParentPartnership = JSON.parse(JSON.stringify(getParentPartnership[0]));
			let insertUserSettingSportWise = [];
			let testdata = await getParentPartnership.map((element)=>{

				let bet_delay = element.bet_delay;
				let session_delay = element.session_delay;
				let super_admin_commission = 0;
				let pdc_charge = element.pdc_charge;
				let pdc_refund = element.pdc_refund;

				if((data.user_type_id == 2 || data.user_type_id == 3 || data.user_type_id == 4) && (CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE == 1 || CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE == 2)) {
					super_admin_commission = element.super_admin_commission;
				}
				else if(data.user_type_id == 5 && CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE == 1) {
					super_admin_commission = element.super_admin_commission;
				}

				insertUserSettingSportWise.push([lastID, element.sport_id, data.parent_id, bet_delay, session_delay, element.odds_max_stack, element.odds_min_stack, element.session_max_stack, element.session_min_stack, element.max_profit, element.min_exposure, element.max_exposure, element.match_commission, element.session_commission, super_admin_commission, element.bookmaker_market_commission, element.winning_limit, pdc_charge, pdc_refund]);
				return [lastID,element.sport_id, data.parent_id,data.user_type_id,element.admin,element.master,element.super_agent,element.agent,globalFunction.currentDate(),globalFunction.currentDate()];
			});

			await conn.query('INSERT INTO user_setting_sport_wise (user_id, sport_id, parent_id, bet_delay, session_delay, odds_max_stack, odds_min_stack, session_max_stack, session_min_stack, max_profit, min_exposure, max_exposure, match_commission, session_commission, super_admin_commission, bookmaker_market_commission, winning_limit, pdc_charge, pdc_refund) VALUES ?',[insertUserSettingSportWise]);

			await conn.query('INSERT INTO partnerships (user_id, sport_id, parent_id, user_type_id,admin,master,super_agent,agent, created_at,updated_at) VALUES ?',[testdata]);
			await conn.commit();
			conn.release();
			return resultdb(CONSTANTS.SUCCESS,getParentPartnership);
		} else {
			await conn.rollback();conn.release();
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("signUp",error);
		await conn.rollback();conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getSignupUserList = async (search='', page= 1) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;
		let condition = '';
		let conditionParameter = [];

		if(search != ''){
			condition += ' AND (name LIKE ? OR user_name LIKE ?) ';
			conditionParameter.push('%'+search+'%');
			conditionParameter.push('%'+search+'%');
		}

		let calc = '';
		if(page == 1){
			calc += ' SQL_CALC_FOUND_ROWS ';
		}

		let query = `SELECT ${calc} id, user_name, name, mobile
			FROM users WHERE is_signup_user = '1' ${condition} ORDER BY id DESC LIMIT ?, ?; 
			SELECT FOUND_ROWS() AS total;`;
		conditionParameter.push(offset);
		conditionParameter.push(limit);
		let resultData =await MysqlPool.query(query, conditionParameter);
		return resultdb(CONSTANTS.SUCCESS,resultData);
	} catch (error) {
		logger.errorlog.error("getSignupUserList",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	getChild,
    getAllUsers,
	getUserByUserName,
	createUser,
	findUserAndVerifyPassword,
	getUserByUserId,
	updateuserStatusLock,
	updateuserStatusUnlock,
	updateuserStatusClose,
	updateuserStatusReopen,
	getOwnChild,
	findUserByIdAndVerifyPassword,
	userLogin,
	getUserNameAndPasswordById,
	updatePassword,
	getClosedUserList,
	getUserPartnership,
	updateUserByUserId,
	getUserById,
	updateUserStatusBettingLock,
	updateUserStatusBettingUnlock,
	getParesntsIds,
	getChieldIdsWithOwn,
	removeDataDatewise,
	removeOldData,
	getUserBasicDetails,
	updateUserOneClickStack,
	createUserLoginLogs,
	getUserLoginLogs,
	getChildCount,
	logoutAllUser,
	getOnlineUsers,
	verifyAdmin,
	verifyUser,
	updateUserStatusFancyBetLock,
	updateUserStatusFancyBetUnlock,
	searchUser,
	searchUserForAutoSuggest,
	getUnsettledUsers,
	deleteClosedAccount,
	updateUserStatusSettlementLock,
	updateUserStatusSettlementUnlock,
	removeDataWithOutUser,
	checkUsernameExists,
	getAdminDetail,
	signUp,
	getSignupUserList,
	getUserSettingSportWiseByUserId
};
