const MysqlPool = require('../../db');
const	globalFunction = require('../../utils/globalFunction');
const	CONSTANTS = require('../../utils/constants');
const	userModel = require('../../routes/model/userModel');
const	userService = require('../../routes/services/userService');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

let getAllSports = async (data) => {
	try {

		let userData = userModel.getUserData();
		let userId = userData.id;
		let userTypeId = userData.user_type_id;
		let parentIds = userData.parent_id;

		let sportsdetails=[];

		if(userTypeId == 1) {
			if (data.limit && data.pageno) {
				sportsdetails = await MysqlPool.query('SELECT SQL_CALC_FOUND_ROWS *, is_active AS is_self_actived FROM sports order by order_by asc LIMIT ? OFFSET ?; SELECT FOUND_ROWS() AS total;', [data.limit, ((data.pageno - 1) * data.limit)]);
			} else if (data.status) {
				sportsdetails = await MysqlPool.query('SELECT *, is_active AS is_self_actived FROM sports WHERE sports.is_active = "1" order by order_by asc; SELECT FOUND_ROWS() AS total;');
			} else {
				sportsdetails = await MysqlPool.query('SELECT *, is_active AS is_self_actived FROM sports order by order_by asc; SELECT FOUND_ROWS() AS total;');
			}
		}else{
			if (data.limit && data.pageno) {
				sportsdetails = await MysqlPool.query('SELECT SQL_CALC_FOUND_ROWS a.*, (CASE WHEN (c.id IS NULL) THEN "1" ELSE "0" END) AS is_self_actived FROM sports AS a LEFT JOIN deactive_sport AS b ON(a.sport_id = b.sport_id AND b.user_id IN(?)) LEFT JOIN deactive_sport AS c ON(a.sport_id = c.sport_id AND c.user_id = ?) WHERE a.is_active = "1" AND b.id IS NULL order by a.order_by asc LIMIT ? OFFSET ?; SELECT FOUND_ROWS() AS total;', [parentIds.split(','), userId, data.limit, ((data.pageno - 1) * data.limit)]);
			} else {
				sportsdetails = await MysqlPool.query('SELECT a.*, (CASE WHEN (c.id IS NULL) THEN "1" ELSE "0" END) AS is_self_actived FROM sports AS a LEFT JOIN deactive_sport AS b ON(a.sport_id = b.sport_id AND b.user_id IN(?)) LEFT JOIN deactive_sport AS c ON(a.sport_id = c.sport_id AND c.user_id = ?) WHERE a.is_active = "1" AND b.id IS NULL order by a.order_by asc; SELECT FOUND_ROWS() AS total;', [parentIds.split(','), userId]);
			}
		}

		let returnRes={
			list:sportsdetails[0],
			total:sportsdetails[1][0].total
		};

		if (sportsdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, returnRes);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getAllSports",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getSportSetting = async (id) => {
    try {
		let qry = 'SELECT * FROM sports where sport_id = ? LIMIT 1;';
        let sportsdetails= await MysqlPool.query(qry,[id]);
        if (sportsdetails===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, sportsdetails[0]);
        }
    } catch (error) {
		logger.errorlog.error("getSportSetting",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let createSports = async (data) => {
    const conn = await connConfig.getConnection();
	try {
        await conn.beginTransaction();
		let resFromDB = await conn.query('INSERT INTO sports SET ?',data);

		await conn.query('INSERT INTO user_setting_sport_wise (sport_id, user_id, parent_id) (SELECT ? AS sport_id, a.id AS user_id, a.parent_id FROM users AS a LEFT JOIN user_setting_sport_wise AS b ON(a.id = b.user_id AND b.sport_id = ?) WHERE b.id IS NULL ORDER BY a.id ASC);', [data.sport_id, data.sport_id]);

		await conn.query('INSERT INTO partnerships (user_type_id, user_id, parent_id, sport_id, admin, master, super_agent, agent, created_at, updated_at) (SELECT a.user_type_id, a.id AS user_id, a.parent_id, ? AS sport_id, 100, 0, 0, 0, UNIX_TIMESTAMP(), UNIX_TIMESTAMP() FROM users AS a LEFT JOIN user_setting_sport_wise AS b ON(a.id = b.user_id AND b.sport_id = ?) WHERE b.id IS NULL ORDER BY a.id ASC);', [data.sport_id.toString(), data.sport_id.toString()]);

		await conn.commit();conn.release();
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		//console.log('errrr', error);
		logger.errorlog.error("createSports",error);
        await conn.rollback();conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateSportsStatus = async (sport_id) => {
	try {
		let resFromDB = await MysqlPool.query('UPDATE sports SET is_active = IF(is_active=?, ?, ?) WHERE sport_id = ? ',['1','0','1',sport_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateSportsStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateSportsSetting = async (data,sport_id) => {
    try {
        let resFromDB = await MysqlPool.query('UPDATE sports  SET min_odds_limit = ? , max_odss_limit=?, pdc_charge = ?, pdc_refund=? WHERE sport_id =?',[data.min_odds_limit,data.max_odss_limit,data.pdc_charge,data.pdc_refund,sport_id]);

        return resultdb(CONSTANTS.SUCCESS, resFromDB);
    } catch (error) {
		logger.errorlog.error("updateSportsSetting",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let insertIntoDeactiveSport = async (id) => {
	try {
		//console.log('datadata  ',id);
		let resFromDB = await MysqlPool.query('UPDATE sports  SET is_active = IF(is_active=?, ?, ?) WHERE id in  (?)',['1','0','1',id]);
		//let resFromDB=await Markets.create(data,{isNewRecord:true});
		//console.log('resFromDB  ',resFromDB);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("insertIntoDeactiveSport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getDeactiveSport = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('SELECT user_id,sport_id FROM deactive_sport where user_id = ? and sport_id = ?',[data.user_id,parseInt(data.sport_id)]);
		if (resFromDB.length>0) {
			return resultdb(CONSTANTS.SUCCESS, resFromDB);
		}else{
			return resultdb(CONSTANTS.NOT_FOUND);
		}
	} catch (error) {
		logger.errorlog.error("getDeactiveSport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let createDeactiveSport = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('INSERT INTO deactive_sport SET ?',[data]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("createDeactiveSport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let deleteDeactiveSport = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('DELETE FROM deactive_sport WHERE user_id=? AND sport_id=?',[data.user_id,data.sport_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("deleteDeactiveSport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getSportByListOfID = async (idlist) => {
	try {
		let sportDetails =await MysqlPool.query('SELECT * FROM sports  where sport_id  in  (?)',[idlist]);
		if (sportDetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, sportDetails);
		}
	} catch (error) {
		logger.errorlog.error("getSportByListOfID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getBookmakerAllowedSports = async () => {
	try {
		let userData = userModel.getUserData();
		let userId = userData.id;
		let userTypeId = userData.user_type_id;
		let parentIds = userData.parent_id;

		let sportsdetails=[];
		if(userTypeId == 1) {
				sportsdetails = await MysqlPool.query('SELECT * FROM sports WHERE sports.is_active = "1" AND sports.is_allow_bookmaker_market = "1" ORDER BY order_by asc;');
		}else{
				sportsdetails = await MysqlPool.query('SELECT a.* FROM sports AS a LEFT JOIN deactive_sport AS b ON(a.sport_id = b.sport_id AND b.user_id IN(?)) LEFT JOIN deactive_sport AS c ON(a.sport_id = c.sport_id AND c.user_id = ?) WHERE a.is_active = "1" AND a.is_allow_bookmaker_market = "1" AND b.id IS NULL ORDER BY a.order_by asc;', [parentIds.split(','), userId]);
		}
		return resultdb(CONSTANTS.SUCCESS, sportsdetails);
	} catch (error) {
		logger.errorlog.error("getBookmakerAllowedSports",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	getAllSports,
    getSportSetting,
	createSports,
	updateSportsStatus,
	insertIntoDeactiveSport,
	deleteDeactiveSport,
	getDeactiveSport,
	createDeactiveSport,
    updateSportsSetting,
	getSportByListOfID,
	getBookmakerAllowedSports
};
