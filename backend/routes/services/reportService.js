const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let profitLossMatchWise = async (user_id,user_type_id,sport_id=0,match_id=0,market_id=0,to_date=0,from_date=0) => {
	try {

		let  query='select *, (CASE WHEN (market_type = "1") THEN (select group_concat(market_id, "_", selection_id) from market_selection where match_id = aa.match_id and market_id = aa.market_id and market_type = "1") ELSE market_id END) as market_selection_string from (select ';
		let whereCondition = ' where 1=1 ';
		let groupByCondition = ' ';

		switch(user_type_id) {
		case 1:
			query+=' match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+super_admin_commission_admin_part - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(super_admin_commission_admin_part), 2) AS super_admin_commission, type as market_type, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl';
			whereCondition+= ' and admin_id= '+user_id;
			break;
		case 2:
			query+=' match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(master_pl), 2) AS player_p_l, ROUND(sum(master_pl+admin_pl+admin_commission+master_commission+super_admin_commission+super_admin_commission_admin_part+super_admin_commission_master_part - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(admin_pl+admin_commission+super_admin_commission+super_admin_commission_admin_part - master_pdc_charge - master_pdc_refund), 2) AS upline_p_l, ROUND(sum(master_commission), 2) AS super_comm, ROUND(sum(super_admin_commission_master_part), 2) AS super_admin_commission, type as market_type, ROUND(sum( - super_agent_pdc_charge - super_agent_pdc_refund + master_pdc_charge + master_pdc_refund), 2) AS pdc_pl';
			whereCondition+= ' and master_id= '+user_id;
			break;
		case 3:
			query+=' match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(super_agent_pl), 2) AS player_p_l, ROUND(sum(super_agent_pl+master_pl+admin_pl+admin_commission+master_commission+super_agent_commission+super_admin_commission+super_admin_commission_admin_part+super_admin_commission_master_part+super_admin_commission_super_agent_part - agent_pdc_charge - agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(master_pl+admin_pl+admin_commission+master_commission+super_admin_commission+super_admin_commission_admin_part+super_admin_commission_master_part - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(super_agent_commission), 2) AS super_comm, ROUND(sum(super_admin_commission_super_agent_part), 2) AS super_admin_commission, type as market_type, ROUND(sum(- agent_pdc_charge - agent_pdc_refund + super_agent_pdc_charge + super_agent_pdc_refund), 2) AS pdc_pl';
			whereCondition+= ' and super_agent_id= '+user_id;
			break;
		case 4:
			query+=' match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(agent_pl), 2) AS player_p_l, ROUND(sum(agent_pl+super_agent_pl+master_pl+admin_pl+agent_commission+admin_commission+master_commission+super_agent_commission+super_admin_commission+super_admin_commission_admin_part+super_admin_commission_master_part+super_admin_commission_super_agent_part+super_admin_commission_agent_part - user_pdc_charge - user_pdc_refund), 2) AS downline_p_l, ROUND(-sum(super_agent_pl+master_pl+admin_pl+admin_commission+master_commission+super_agent_commission+super_admin_commission+super_admin_commission_admin_part+super_admin_commission_master_part+super_admin_commission_super_agent_part - agent_pdc_charge - agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(agent_commission), 2) AS super_comm, ROUND(sum(super_admin_commission_agent_part), 2) AS super_admin_commission, type as market_type, ROUND(sum(- user_pdc_charge - user_pdc_refund + agent_pdc_charge + agent_pdc_refund), 2) AS pdc_pl';
			whereCondition+= ' and agent_id= '+user_id;
			break;
		default:
			query+=' match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(user_pl), 2) AS player_p_l, 0 AS downline_p_l, ROUND(sum(user_pl+user_commission+super_admin_commission_user_part+user_pdc_charge+user_pdc_refund), 2) AS upline_p_l, ROUND(sum(user_commission), 2) AS super_comm, ROUND(sum(super_admin_commission_user_part), 2) AS super_admin_commission, type as market_type, ROUND(sum(user_pdc_charge + user_pdc_refund), 2) AS pdc_pl';
			whereCondition+= ' and user_id= '+user_id;
		}

		if(sport_id!=0){
			whereCondition+=' and sport_id='+sport_id;
		}
		if(match_id!=0){
			whereCondition+=' and match_id='+match_id;
            groupByCondition = ' market_id,';
		}
		if(market_id!=0){
			whereCondition+=' and market_id='+market_id;
			groupByCondition = ' market_id,type,';
		}
        if(from_date!=0){
            whereCondition+=" and DATE(FROM_UNIXTIME(user_profit_loss.created_at+19800)) >= date('"+from_date+"')";
        }
		if(to_date!=0){
			 whereCondition+=" and DATE(FROM_UNIXTIME(user_profit_loss.created_at+19800)) <= date('"+to_date+"')";
		}

		query+=' from user_profit_loss ' + whereCondition + ' group by '+groupByCondition+' CASE WHEN(game_type IS NULL OR game_type = "0") THEN match_id ELSE reffered_name END) as aa';

		let resFromDB = await MysqlPool.query(query,true);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("profitLossMatchWise",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let profitLossUpline = async (user_id, user_type_id, to_date = 0, from_date = 0) => {
	try {

		let query = '';
		let whereCondition = '';
		if (from_date != 0) {
			whereCondition += " and DATE(FROM_UNIXTIME(user_profit_loss.created_at+19800)) >= date('" + from_date + "')";
		}
		if (to_date != 0) {
			whereCondition += " and DATE(FROM_UNIXTIME(user_profit_loss.created_at+19800)) <= date('" + to_date + "')";
		}
		switch (user_type_id) {
			case 1:
				query = `select u.id,u.parent_user_type_id parent_id, u.user_type_id, u.name, u.user_name, match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl                    
                    from user_profit_loss
          inner join users u on ((u.id=user_profit_loss.master_id and u.parent_id = ${user_id}) OR (u.id=user_profit_loss.super_agent_id and u.parent_id = ${user_id}) OR (u.id=user_profit_loss.agent_id and u.parent_id = ${user_id}) OR (u.id=user_profit_loss.user_id and u.parent_id = ${user_id}))
                    WHERE user_profit_loss.admin_id = ${user_id} ${whereCondition}
                    group by u.id`;
				break;
			case 2:
				query = `select u.id,u.parent_user_type_id  parent_id, u.user_type_id, u.name, u.user_name, match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(master_pl), 2) AS player_p_l, ROUND(sum(master_pl+admin_pl+master_commission+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS upline_p_l, ROUND(sum(master_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_master_part,0)), 2) AS super_admin_commission, ROUND(sum( - super_agent_pdc_charge - super_agent_pdc_refund + master_pdc_charge + master_pdc_refund), 2) AS pdc_pl
                    from user_profit_loss
                   inner join users u on ((u.id=user_profit_loss.super_agent_id and u.parent_id = ${user_id}) OR (u.id=user_profit_loss.agent_id and u.parent_id = ${user_id}) OR (u.id=user_profit_loss.user_id and u.parent_id = ${user_id}))
                    WHERE user_profit_loss.master_id = ${user_id} ${whereCondition}
                    group by u.id`;
				break;
			case 3:
				query = `select u.id,u.parent_user_type_id  parent_id, u.user_type_id, u.name, u.user_name, match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(super_agent_pl), 2) AS player_p_l, ROUND(sum(super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(master_pl+admin_pl+master_commission+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(super_agent_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_super_agent_part,0)), 2) AS super_admin_commission, ROUND(sum(- agent_pdc_charge - agent_pdc_refund + super_agent_pdc_charge + super_agent_pdc_refund), 2) AS pdc_pl
                    from user_profit_loss
                    inner join users u on ((u.id=user_profit_loss.agent_id and u.parent_id = ${user_id}) OR (u.id=user_profit_loss.user_id and u.parent_id = ${user_id}))
                    WHERE user_profit_loss.super_agent_id = ${user_id} ${whereCondition}
                    group by u.id`;
				break;
			case 4:
				query = `select u.id,u.parent_user_type_id  parent_id, u.user_type_id, u.name, u.user_name, match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(agent_pl), 2) AS player_p_l, ROUND(sum(agent_pl+super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0)+IFNULL(super_admin_commission_agent_part,0) - user_pdc_charge - user_pdc_refund), 2) AS downline_p_l, ROUND(-sum(super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(agent_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_agent_part,0)), 2) AS super_admin_commission, ROUND(sum(- user_pdc_charge - user_pdc_refund + agent_pdc_charge + agent_pdc_refund), 2) AS pdc_pl
                    from user_profit_loss
                    inner join users u on ((u.id=user_profit_loss.user_id and u.parent_id = ${user_id}))
                    WHERE user_profit_loss.agent_id = ${user_id} ${whereCondition}
                    group by u.id`;
				break;
			default:
				query = `select u.id,0  parent_id, u.user_type_id, u.name, u.user_name, match_id, market_id, reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(user_pl), 2) AS player_p_l, 0 AS downline_p_l, ROUND(sum(user_pl+user_commission+IFNULL(super_admin_commission_user_part,0) + user_pdc_charge + user_pdc_refund), 2) AS upline_p_l, ROUND(sum(user_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_user_part,0)), 2) AS super_admin_commission, ROUND(sum(user_pdc_charge + user_pdc_refund), 2) AS pdc_pl                    
                    from user_profit_loss
                    inner join users u on u.id=user_profit_loss.user_id
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}`;
		}
		let resFromDB = await MysqlPool.query(query, true);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("profitLossUpline",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let profitLossUplineBySport = async (user_id, user_type_id, to_date = 0, from_date = 0, parent_id) => {
	try {

		let query = '';
		let whereCondition = '';
		if (from_date != 0) {
			whereCondition += " and DATE(FROM_UNIXTIME(user_profit_loss.created_at+19800)) >= date('" + from_date + "')";
		}
		if (to_date != 0) {
			whereCondition += " and DATE(FROM_UNIXTIME(user_profit_loss.created_at+19800)) <= date('" + to_date + "')";
		}
		if (parent_id == 1) {
			if (user_type_id == 2) {
				query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl                      
                    from user_profit_loss                            
                    WHERE user_profit_loss.master_id = ${user_id} ${whereCondition}
                     group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
			} else if (user_type_id == 3){
				query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl                      
                    from user_profit_loss                            
                    WHERE user_profit_loss.super_agent_id = ${user_id} ${whereCondition}
                     group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
			} else if (user_type_id == 4) {
				query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl                      
                    from user_profit_loss                            
                    WHERE user_profit_loss.agent_id = ${user_id} ${whereCondition}
                     group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
			} else if (user_type_id == 5) {
				query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl                      
                    from user_profit_loss                            
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
                     group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
			}
		} else {
			switch (user_type_id) {
				case 2:
					query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl                      
                    from user_profit_loss                            
                    WHERE user_profit_loss.master_id = ${user_id} ${whereCondition}
                     group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
					break;
				case 3:
					query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(master_pl), 2) AS player_p_l, ROUND(sum(master_pl+admin_pl+master_commission+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS upline_p_l, ROUND(sum(master_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_master_part,0)), 2) AS super_admin_commission, ROUND(sum( - super_agent_pdc_charge - super_agent_pdc_refund + master_pdc_charge + master_pdc_refund), 2) AS pdc_pl 
                    from user_profit_loss 
                    WHERE user_profit_loss.super_agent_id = ${user_id} ${whereCondition}
                    group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
					break;
				case 4:
					query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(super_agent_pl), 2) AS player_p_l, ROUND(sum(super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(master_pl+admin_pl+master_commission+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(super_agent_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_super_agent_part,0)), 2) AS super_admin_commission, ROUND(sum(- agent_pdc_charge - agent_pdc_refund + super_agent_pdc_charge + super_agent_pdc_refund), 2) AS pdc_pl 
                    from user_profit_loss
                    WHERE user_profit_loss.agent_id = ${user_id} ${whereCondition}
                    group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
					break;
				case 5:
					if (parent_id != 0 && user_type_id == 5) {
						if (parent_id == 1) {
							query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(admin_pl), 2) AS player_p_l, ROUND(sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS downline_p_l, 0 AS upline_p_l, ROUND(sum(admin_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_admin_part,0)), 2) AS super_admin_commission, ROUND(sum(- master_pdc_charge - master_pdc_refund), 2) AS pdc_pl 
                    from user_profit_loss 
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
          group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
						} else if (parent_id == 2) {
							query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(master_pl), 2) AS player_p_l, ROUND(sum(master_pl+admin_pl+master_commission+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(admin_pl+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 2) AS upline_p_l, ROUND(sum(master_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_master_part,0)), 2) AS super_admin_commission, ROUND(sum( - super_agent_pdc_charge - super_agent_pdc_refund + master_pdc_charge + master_pdc_refund), 2) AS pdc_pl 
                    from user_profit_loss 
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
          group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
						} else if (parent_id == 3) {
							query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(super_agent_pl), 2) AS player_p_l, ROUND(sum(super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 2) AS downline_p_l, ROUND(-sum(master_pl+admin_pl+master_commission+admin_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(super_agent_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_super_agent_part,0)), 2) AS super_admin_commission, ROUND(sum(- agent_pdc_charge - agent_pdc_refund + super_agent_pdc_charge + super_agent_pdc_refund), 2) AS pdc_pl 
                    from user_profit_loss 
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
          group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
						} else if (parent_id == 4) {
							query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(agent_pl), 2) AS player_p_l, ROUND(sum(agent_pl+super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0)+IFNULL(super_admin_commission_agent_part,0) - user_pdc_charge - user_pdc_refund), 2) AS downline_p_l, ROUND(-sum(super_agent_pl+master_pl+admin_pl+master_commission+admin_commission+super_agent_commission+super_admin_commission+IFNULL(super_admin_commission_admin_part,0)+IFNULL(super_admin_commission_master_part,0)+IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 2) AS upline_p_l, ROUND(sum(agent_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_agent_part,0)),2) AS super_admin_commission, ROUND(sum(- user_pdc_charge - user_pdc_refund + agent_pdc_charge + agent_pdc_refund), 2) AS pdc_pl 
                    from user_profit_loss 
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
          group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
						}
					} else {
						query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(user_pl), 2) AS player_p_l, 0 AS downline_p_l, ROUND(sum(user_pl+user_commission+IFNULL(super_admin_commission_user_part,0) + user_pdc_charge + user_pdc_refund), 2) AS upline_p_l, ROUND(sum(user_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_user_part,0)), 2) AS super_admin_commission, ROUND(sum(user_pdc_charge + user_pdc_refund), 2) AS pdc_pl   
                    from user_profit_loss 
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
                    group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;

					}
					break;
				default:
					query = `select match_id, market_id, SUBSTRING_INDEX(reffered_name, '->', 1) reffered_name, ROUND(sum(stack), 2) as stack, ROUND(sum(user_pl), 2) AS player_p_l, 0 AS downline_p_l, ROUND(sum(user_pl+user_commission+IFNULL(super_admin_commission_user_part,0) + user_pdc_charge + user_pdc_refund), 2) AS upline_p_l, ROUND(sum(user_commission), 2) AS super_comm, ROUND(sum(IFNULL(super_admin_commission_user_part,0)), 2) AS super_admin_commission, ROUND(sum(user_pdc_charge + user_pdc_refund), 2) AS pdc_pl   
                    from user_profit_loss 
                    WHERE user_profit_loss.user_id = ${user_id} ${whereCondition}
                    group by CASE WHEN(user_profit_loss.game_type IS NULL OR user_profit_loss.game_type = "0") THEN user_profit_loss.sport_id ELSE user_profit_loss.game_type END`;
			}
		}
		//console.log("query",query);
		let resFromDB = await MysqlPool.query(query, true);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("profitLossUplineBySport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};   

let settlementReport = async (user_id,user_type_id, search = '') => {
	try {

		let condition = '';
		let values = [];
		if(search != ''){
			condition = ' AND (u.name LIKE ? OR u.user_name LIKE ?) ';
			values = [user_id, '%' + search + '%', '%' + search + '%'];
		}else{
			values = [user_id];
		}

		let  query='';
		switch(user_type_id) {
			case 1:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(admin_pl + admin_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 0) + u.total_settled_amount
), 2) AS settlement_amount
FROM users u
LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.master_id AND u.parent_id = ${user_id}) OR (u.id=user_profit_loss.super_agent_id AND u.parent_id=${user_id}) OR(u.id=user_profit_loss.agent_id AND u.parent_id=${user_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${user_id}))
WHERE u.parent_id = ? ${condition}
GROUP BY u.id ORDER BY u.name, u.user_name;`;
				break;
			case 2:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(master_pl+admin_pl + master_commission + admin_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) + IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 0) + u.total_settled_amount), 2) AS settlement_amount
                    FROM users u
LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.super_agent_id AND u.parent_id=${user_id}) OR(u.id=user_profit_loss.agent_id AND u.parent_id=${user_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${user_id}))
                    WHERE u.parent_id = ? ${condition}
                    GROUP BY u.id ORDER BY u.name, u.user_name;`;
				break;
			case 3:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(super_agent_pl+master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) + IFNULL(super_admin_commission_master_part,0) + IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 0) + u.total_settled_amount), 2) AS settlement_amount 
                    FROM users u
LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.agent_id AND u.parent_id=${user_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${user_id}))
                    WHERE u.parent_id = ? ${condition}
                    GROUP BY u.id ORDER BY u.name, u.user_name;`;
				break;
			case 4:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((IFNULL(SUM(agent_pl + super_agent_pl + master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + agent_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) + IFNULL(super_admin_commission_master_part,0) + IFNULL(super_admin_commission_super_agent_part,0) + IFNULL(super_admin_commission_agent_part,0) - user_pdc_charge - user_pdc_refund), 0) + u.total_settled_amount), 2) AS settlement_amount
                    FROM users u
LEFT JOIN user_profit_loss ON (u.id=user_profit_loss.user_id AND u.parent_id = ${user_id})
                    WHERE u.parent_id = ? ${condition}
                    GROUP BY u.id ORDER BY u.name, u.user_name;`;
				break;
			default:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND((0 + u.total_settled_amount), 2) AS settlement_amount
                    FROM users u
LEFT JOIN user_profit_loss ON (u.id=user_profit_loss.user_id AND u.parent_id = ${user_id})
                    WHERE u.parent_id = ? ${condition} 
                    GROUP BY u.id ORDER BY u.name, u.user_name;`;
		}

		let resFromDB = await MysqlPool.query(query, values);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("settlementReport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let makeSettlement = async (user_id, user_type_id, parent_id, amount, type, comment = '',parent_comment = '') => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();
		let  query='';
		let balanceQry = '';
		if (type == 1){
			balanceQry = ` (SELECT balance from users where id = u.id) AS balance `
		}
		else {
			balanceQry = ` (SELECT balance from users where id = u.parent_id) AS balance `
		}

		switch(user_type_id) {	
		
			case 2:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ${balanceQry}, IFNULL(SUM(admin_pl + admin_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) - master_pdc_charge - master_pdc_refund), 0) + u.total_settled_amount AS settlement_amount
				FROM users u
				LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.master_id AND u.parent_id = ${parent_id}) OR (u.id=user_profit_loss.super_agent_id AND u.parent_id=${parent_id}) OR(u.id=user_profit_loss.agent_id AND u.parent_id=${parent_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${parent_id}))
				WHERE u.parent_id = ? AND u.id = ?
				GROUP BY u.id ORDER BY u.name, u.user_name`;
				break;
			case 3:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ${balanceQry}, IFNULL(SUM(master_pl + admin_pl + master_commission + admin_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) + IFNULL(super_admin_commission_master_part,0) - super_agent_pdc_charge - super_agent_pdc_refund), 0) + u.total_settled_amount AS settlement_amount
                FROM users u
				LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.super_agent_id AND u.parent_id=${parent_id}) OR(u.id=user_profit_loss.agent_id AND u.parent_id=${parent_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${parent_id}))
                WHERE u.parent_id = ? AND u.id = ?
                GROUP BY u.id ORDER BY u.name, u.user_name`;
				break;
			case 4:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ${balanceQry}, IFNULL(SUM(super_agent_pl + master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) + IFNULL(super_admin_commission_master_part,0) + IFNULL(super_admin_commission_super_agent_part,0) - agent_pdc_charge - agent_pdc_refund), 0) + u.total_settled_amount AS settlement_amount 
                FROM users u
				LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.agent_id AND u.parent_id=${parent_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${parent_id}))
                WHERE u.parent_id = ? AND u.id = ?
                GROUP BY u.id ORDER BY u.name, u.user_name`;
				break;
			case 5:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ${balanceQry}, IFNULL(SUM(agent_pl + super_agent_pl + master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + agent_commission + super_admin_commission + IFNULL(super_admin_commission_admin_part,0) + IFNULL(super_admin_commission_master_part,0) + IFNULL(super_admin_commission_super_agent_part,0) + IFNULL(super_admin_commission_agent_part,0) - user_pdc_charge - user_pdc_refund), 0) + u.total_settled_amount AS settlement_amount
                FROM users u
				LEFT JOIN user_profit_loss ON (u.id=user_profit_loss.user_id AND u.parent_id = ${parent_id})
                WHERE u.parent_id = ? AND u.id = ?
                GROUP BY u.id ORDER BY u.name, u.user_name`;
				break;
			default:
				query=`SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ${balanceQry}, 0 + u.total_settled_amount AS settlement_amount
                FROM user_profit_loss
                INNER JOIN users u ON (u.id=user_profit_loss.user_id AND u.parent_id = ${parent_id})                    
                WHERE u.parent_id = ? AND u.id = ?
                GROUP BY u.id ORDER BY u.name, u.user_name`;
		}

		//console.log(conn.format(query,[parent_id, user_id]))
		let resFromDB = await conn.query(query,[parent_id, user_id]);
		resFromDB = resFromDB[0];
		if(resFromDB.length > 0){ 
			let settlement_amount = resFromDB[0].settlement_amount;
			let available_balance = resFromDB[0].balance;
			let settled_username = resFromDB[0].user_name;

			if ((amount <= available_balance)&&(amount <= Math.abs(settlement_amount))){

				if(settlement_amount != 0) {
	
					if(amount > 0 && amount <= Math.abs(settlement_amount)) {
						//when settlement_amount > 0 then debit and when amount < 0 then credit
						if(settlement_amount > 0 && type == 1){
							await conn.rollback();
							await conn.release();
							return resultdb(CONSTANTS.NOT_FOUND, 'Please Debit Amount For Settlement !');
						}
						else if(settlement_amount < 0 && type == 2){
							await conn.rollback();
							await conn.release();
							return resultdb(CONSTANTS.NOT_FOUND, 'Please Credit Amount For Settlement !');
						}else {
	
						//	let parent_comment = ''
							if (type == 2) {
								amount = -amount;
							//	parent_comment = 'Cash Debit'
							}else {
							//	parent_comment = 'Cash Credit'
							}
	
							let collectionQry = 'INSERT INTO settlement_collections (user_id, parent_id, amount, type, comment, created_at) VALUES (?, ?, ?, ?, ?, UNIX_TIMESTAMP())';
							await conn.query(collectionQry, [user_id, parent_id, amount, type, comment]);
	
							if(user_type_id == 5){
								let updateSettlementAmountQry = 'UPDATE users SET total_settled_amount = total_settled_amount + ?, balance = balance - ?, profit_loss = profit_loss - ?, total_balance = total_balance - ? WHERE id = ? LIMIT 1;';
								await conn.query(updateSettlementAmountQry, [amount, amount, amount, amount, user_id]);
	
								let updateSettlementAmountParentQry = 'UPDATE users SET balance = balance + ? WHERE id = ? LIMIT 1;';
								await conn.query(updateSettlementAmountParentQry, [amount, parent_id]);
	
								let accountStatementQry = 'INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, created_at) SELECT id, parent_id, CONCAT("Settlement: ", ?), 6, ?, balance, UNIX_TIMESTAMP() FROM users WHERE id = ? LIMIT 1;';
								await conn.query(accountStatementQry,[comment, -(amount), user_id]);

								let accountStatementParentQry = 'INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, created_at) SELECT id, parent_id, CONCAT("Settlement: ", ?), 6, ?, balance, UNIX_TIMESTAMP() FROM users WHERE id = ? LIMIT 1;';
								await conn.query(accountStatementParentQry,[parent_comment, amount, parent_id]);
							}else{
								// to check for child available balance if less than 0 then won't effect on parent balance
								let updateSettlementAmountQry = `UPDATE users SET total_settled_amount = total_settled_amount + ?, profit_loss = profit_loss - ?, balance = balance - ?, total_balance = total_balance - ? WHERE id = ? LIMIT 1;`;
								await conn.query(updateSettlementAmountQry, [amount, amount, amount, amount, user_id]);
	
								let updateSettlementAmountParentQry = `UPDATE users SET balance = balance + ? WHERE id = ? LIMIT 1;`;
								await conn.query(updateSettlementAmountParentQry, [amount, parent_id]);

								let accountStatementQry = 'INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, created_at) SELECT id, parent_id, CONCAT("Settlement: ", ?), 6, ?, balance, UNIX_TIMESTAMP() FROM users WHERE id = ? LIMIT 1;';
								await conn.query(accountStatementQry,[comment, -(amount), user_id]);

								let accountStatementParentQry = 'INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, created_at) SELECT id, parent_id, CONCAT("Settlement: ", ?), 6, ?, balance, UNIX_TIMESTAMP() FROM users WHERE id = ? LIMIT 1;';
								await conn.query(accountStatementParentQry,[parent_comment, amount, parent_id]);
							}
							await conn.commit();
							await conn.release();
							return resultdb(CONSTANTS.SUCCESS, 'Settlement Success');
						}
					}else{
						await conn.rollback();
						await conn.release();
						return resultdb(CONSTANTS.NOT_FOUND, 'Maximum amount ' + Math.abs(settlement_amount) +  ' allowed !');
					}
				}else{
					await conn.rollback();
					await conn.release();
					return resultdb(CONSTANTS.NOT_FOUND, 'Already Settled !');
				}
			}else {
				await conn.rollback();
				await conn.release();
				return resultdb(CONSTANTS.NOT_FOUND, 'Cannot proceed for settlement as available balance is low ['+available_balance+']');
			}

		}else{
			await conn.rollback();
			await conn.release();
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Input !');
		}

	} catch (error) {
		logger.errorlog.error("makeSettlement",error);
		await conn.rollback();
		await conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let settlementCollectionHistory = async (user_id, user_type_id, parent_id, page, opening_balance = 0) => {
	try {

		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;

		if(page == 1) {
			let query = '';
			switch (user_type_id) {
				case 2:
					query = `SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND(IFNULL(SUM(admin_pl + admin_commission + super_admin_commission + super_admin_commission_admin_part - master_pdc_charge - master_pdc_refund), 0), 2) AS settlement_amount FROM users u LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.master_id AND u.parent_id = ${parent_id}) OR (u.id=user_profit_loss.super_agent_id AND u.parent_id=${parent_id}) OR(u.id=user_profit_loss.agent_id AND u.parent_id=${parent_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${parent_id})) WHERE u.parent_id = ? AND u.id = ? GROUP BY u.id ORDER BY u.name, u.user_name`;
					break;
				case 3:
					query = `SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id,ROUND(IFNULL(SUM(master_pl + admin_pl + master_commission + admin_commission + super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part - super_agent_pdc_charge - super_agent_pdc_refund), 0), 2) AS settlement_amount FROM users u LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.super_agent_id AND u.parent_id=${parent_id}) OR(u.id=user_profit_loss.agent_id AND u.parent_id=${parent_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${parent_id})) WHERE u.parent_id = ? AND u.id = ? GROUP BY u.id ORDER BY u.name, u.user_name`;
					break;
				case 4:
					query = `SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND(IFNULL(SUM(super_agent_pl + master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part + super_admin_commission_super_agent_part - agent_pdc_charge - agent_pdc_refund), 0), 2) AS settlement_amount FROM users u LEFT JOIN user_profit_loss ON ((u.id=user_profit_loss.agent_id AND u.parent_id=${parent_id}) OR (u.id=user_profit_loss.user_id AND u.parent_id=${parent_id})) WHERE u.parent_id = ? AND u.id = ? GROUP BY u.id ORDER BY u.name, u.user_name`;
					break;
				case 5:
					query = `SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, ROUND(IFNULL(SUM(agent_pl + super_agent_pl + master_pl + admin_pl + master_commission + admin_commission + super_agent_commission + agent_commission + super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part + super_admin_commission_super_agent_part + super_admin_commission_agent_part - user_pdc_charge - user_pdc_refund), 0), 2) AS settlement_amount FROM users u LEFT JOIN user_profit_loss ON (u.id=user_profit_loss.user_id AND u.parent_id = ${user_id}) WHERE u.parent_id = ? AND u.id = ? GROUP BY u.id ORDER BY u.name, u.user_name`;
					break;
				default:
					query = `SELECT u.id AS user_id, u.user_type_id, u.name, u.user_name, u.parent_id, 0 AS settlement_amount FROM user_profit_loss INNER JOIN users u ON (u.id=user_profit_loss.user_id AND u.parent_id = ${parent_id}) WHERE u.parent_id = ? AND u.id = ? GROUP BY u.id ORDER BY u.name, u.user_name`;
			}

			let resFromDB = await MysqlPool.query(query, [parent_id, user_id]);

			if (resFromDB.length > 0) {
				opening_balance = resFromDB[0].settlement_amount;
			}

		}

		let calc = '';
		if(page == 1){
			calc += ' SQL_CALC_FOUND_ROWS ';
		}

		let qry = `SELECT ${calc} a.*, ROUND((@runtot :=  a.amount  + @runtot), 2) as updated_balance, (@ii := @ii + 1) as s_num FROM settlement_collections a, (SELECT @runtot:=?) c, (SELECT @ii:=?) d WHERE a.user_id = ? ORDER BY a.id ASC LIMIT ?, ?; SELECT FOUND_ROWS() AS total;`;

		let resFromDB1 = await MysqlPool.query(qry, [opening_balance, offset, user_id, offset, limit]);

		resFromDB1[2] = {"opening_balance" : opening_balance};

		return resultdb(CONSTANTS.SUCCESS, resFromDB1);
	} catch (error) {
		logger.errorlog.error("settlementCollectionHistory",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let deleteSettlement = async (settlement_id) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();
		let  query = 'SELECT a.*, b.user_type_id FROM settlement_collections AS a INNER JOIN users b ON(a.user_id = b.id) WHERE a.id = ? LIMIT 1;';

		let resFromDB = await conn.query(query,[settlement_id]);
		resFromDB = resFromDB[0];
		if(resFromDB.length > 0){
			let amount = resFromDB[0].amount;
			let parent_id = resFromDB[0].parent_id; 
			let user_id = resFromDB[0].user_id;
			let user_type_id = resFromDB[0].user_type_id;
			let comment = resFromDB[0].comment;


			if(user_type_id == 5){
				let updateSettlementAmountQry = 'UPDATE users SET total_settled_amount = total_settled_amount - ?, balance = balance + ?, profit_loss = profit_loss + ?, total_balance = total_balance + ? WHERE id = ? LIMIT 1;';
				await conn.query(updateSettlementAmountQry, [amount, amount, amount, amount, user_id]);

				let updateSettlementAmountParentQry = 'UPDATE users SET balance = balance - ? WHERE id = ? LIMIT 1;';
				await conn.query(updateSettlementAmountParentQry, [amount, parent_id]);

				let accountStatementQry = 'INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, created_at) SELECT id, parent_id, CONCAT("Settlement Deleted: ", ?), 6, ?, balance, UNIX_TIMESTAMP() FROM users WHERE id = ? LIMIT 1;';
				await conn.query(accountStatementQry,[comment, amount, user_id]);
			}else{
				let updateSettlementAmountQry = 'UPDATE users SET total_settled_amount = total_settled_amount - ?, profit_loss = profit_loss + ?, balance = balance + ?, total_balance = total_balance + ? WHERE id = ? LIMIT 1;';
				await conn.query(updateSettlementAmountQry, [amount, amount, amount, amount, user_id]);

				let updateSettlementAmountParentQry = `UPDATE users SET balance = balance - ? WHERE id = ? LIMIT 1;`;
				await conn.query(updateSettlementAmountParentQry, [amount, parent_id]);

				let accountStatementParentQry = 'INSERT INTO account_statements (user_id, parent_id, description, statement_type, amount, available_balance, created_at) SELECT id, parent_id, CONCAT("Settlement Deleted: ", ?), 6, ?, balance, UNIX_TIMESTAMP() FROM users WHERE id = ? LIMIT 1;';
				await conn.query(accountStatementParentQry,[comment, amount, parent_id]);
			}

			let collectionQry = 'DELETE FROM settlement_collections WHERE id = ?;';
			await conn.query(collectionQry, [settlement_id]);

			let statementQry = 'DELETE FROM account_statements WHERE user_id = ? AND statement_type = 6;';
			await conn.query(statementQry, [user_id]);
			let statementParentQry = 'DELETE FROM account_statements WHERE user_id = ? AND statement_type = 6;';
			await conn.query(statementParentQry, [parent_id]);

			await conn.commit();
			await conn.release();
			return resultdb(CONSTANTS.SUCCESS, 'Settlement Deleted');

		}else{
			await conn.rollback();
			await conn.release();
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Input !');
		}

	} catch (error) {
		logger.errorlog.error("deleteSettlement",error);
		await conn.rollback();
		await conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let ownDataInSettlementReport = async (user_id,user_type_id) => {
	try {

		let  query='';
		switch(user_type_id) {
			case 1:
				query = `SELECT ROUND(IFNULL(SUM(admin_commission), 0.00), 2) AS own_commission, ROUND(IFNULL(SUM(super_admin_commission_admin_part), 0.00), 2) AS own_super_admin_commission, ROUND(IFNULL(SUM(admin_pl + admin_commission + super_admin_commission_admin_part - master_pdc_charge - master_pdc_refund), 0.00), 2) AS own_pl, 0.00 AS parent_commission, ROUND(IFNULL(SUM(super_admin_commission), 0.00), 2) AS parent_super_admin_commission, ROUND(IFNULL(SUM(super_admin_commission), 0.00), 2) AS parent_ac FROM user_profit_loss WHERE admin_id = ?`;
				break;
			case 2:
				query = `SELECT ROUND(IFNULL(SUM(master_commission), 0.00), 2) AS own_commission, ROUND(IFNULL(SUM(super_admin_commission_master_part), 0.00), 2) AS own_super_admin_commission, ROUND(IFNULL(SUM(master_pl + master_commission + super_admin_commission_master_part - super_agent_pdc_charge - super_agent_pdc_refund + master_pdc_charge + master_pdc_refund), 0.00), 2) AS own_pl, ROUND(IFNULL(SUM(admin_commission), 0.00), 2) AS parent_commission, ROUND(IFNULL(SUM(super_admin_commission + super_admin_commission_admin_part), 0.00), 2) AS parent_super_admin_commission, ROUND(IFNULL(SUM(admin_pl + admin_commission + super_admin_commission + super_admin_commission_admin_part - master_pdc_charge - master_pdc_refund), 0.00), 2) AS parent_ac FROM user_profit_loss WHERE master_id = ?`;
				break;
			case 3:
				query = `SELECT ROUND(IFNULL(SUM(super_agent_commission), 0.00), 2) AS own_commission, ROUND(IFNULL(SUM(super_admin_commission_super_agent_part), 0.00), 2) AS own_super_admin_commission, ROUND(IFNULL(SUM(super_agent_pl + super_agent_commission + super_admin_commission_super_agent_part - agent_pdc_charge - agent_pdc_refund + super_agent_pdc_charge + super_agent_pdc_refund), 0.00), 2) AS own_pl, ROUND(IFNULL(SUM(admin_commission + master_commission), 0.00), 2) AS parent_commission, ROUND(IFNULL(SUM(super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part), 0.00), 2) AS parent_super_admin_commission, ROUND(IFNULL(SUM(admin_pl + admin_commission + master_commission + master_pl + super_admin_commission + super_admin_commission_admin_part+ super_admin_commission_master_part - super_agent_pdc_charge - super_agent_pdc_refund), 0.00), 2) AS parent_ac FROM user_profit_loss WHERE super_agent_id = ?`;
				break;
			case 4:
				query = `SELECT ROUND(IFNULL(SUM(agent_commission), 0.00), 2) AS own_commission, ROUND(IFNULL(SUM(super_admin_commission_agent_part), 0.00), 2) AS own_super_admin_commission, ROUND(IFNULL(SUM(agent_pl + agent_commission + super_admin_commission_agent_part - user_pdc_charge - user_pdc_refund + agent_pdc_charge + agent_pdc_refund), 0.00), 2) AS own_pl, ROUND(IFNULL(SUM(admin_commission + master_commission + super_agent_commission), 0.00), 2) AS parent_commission, ROUND(IFNULL(SUM(super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part + super_admin_commission_super_agent_part), 0.00), 2) AS parent_super_admin_commission, ROUND(IFNULL(SUM(admin_pl + admin_commission + master_commission + master_pl + super_agent_commission + super_agent_pl + super_admin_commission + super_admin_commission_admin_part+ super_admin_commission_master_part + super_admin_commission_super_agent_part - agent_pdc_charge - agent_pdc_refund), 0.00), 2) AS parent_ac FROM user_profit_loss WHERE agent_id = ?`;
				break;
			default:
				query = `SELECT ROUND(IFNULL(SUM(user_commission), 0.00), 2) AS own_commission, ROUND(IFNULL(SUM(super_admin_commission_user_part), 0.00), 2) AS own_super_admin_commission, ROUND(IFNULL(SUM(user_pl + user_commission + super_admin_commission_user_part + user_pdc_charge + user_pdc_refund), 0.00), 2) AS own_pl, ROUND(IFNULL(SUM(admin_commission + master_commission + super_agent_commission + agent_commission), 0.00), 2) AS parent_commission, ROUND(IFNULL(SUM(super_admin_commission + super_admin_commission_admin_part + super_admin_commission_master_part + super_admin_commission_super_agent_part + super_admin_commission_agent_part), 0.00), 2) AS parent_super_admin_commission, ROUND(IFNULL(SUM(admin_pl + admin_commission + master_commission + master_pl + super_agent_commission + super_agent_pl + agent_commission + agent_pl + super_admin_commission + super_admin_commission_admin_part+ super_admin_commission_master_part + super_admin_commission_super_agent_part + super_admin_commission_agent_part - user_pdc_charge - user_pdc_refund), 0.00), 2) AS parent_ac FROM user_profit_loss WHERE user_id = ?`;
		}

		let resFromDB = await MysqlPool.query(query, [user_id]);

		let qry = `SELECT IFNULL(b.name, "") AS parent_name, IFNULL(b.user_name, "") AS parent_user_name, 
			ROUND(IFNULL(SUM(
			(CASE WHEN(a.id = ?) THEN IFNULL(a.total_settled_amount, 0.00) ELSE 0.00 END)
			-
			(CASE WHEN(a.parent_id = ?) THEN IFNULL(a.total_settled_amount, 0.00) ELSE 0.00 END)
			), 0.00), 2) AS total_cash,
			ROUND(IFNULL(SUM(
			(CASE WHEN(a.id = ?) THEN IFNULL(a.total_settled_amount, 0.00) ELSE 0.00 END)
			), 0.00), 2) AS own_total_settled_amount
			FROM users AS a LEFT JOIN users AS b ON(a.parent_id = b.id) WHERE a.id = ? OR a.parent_id = ?;`;
		let resFromDB1 = await MysqlPool.query(qry, [user_id, user_id, user_id, user_id, user_id]);

		let parent_ac = resFromDB[0].parent_ac + resFromDB1[0].own_total_settled_amount;
		let plusData = [];
		let minusData = [];
		let totalPlus = 0;
		let totalMinus = 0;

		if(user_type_id == 1) {
			if (parent_ac >= 0) {
				plusData.push({description: `Super Admin Account`, amount: parent_ac.toFixed(2)});
				totalPlus = totalPlus + parent_ac;
			} else {
				minusData.push({description: `Super Admin Account`, amount: Math.abs(parent_ac).toFixed(2)});
				totalMinus = totalMinus + parent_ac;
			}
		} else {
			if (resFromDB[0].parent_commission >= 0) {
				plusData.push({description: `${resFromDB1[0].parent_name}(${resFromDB1[0].parent_user_name}) Commission`, amount: resFromDB[0].parent_commission.toFixed(2)});
			} else {
				minusData.push({
					description: `${resFromDB1[0].parent_name}(${resFromDB1[0].parent_user_name}) Commission`, amount: Math.abs(resFromDB[0].parent_commission).toFixed(2)
				});
			}

			if (parent_ac >= 0) {
				plusData.push({description: `${resFromDB1[0].parent_name}(${resFromDB1[0].parent_user_name}) Account`, amount: parent_ac.toFixed(2)});
				totalPlus = totalPlus + parent_ac;
			} else {
				minusData.push({description: `${resFromDB1[0].parent_name}(${resFromDB1[0].parent_user_name}) Account`, amount: Math.abs(parent_ac).toFixed(2)});
				totalMinus = totalMinus + parent_ac;
			}
		}

		if(resFromDB[0].own_commission >= 0){
			plusData.push({description: "Own Commission", amount: resFromDB[0].own_commission.toFixed(2)});
		}else{
			minusData.push({description: "Own Commission", amount: Math.abs(resFromDB[0].own_commission).toFixed(2)});
		}

		if(resFromDB[0].own_pl >= 0){
			plusData.push({description: "Own", amount: resFromDB[0].own_pl.toFixed(2)});
			totalPlus = totalPlus + resFromDB[0].own_pl;
		}else{
			minusData.push({description: "Own", amount: Math.abs(resFromDB[0].own_pl).toFixed(2)});
			totalMinus = totalMinus + resFromDB[0].own_pl;
		}

		if(resFromDB1[0].total_cash > 0){
			minusData.push({description: "Cash", amount: resFromDB1[0].total_cash.toFixed(2)});
			totalMinus = totalMinus - resFromDB1[0].total_cash;
		}
		else if(resFromDB1[0].total_cash < 0){
			plusData.push({description: "Cash", amount: Math.abs(resFromDB1[0].total_cash).toFixed(2)});
			totalPlus = totalPlus + Math.abs(resFromDB1[0].total_cash);
		}

		let data = {
			plusData: plusData,
			minusData: minusData,
			totalPlus: totalPlus,
			totalMinus: totalMinus
		};

		return resultdb(CONSTANTS.SUCCESS, data);
	} catch (error) {
		logger.errorlog.error("ownDataInSettlementReport",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let superAdminCommissionDetail = async (page) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;

		let qry = `SELECT ROUND(total_super_admin_commission, 2) AS total_super_admin_commission, ROUND(total_super_admin_commission_settled, 2) AS total_super_admin_commission_settled, ROUND((total_super_admin_commission - total_super_admin_commission_settled), 2) AS total_super_admin_commission_unsettled FROM users WHERE user_type_id = 1 LIMIT 1;`;
		let resFromDB = await MysqlPool.query(qry, []);

		let qry1 = `SELECT * FROM super_admin_commission_settlements ORDER BY id DESC LIMIT ?, ?;`;
		let resFromDB1 = await MysqlPool.query(qry1, [offset, limit]);
		let total = 0;
		if(page == 1){
			let qry2 = `SELECT count(*) AS total FROM super_admin_commission_settlements;`;
			let resFromDB2 = await MysqlPool.query(qry2, []);
			total = resFromDB2[0].total;
		}

		let data = {
			limit: limit,
			total: total,
			total_super_admin_commission: resFromDB[0].total_super_admin_commission,
			total_super_admin_commission_settled: resFromDB[0].total_super_admin_commission_settled,
			total_super_admin_commission_unsettled: resFromDB[0].total_super_admin_commission_unsettled,
			settlement_data: resFromDB1
		};

		return resultdb(CONSTANTS.SUCCESS, data);
	} catch (error) {
		logger.errorlog.error("superAdminCommissionDetail",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let makeSuperAdminCommissionSettlement = async (amount, comment = '') => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();
		let  qry='SELECT ROUND(total_super_admin_commission, 2) AS total_super_admin_commission, ROUND(total_super_admin_commission_settled, 2) AS total_super_admin_commission_settled, ROUND((total_super_admin_commission - total_super_admin_commission_settled), 2) AS total_super_admin_commission_unsettled FROM users WHERE user_type_id = 1 LIMIT 1;';

		let resFromDB = await conn.query(qry,[]);
		resFromDB = resFromDB[0];
		if(resFromDB.length > 0){
			let settlement_amount = resFromDB[0].total_super_admin_commission_unsettled;

			if(settlement_amount != 0) {

				if(amount > 0 && amount <= Math.abs(settlement_amount)) {

					let collectionQry = 'INSERT INTO super_admin_commission_settlements (amount, comment, created_at) VALUES (?, ?, UNIX_TIMESTAMP())';
					await conn.query(collectionQry, [amount, comment]);

					let updateSettlementAmountQry = 'UPDATE users SET total_super_admin_commission_settled = total_super_admin_commission_settled + ? WHERE user_type_id = 1;';
					await conn.query(updateSettlementAmountQry, [amount]);

					await conn.commit();
					await conn.release();
					return resultdb(CONSTANTS.SUCCESS, 'Super Admin Commission Settlement Success');
				}else{
					await conn.rollback();
					await conn.release();
					return resultdb(CONSTANTS.NOT_FOUND, 'Maximum amount ' + Math.abs(settlement_amount) +  ' allowed !');
				}
			}else{
				await conn.rollback();
				await conn.release();
				return resultdb(CONSTANTS.NOT_FOUND, 'Already Settled !');
			}

		}else{
			await conn.rollback();
			await conn.release();
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Input !');
		}

	} catch (error) {
		logger.errorlog.error("makeSuperAdminCommissionSettlement",error);
		await conn.rollback();
		await conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let deleteSuperAdminCommissionSettlement = async (super_admin_commission_settlement_id) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();
		let  query = 'SELECT * FROM super_admin_commission_settlements WHERE id = ? LIMIT 1;';
		let resFromDB = await conn.query(query,[super_admin_commission_settlement_id]);
		resFromDB = resFromDB[0];

		if(resFromDB.length > 0){
			let amount = resFromDB[0].amount;

			let updateSettlementAmountQry = 'UPDATE users SET total_super_admin_commission_settled = total_super_admin_commission_settled - ? WHERE user_type_id = 1 LIMIT 1;';
			await conn.query(updateSettlementAmountQry, [amount]);

			let collectionQry = 'DELETE FROM super_admin_commission_settlements WHERE id = ?;';
			await conn.query(collectionQry, [super_admin_commission_settlement_id]);

			await conn.commit();
			await conn.release();
			return resultdb(CONSTANTS.SUCCESS, 'Super Admin Commission Settlement Deleted');

		}else{
			await conn.rollback();
			await conn.release();
			return resultdb(CONSTANTS.NOT_FOUND, 'Invalid Input !');
		}

	} catch (error) {
		logger.errorlog.error("deleteSuperAdminCommissionSettlement",error);
		await conn.rollback();
		await conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let settlementHistoryByParent = async (user_id, page) => {
	try {

		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;

		let calc = '';
		if(page == 1){
			calc += ' SQL_CALC_FOUND_ROWS ';
		}

		let qry = ` SELECT ${calc} a.*,  (@ii := @ii + 1) as s_num FROM settlement_collections a  , (SELECT @ii:=?) d WHERE a.user_id = ? ORDER BY a.id ASC LIMIT ?, ?; SELECT FOUND_ROWS() AS total;`;

		let resFromDB = await MysqlPool.query(qry, [offset, user_id, offset, limit]);


		let returnRes={
			list:resFromDB[0],
			total:resFromDB[1][0].total
		};
		return resultdb(CONSTANTS.SUCCESS, returnRes);

	} catch (error) {
		logger.errorlog.error("settlementHistoryByParent",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let fancyStackUserWise = async (user_type_id,userid) => {
	try {
		let query;
		switch(user_type_id) {
			case 1:
				query=`select u.id, u.name , ifnull(sum(b.stack),0) as stack from users u left  join bets_fancy b on (u.id=b.master_id) where u.user_type_id=2 and b.admin_id= ? group by  b.master_id`;
				break;
			case 2:
				query=`select u.id, u.name , ifnull(sum(b.stack),0) as stack from users u left  join bets_fancy b on (u.id=b.super_agent_id) where u.user_type_id=3 and b.master_id= ? group by  b.super_agent_id`;
				break;
			case 3:
				query=`select u.id, u.name , ifnull(sum(b.stack),0) as stack from users u left  join bets_fancy b on (u.id=b.agent_id) where u.user_type_id=4 and b.super_agent_id= ? group by  b.agent_id`;
				break;
			case 4:
				query=`select u.id, u.name , ifnull(sum(b.stack),0) as stack from users u left  join bets_fancy b on (u.id=b.user_id) where u.user_type_id=5 and b.agent_id= ? group by  b.user_id`;
				break;
			default:
				query=`select u.id, u.name , ifnull(sum(b.stack),0) as stack from users u left  join bets_fancy b on (u.id=b.user_id) where u.user_type_id=5  and b.user_id= ? group by  b.user_id`;
		}

		let resFromDB = await MysqlPool.query(query,[userid]);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);

	} catch (error) {
		logger.errorlog.error("fancyStackUserWise",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	profitLossMatchWise,
	profitLossUpline,
    profitLossUplineBySport,
	settlementReport,
	makeSettlement,
	settlementCollectionHistory,
	deleteSettlement,
	ownDataInSettlementReport,
	superAdminCommissionDetail,
	makeSuperAdminCommissionSettlement,
	deleteSuperAdminCommissionSettlement,
	settlementHistoryByParent,
	fancyStackUserWise
};
