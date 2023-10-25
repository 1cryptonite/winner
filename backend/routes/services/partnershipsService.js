const	globalFunction = require('../../utils/globalFunction');
const	CONSTANTS = require('../../utils/constants');
const	userService = require('./userService');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;
const MysqlPool = require('../../db');


let getPartnershipByUserId = async (id,sport_id) => {
	try {

		let partnershipsdetails =await MysqlPool.query(`
		    SELECT *,
                CASE 
                     WHEN user_type_id = 1 THEN admin 
                     WHEN user_type_id = 2 THEN master 
                     WHEN user_type_id = 3 THEN super_agent 
                     WHEN user_type_id = 4 THEN agent 
                END AS partnership ,user_type_id
            FROM partnerships where user_id = ? and sport_id = ?
		`,[id,sport_id]);
		//console.log(partnershipsdetails);
		if (partnershipsdetails.length<=0) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, partnershipsdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getPartnershipByUserId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getPartnershipListByUserId = async (user_id, user_type_id) => {
	try {

		let partnershipsdetails = [];
		if(user_type_id == 1){
			query = 'SELECT p.user_id,p.sport_id ,s.name,p.user_type_id, CASE WHEN p.user_type_id = 1 THEN p.admin WHEN p.user_type_id = 2 THEN p.master WHEN p.user_type_id = 3 THEN p.super_agent WHEN p.user_type_id = 4 THEN p.agent END as partnership, CASE WHEN p1.user_type_id = 1 THEN p1.admin WHEN p1.user_type_id = 2 THEN p1.master WHEN p1.user_type_id = 3 THEN p1.super_agent WHEN p1.user_type_id = 4 THEN p1.agent END AS parent_partnership FROM partnerships p inner join sports s on s.sport_id=p.sport_id LEFT JOIN partnerships p1 ON(p.parent_id = p1.user_id AND p.sport_id=p1.sport_id) where p.user_id = ? AND s.is_active = "1" ORDER BY s.order_by ASC';
			partnershipsdetails = await MysqlPool.query(query,[user_id]);
		}else{
			let parent_ids = await userService.getParesntsIds(user_id);
			parent_ids = parent_ids.data.ids;
			query = 'SELECT p.user_id,p.sport_id ,s.name,p.user_type_id, CASE WHEN p.user_type_id = 1 THEN p.admin WHEN p.user_type_id = 2 THEN p.master WHEN p.user_type_id = 3 THEN p.super_agent WHEN p.user_type_id = 4 THEN p.agent END as partnership, CASE WHEN p1.user_type_id = 1 THEN p1.admin WHEN p1.user_type_id = 2 THEN p1.master WHEN p1.user_type_id = 3 THEN p1.super_agent WHEN p1.user_type_id = 4 THEN p1.agent END AS parent_partnership FROM partnerships p inner join sports s on s.sport_id=p.sport_id LEFT JOIN partnerships p1 ON(p.parent_id = p1.user_id AND p.sport_id=p1.sport_id) LEFT JOIN deactive_sport AS ds ON(s.sport_id = ds.sport_id AND ds.user_id IN(?)) where p.user_id = ? AND s.is_active = "1" AND ds.id IS NULL ORDER BY s.order_by ASC;';
			partnershipsdetails = await MysqlPool.query(query,[parent_ids.split(','), user_id]);
		}

        if (partnershipsdetails.length <= 0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, partnershipsdetails);
        }
	} catch (error) {
		logger.errorlog.error("getPartnershipListByUserId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

/**
 *
 * @param userId
 * @param sportId
 * @param partnership
 * @returns {Promise<{statusCode, data}>}
 */
let validatePartnership = async (userId,sportId,partnership) => {

        let  query=`SELECT p.user_id,p.sport_id,p.user_type_id,
            CASE
                WHEN p.user_type_id = 1 THEN p.admin
                WHEN p.user_type_id = 2 THEN p.master
                WHEN p.user_type_id = 3 THEN p.super_agent
                WHEN p.user_type_id = 4 THEN p.agent
            END AS partnership
        FROM partnerships p

        WHERE  sport_id= ? and  user_id in (select id from users where parent_id = ?) having partnership > ?` ;

        let partnershipsdetails =await MysqlPool.query(query,[sportId,userId,partnership]);

        if (partnershipsdetails.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, partnershipsdetails);
        }

};


/**
 *
 * @param userId
 * @param sportId
 * @param sartnershipId
 * @returns {Promise<{statusCode, data}>}
 */
let updatePartnershipByUserAndSportId = async (user_id,sportId,partnership,user_type_id, parent_user_type_id) => {
    try {

        let chieldIds = await userService.getChieldIdsWithOwn(user_id);

        let  query='UPDATE partnerships SET ';
        switch(user_type_id) {
            case 1:
                query+=' admin= '+partnership+' , master = admin-('+partnership+'- master)';
                break;
            case 2:
                query+=' admin= admin-('+partnership+'), master = master+('+partnership+')';
                break;
			case 3:
				if (parent_user_type_id == 1) {
					query += ' admin= admin-(' + partnership + '), super_agent = super_agent+(' + partnership + ')';
					break;
				}
				else {
					query += ' master= master-(' + partnership + '), super_agent = super_agent+(' + partnership + ')';
					break;
				}
			case 4:
				if (parent_user_type_id == 1) {
					query += ' admin= admin-(' + partnership + '), agent = agent+(' + partnership + ')';
					break;
				}
				else if (parent_user_type_id == 2) {
					query += ' master= master-(' + partnership + '), agent = agent+(' + partnership + ')';
					break;
				} else {
					query += ' super_agent= super_agent-(' + partnership + '), agent = agent+(' + partnership + ')';
					break;
				}
            default:
            // code block
        }


         query+=` WHERE user_id  in (${chieldIds.data.ids}) and sport_id= ${sportId} `;

        //console.log(query);
        //return false;

        let partnershipsdetails =await MysqlPool.query(query);
        if (partnershipsdetails.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, partnershipsdetails);
        }
    } catch (error) {
		logger.errorlog.error("updatePartnershipByUserAndSportId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let checkPartnershipUpdateAllow = async (user_id, user_type_id, sportIds) => {
	try {
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

		let qry = 'SELECT SUM(countVal) AS countVal FROM (SELECT COUNT(*) AS countVal FROM bets_odds WHERE sport_id IN(?) AND delete_status = "0" AND bet_result_id IS NULL AND ' + field + ' = ? UNION SELECT COUNT(*) AS countVal FROM bets_fancy WHERE sport_id IN(?) AND delete_status = "0" AND bet_result_id IS NULL AND ' + field + ' = ? ) AS x;';
		let data =await MysqlPool.query(qry, [sportIds, user_id, sportIds, user_id]);

		if(data[0].countVal > 0){
			return resultdb(CONSTANTS.SUCCESS, false);
		}else{
			return resultdb(CONSTANTS.SUCCESS, true);
		}

	} catch (error) {
		logger.errorlog.error("checkPartnershipUpdateAllow",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let checkParentPartnership = async (userId, sportId, partnership) => {

	let  query=`SELECT p.user_id, p.sport_id, p.user_type_id,
            CASE
                WHEN p.user_type_id = 1 THEN p.admin
                WHEN p.user_type_id = 2 THEN p.master
                WHEN p.user_type_id = 3 THEN p.super_agent
                WHEN p.user_type_id = 4 THEN p.agent
            END AS partnership 
		FROM partnerships p INNER JOIN users u ON(u.parent_id = p.user_id) 
		WHERE u.id = ? AND sport_id = ?
		HAVING partnership < ? LIMIT 1;` ;

	let result = await MysqlPool.query(query,[userId, sportId, partnership]);

	if (result.length > 0) {
		return resultdb(CONSTANTS.NOT_FOUND, result[0]);
	}else{
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	}

};



module.exports = {
    updatePartnershipByUserAndSportId,
	getPartnershipByUserId,
	getPartnershipListByUserId,
    validatePartnership,
	checkPartnershipUpdateAllow,
	checkParentPartnership
};
