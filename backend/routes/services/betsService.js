const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');

const marketsService = require('../../routes/services/marketsService');
const matchesService = require('../../routes/services/matchesService');
const userService = require('../../routes/services/userService');
const sportsService = require('../../routes/services/sportsService');
const fancyService = require('../../routes/services/fancyService');
const exchangeService = require('../../routes/services/exchangeService');
const globalSettingService = require('../services/globalSettingService');
const connConfig = require('../../db/indexTest');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;
let saveBet = async (data,liability) => {
    const conn = await connConfig.getConnection();
	try {
        await conn.beginTransaction();
        let resFromDB = await conn.query('INSERT INTO bets_odds SET ?', [data]);
        await conn.query('SELECT `fn_save_odds_profit_loss`(?, ?)', [data.user_id,data.market_id]);
         await conn.query('update users SET liability=liability+?,balance=balance+? where id=?', [liability,liability,data.user_id]);
        /*await conn.query('update users SET liability=?,balance=balance-?,session_liability=?,un_match_liability=? where id=?', [data.liability,data.liability,data.session_liability,data.un_match_liability,data.user_id]);*/
        await conn.commit();conn.release();
        return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("saveBet",error);
        await conn.rollback();conn.release();
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let saveFancyBet = async (data,fancy_score_position,fancy_score_position_id,liabilityForBlance) => {
    const conn = await connConfig.getConnection();
    try {
        await conn.beginTransaction();
        let resFromDB = await conn.query('INSERT INTO bets_fancy SET ?', [data]);
        if(fancy_score_position_id==0){
            await conn.query('INSERT INTO fancy_score_position SET ?', [fancy_score_position]);
        }else{
            await conn.query('update  fancy_score_position SET ? where id=?', [fancy_score_position,fancy_score_position_id]);
        }

        await conn.query('update users SET liability=liability+?,balance=balance+? where id=?', [liabilityForBlance,liabilityForBlance,data.user_id]);

        await conn.commit();conn.release();
        return resultdb(CONSTANTS.SUCCESS, resFromDB);
    } catch (error) {
        logger.errorlog.error("saveFancyBet",error);
        await conn.rollback();conn.release();
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let validateBet = async (data, pdc_charge = 0) => {


	try {

            let userSetting = data.user_setting_data;

            if((global._config.is_unmatched_bet == '0') && (data.is_matched=='0')){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Un matched bet not available");
            }
            if(data.odds ==0){
                 return resultdb(CONSTANTS.VALIDATION_ERROR, "odds cannot be zero");
            }

			if(data.is_visible == '0'){
				return resultdb(CONSTANTS.VALIDATION_ERROR, "Bet not allowed");
			}

            if(data.odds > global._config.odds_limit && global._config.odds_limit !=null){
               // return resultdb(CONSTANTS.VALIDATION_ERROR, "odds limit limit is over");
            }
            if(data.stack <= 0){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "stack cannot be zero");
            }

            let userData = await userService.getUserByUserId(data.user_id);
            userData = userData.data;

            if(userData.lock_betting==1){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "user betting locked");
            }
            if(userData.lock_user==1){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "user account is locked");
            }
            if(userData.close_account==1){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "user account is closed");
            }

            //console.log("data.redis_status",data.redis_status);
            //if( data.redis_status!='OPEN' || data.redis_status!='ACTIVE'){
            if(!(['OPEN','ACTIVE','True',"1"].includes(data.redis_status))){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "market is close");
            }

            let sportService = await sportsService.getSportSetting(data.sport_id);
			sportService =  sportService.data;
            if(sportService.max_odss_limit != null && sportService.max_odss_limit != 0 && data.odds > sportService.max_odss_limit){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Sport Max odds is over");
            }

            if(sportService.min_odds_limit != null && sportService.min_odds_limit != 0 && data.odds < sportService.min_odds_limit){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Sport Min odds is over");
            }


            let matchSetting = await matchesService.getMatchSettingById(data.match_id);

            matchSetting =  matchSetting.data;

            if(matchSetting.is_active !=1){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Match is de-active");
            }

            if(matchSetting.odd_limit!=null && matchSetting.odd_limit!=0 && matchSetting.odd_limit < data.odds){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Match Odd limit is over");
            }

            if(matchSetting.min_stack!=null  &&  matchSetting.min_stack!=0 && matchSetting.min_stack > data.stack){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Match Min stack is over");
            }

            if(matchSetting.max_stack!=null && matchSetting.max_stack!=0 && matchSetting.max_stack < data.stack){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Match Max stack is over");
            }

            let globalSetting = await globalSettingService.getGlobalSetting();

            if(data.sport_id == '-4'){
				// let matchTimeStamp1 = Math.round((new Date(matchSetting.match_date).getTime() / 1000) / 60);
				// let currentTimeStamp1 = Math.round((Date.now() / 1000) / 60);

				let matchTimeStamp1 = Math.round((new Date(matchSetting.match_date).getTime() / 1000));
				let currentTimeStamp1 = Math.round((Date.now() / 1000));

				// if ((matchTimeStamp1 - currentTimeStamp1) < 30) {
				if (matchTimeStamp1 < currentTimeStamp1) {

					//let allowedTime = new Date((matchSetting.match_date) - (30*60*1000));
					/*let allowedTimeVal = allowedTime.getFullYear() +
						'-' + ('0' + u.getMonth()).slice(-2) +
						'-' + ('0' + u.getDate()).slice(-2) +
						' ' + ('0' + u.getHours()).slice(-2) +
						':' + ('0' + u.getMinutes()).slice(-2);*/

					//let allowedTimeVal = allowedTime.toLocaleString();
					// return resultdb(CONSTANTS.VALIDATION_ERROR, "Bet allowed till " + allowedTimeVal + " (30 minutes before) of match start");
					return resultdb(CONSTANTS.VALIDATION_ERROR, "Bet not allowed in running match");
				}
			}
            else {
				if (globalSetting.data[0].bet_allow_time_before != null && globalSetting.data[0].bet_allow_time_before > 0) {
					let matchTimeStamp = Math.round(new Date(matchSetting.match_date).getTime() / 1000);
					let currentTimeStamp = Math.round(Date.now() / 1000) + globalSetting.data[0].bet_allow_time_before;
					if (currentTimeStamp < matchTimeStamp) {
						return resultdb(CONSTANTS.VALIDATION_ERROR, "Bet Allow Before " + globalSetting.data[0].bet_allow_time_before + " Seconds ");
					}
				}
			}


            let marketSetting = await marketsService.getMarketSettingById(data.market_id);

			marketSetting = marketSetting.data;

            if(marketSetting.max_bet_liability < Math.abs(data.liability) && marketSetting.max_bet_liability!=null && marketSetting.max_bet_liability != 0){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Market max bet liability limit is over");
			}



            let teamPositionData =await marketsService.getTeamPosition(data.user_id,data.market_id,data.match_id);
            let teamPosition =teamPositionData.data;




            let runTimeProfitLoss = [];
            let run_time_sum_win_loss = [];
            let old_sum_win_loss = [];
            if(data.is_back==1){
            	teamPosition.forEach(function (position) {
                    old_sum_win_loss.push(position.win_value+position.loss_value);
                    if(position.selection_id == data.selection_id){
                        position.win_value = position.win_value + data.p_l;

                    }else{
                        position.loss_value = position.loss_value - data.stack;
                    }
                    position.sum_win_loss = position.liability_type=="0" ? (position.win_value+position.loss_value) : 0;
                    runTimeProfitLoss.push(position);
                    run_time_sum_win_loss.push(position.sum_win_loss);
                });
            }
            else{
                teamPosition.forEach(function (position) {
                    old_sum_win_loss.push(position.win_value+position.loss_value);
                    if(position.selection_id == data.selection_id){
                        position.win_value = position.win_value + data.liability;
                    }else{
                        position.loss_value = position.loss_value + data.p_l;
                    }
                    position.sum_win_loss =position.liability_type=="0" ? (position.win_value+position.loss_value) : 0;
                    runTimeProfitLoss.push(position);
                    run_time_sum_win_loss.push(position.sum_win_loss);
                });

            }

            let  oldUserMaxProfit = Math.max(...old_sum_win_loss);
            let  oldUserMaxLoss = 0 ;
            let userMaxProfit = 0;
            let  userMaxLoss = 0 ;
            if(matchSetting.liability_type==1){

                if(data.selection_liability_type=="1"){
                    teamPosition.forEach(function (position) {
                        oldUserMaxLoss+= position.liability_type=="1" ? position.stack : 0;
                        //console.log("oldUserMaxLoss",oldUserMaxLoss);
                    });

                    userMaxProfit = 0;

                    userMaxLoss = -(oldUserMaxLoss+data.stack);
                    oldUserMaxLoss = -(oldUserMaxLoss);
                }

                if(data.selection_liability_type=="0"){
                    oldUserMaxLoss = Math.min(...old_sum_win_loss) >= 0 ? 0 : Math.min(...old_sum_win_loss);
                    userMaxProfit = Math.max(...run_time_sum_win_loss);

                    userMaxLoss = Math.min(...run_time_sum_win_loss);
                }


            }else {
                oldUserMaxLoss = Math.min(...old_sum_win_loss) >= 0 ? 0 : Math.min(...old_sum_win_loss);

                userMaxProfit = Math.max(...run_time_sum_win_loss);

                userMaxLoss = Math.min(...run_time_sum_win_loss);
            }

            let userBalance = parseFloat(userData.balance) + Math.abs(oldUserMaxLoss) - pdc_charge;
            if(userMaxLoss >= 0){

                data.liabilityForBlance=  Math.abs(oldUserMaxLoss);
            }else {
                data.liabilityForBlance=Math.abs(oldUserMaxLoss)-Math.abs(userMaxLoss);
            }
            if(userMaxProfit > marketSetting.max_market_profit && marketSetting.max_market_profit!=null && marketSetting.max_market_profit!=0  && matchSetting.liability_type!=1){
                return resultdb(CONSTANTS.VALIDATION_ERROR, " market max profit limit is over");
            }

            if(Math.abs(userMaxLoss) > marketSetting.max_market_liability &&  marketSetting.max_market_liability!=null &&  marketSetting.max_market_liability!=0 ){
                return resultdb(CONSTANTS.VALIDATION_ERROR, " market max liability limit is over");
            }
            let tempUserBalance = userMaxLoss > 0 ? 0 : userMaxLoss ;
            if( Math.abs(tempUserBalance) > userBalance){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Insufficient Balance" );
            }

            if(userMaxProfit > userSetting.max_profit && userSetting.max_profit!=null && userSetting.max_profit!=0 && matchSetting.liability_type!=1){
                return resultdb(CONSTANTS.VALIDATION_ERROR, " User max profit limit is over");
            }

            if(Math.abs(data.liability) > userSetting.max_exposure && userSetting.max_exposure!=null && userSetting.max_exposure!=0){
                return resultdb(CONSTANTS.VALIDATION_ERROR, " User max bet  liability is over");
            }
            if(Math.abs(data.liability) < userSetting.min_exposure && userSetting.min_exposure !=null  && userSetting.min_exposure !=0 ){
                return resultdb(CONSTANTS.VALIDATION_ERROR, " User min bet liability is over");
            }

            if(data.p_l > userSetting.winning_limit && userSetting.winning_limit!=null && userSetting.winning_limit!=0 ){
                return resultdb(CONSTANTS.VALIDATION_ERROR, " User max bet profit is over");
            }

            if(userSetting.odds_max_stack !=null && userSetting.odds_max_stack !=0 && userSetting.odds_max_stack < data.stack){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "max bet limit is over");
            }

            if (userSetting.odds_min_stack !=null && userSetting.odds_min_stack !=0 &&  userSetting.odds_min_stack > data.stack){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "min bet limit is over");
            }

        return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (error) {
        logger.errorlog.error("validateBet",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let validateFancyBet = async (data, pdc_charge = 0) => {


    try {

        let betFairFancy = await exchangeService.getFancyByFancyId(data.fancy_id, data.is_manual_odds);
        betFairFancy = betFairFancy.data;
        if(betFairFancy == null){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Fancy Closed");
        }
        if(betFairFancy.length==0){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Fancy Closed");
        }
        if(betFairFancy.GameStatus!=''){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Fancy Suspended");
        }
        if(data.is_back==1){
            if(betFairFancy.BackPrice1!=data.run){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Run Changed");
            }
            if(betFairFancy.BackSize1!=data.size){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Size Changed");
            }
        }else {
            if(betFairFancy.LayPrice1!=data.run){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Run Changed");
            }
            if(betFairFancy.LaySize1!=data.size){
                return resultdb(CONSTANTS.VALIDATION_ERROR, "Size Changed");
            }
        }

        let userSetting = data.user_setting_data;



        if(data.stack <= 0){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "stack cannot be zero");
        }
        if(data.size <= 0){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "size cannot be zero");
        }
        if(data.run <= 0){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "run cannot be zero");
        }

        let userData = await userService.getUserByUserId(data.user_id);
        userData = userData.data;

        if(userData.lock_fancy_bet==1){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "user betting locked on fancy");
        }
        if(userData.lock_user==1){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "user account is locked");
        }
        if(userData.close_account==1){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "user account is closed");
        }

        let matchSetting = await matchesService.getMatchSettingById(data.match_id);

        matchSetting =  matchSetting.data;


        if(matchSetting.min_stack!=null && matchSetting.min_stack!=0 && matchSetting.min_stack > data.stack){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Match Min stack is over");
        }

        if(matchSetting.max_stack != null && matchSetting.max_stack != 0 && matchSetting.max_stack < data.stack){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Match Max stack is over");
        }


        let teamPositionData =await fancyService.getFancyPosition(data.user_id,data.fancy_id);
        let teamPosition =teamPositionData.data;

        let createFancyPosition = await fancyService.createFancyPosition(data.user_id,data.fancy_id,data);
        createFancyPosition = createFancyPosition.data;



        let  oldUserMaxProfit =teamPosition.profit;
        let  oldUserMaxLoss = teamPosition.liability;

        let  userMaxLoss = createFancyPosition.liability;
        let  userMaxProfit = createFancyPosition.profit;




        let userBalance = parseFloat(userData.balance)+Math.abs(oldUserMaxLoss) - pdc_charge;
        if(userMaxLoss >= 0){
            data.liabilityForBlance= oldUserMaxLoss >= 0 ? 0 : Math.abs(oldUserMaxLoss);
            data.liabilityFancy=0;
        }else {
            data.liabilityForBlance=(Math.abs(oldUserMaxLoss)-Math.abs(userMaxLoss));
            data.liabilityFancy=userMaxLoss;
        }

        if(userSetting.max_session_liability != null && userSetting.max_session_liability != 0 &&  Math.abs(userMaxLoss) > userSetting.max_session_liability){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Max liability is over");
        }

        data.profitFancy=userMaxProfit;
        data.fancy_score_position_json=createFancyPosition.fancy_position;
        data.fancy_score_position_id=teamPosition.id;


        if( Math.abs(userMaxLoss) > userBalance){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "Insufficient Balance");
        }


        /*if(userMaxProfit > userSetting.max_profit ){
            return resultdb(CONSTANTS.VALIDATION_ERROR, " User max profit limit is over");
        }*/


		if (data.max_session_bet_liability != null && data.max_session_bet_liability != 0 && Math.abs(data.liability) > data.max_session_bet_liability){
			return resultdb(CONSTANTS.VALIDATION_ERROR, "Max limit on fancy bet liability is over");
		}

		if (data.max_session_liability != null && data.max_session_liability != 0){
			let getTotalFancyLiability = await MysqlPool.query('SELECT IFNULL(SUM(IFNULL(liability, 0)), 0) AS total_liability FROM fancy_score_position WHERE fancy_id = ? AND user_id != ?', [data.fancy_id, data.user_id]);
			let total_liability = Math.abs(getTotalFancyLiability[0].total_liability) + Math.abs(userMaxLoss);

			if (total_liability > data.max_session_liability) {
				return resultdb(CONSTANTS.VALIDATION_ERROR, "Max limit on fancy liability is over");
			}
		}

		if(userSetting.session_max_stack !=null && userSetting.session_max_stack !=0 && userSetting.session_max_stack < data.stack){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "max session limit is over");
        }

        if (userSetting.session_min_stack !=null && userSetting.session_min_stack !=0 && userSetting.session_min_stack > data.stack){
            return resultdb(CONSTANTS.VALIDATION_ERROR, "min session limit is over");
        }

        return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
    } catch (error) {
        logger.errorlog.error("validateFancyBet",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getBetHistory = async (user_id,user_type_id, fromDate, toDate, page, matchType, is_download = 0, sport_id = '', search = '') => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;
		let sql = 'CALL sp_get_bet_history(?,?,?,?,?,?,?,?,?,?, @out_total); SELECT @out_total AS total;';
		let getHistory = await MysqlPool.query(sql, [user_id,user_type_id,fromDate,toDate,offset,limit,matchType,is_download,sport_id,search]);
		return resultdb(CONSTANTS.SUCCESS, getHistory);
	} catch (e) {
        logger.errorlog.error("getBetHistory",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getBetsByMatchId = async (userid,user_type_id, match_id) => {
	try {
        let condition='';
        switch(user_type_id) {
            case 1:
                condition+=' and b.admin_id= ?';
                break;
            case 2:
                condition+=' and b.master_id= ?';
                break;
            case 3:
                condition+=' and b.super_agent_id= ?';
                break;
            case 4:
                condition+=' and b.agent_id= ?';
                break;
            default:
                condition+=' and b.user_id= ? ';
        }
        let  query= 'select * from(select m.name,b.selection_name,b.odds,b.stack,case when b.is_back="1" then b.p_l else b.liability end as p_l,b.is_back,b.is_matched,b.created_at,b.id bet_id, b.user_id, b.result, b.bet_result_id, b.market_id, b.delete_status, b.deleted_reason, b.deleted_by, 0 as is_fancy,0 as size,u.user_name, mr.name AS market_name from bets_odds b inner join matches m  on b.match_id=m.match_id inner join users u on u.id=b.user_id inner join markets mr on b.market_id=mr.market_id  where b.delete_status != "1" AND b.bet_result_id IS NULL AND b.match_id = ? ' + condition + ' UNION ALL select m.name,b.run as selection_name, b.run as odds,b.stack, case when b.is_back="1" then b.profit else b.liability end as p_l,b.is_back,1 as is_matched,b.created_at,b.id bet_id, b.user_id, m.result, b.bet_result_id, b.fancy_id as market_id, b.delete_status, b.deleted_reason, b.deleted_by, 1 as is_fancy,b.size,u.user_name, "" AS market_name from bets_fancy b inner join fancy m  on b.fancy_id=m.fancy_id inner join users u on u.id=b.user_id where b.delete_status IN("0", "2") AND b.match_id = ? ' + condition + ' and b.bet_result_id IS NULL ) as x order by x.created_at desc';

		let resFromDB = await MysqlPool.query(query, [match_id,userid, match_id,userid]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getBetsByMatchId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getBetsByMarketId = async (userid,user_type_id, market_id, market_type = '') => {
    try {
        let condition='';
        switch(user_type_id) {
            case 1:
                condition+=' and b.admin_id= ?';
                break;
            case 2:
                condition+=' and b.master_id= ?';
                break;
            case 3:
                condition+=' and b.super_agent_id= ?';
                break;
            case 4:
                condition+=' and b.agent_id= ?';
                break;
            default:
                condition+=' and b.user_id= ?';
        }

		let query = '';
        if(market_type == '2'){
			query = 'select b.fancy_id market_id,m.name, b.run as selection_name, b.run as odds, b.stack, case when b.is_back="1" then b.profit else b.liability end as p_l, b.chips, b.is_back, 1 as is_matched, b.delete_status, b.created_at, b.ip_address, u.name AS client_name, u.user_name AS client_user_name, ag.name AS agent_name, ag.user_name AS agent_user_name, sa.name AS super_agent_name, sa.user_name AS super_agent_user_name, ms.name AS master_name, ms.user_name AS master_user_name, (CASE WHEN (b.delete_status = "3") THEN "ABANDONED" ELSE m.result END) AS bet_result from bets_fancy b inner join fancy m on (b.fancy_id = m.fancy_id) inner join users u on (b.user_id = u.id) left join users ag on (b.agent_id = ag.id) left join users sa on (b.super_agent_id = sa.id) left join users ms on (b.master_id = ms.id) where b.delete_status IN("0", "2") AND b.fancy_id = ? ' + condition + ' order by b.created_at desc';
		}else{
			query = 'SELECT aa.*, (CASE WHEN aa.result = -1 THEN "ABANDONED" ELSE (SELECT s.name FROM market_selection s WHERE s.selection_id = aa.selection_id and s.match_id = aa.match_id limit 1) END) AS bet_result FROM(select m.name, b.selection_name, b.odds, b.stack, b.p_l, b.chips, b.is_back, b.is_matched, b.delete_status, b.created_at, b.ip_address, u.name AS client_name, u.user_name AS client_user_name, ag.name AS agent_name, ag.user_name AS agent_user_name, sa.name AS super_agent_name, sa.user_name AS super_agent_user_name, ms.name AS master_name, ms.user_name AS master_user_name, br.selection_id, b.match_id, b.market_id, b.result from bets_odds b inner join matches m on (b.match_id = m.match_id) inner join users u on (b.user_id = u.id) left join users ag on (b.agent_id = ag.id) left join users sa on (b.super_agent_id = sa.id) left join users ms on (b.master_id = ms.id) LEFT JOIN bet_results br ON b.bet_result_id = br.id where b.delete_status != "1" AND b.market_id = ? ' + condition + ' group by b.id order by b.created_at desc) As aa';
		}
        let resFromDB = await MysqlPool.query(query, [market_id, userid]);

        return resultdb(CONSTANTS.SUCCESS, resFromDB);
    } catch (error) {
        logger.errorlog.error("getBetsByMarketId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getAllBets = async (userid, user_type_id) => {
	try {

		let condition='';
		switch(user_type_id) {
			case 1:
				condition+=' and b.admin_id= ?';
				break;
			case 2:
				condition+=' and b.master_id= ?';
				break;
			case 3:
				condition+=' and b.super_agent_id= ?';
				break;
			case 4:
				condition+=' and b.agent_id= ?';
				break;
			default:
				condition+=' and b.user_id= ?';
		}

		let resFromDB = await MysqlPool.query('select * from(select m.name,b.selection_name,b.odds,b.stack,case when b.is_back="1" then b.p_l else b.liability end as p_l,b.is_back,b.is_matched,b.delete_status,b.created_at, 0 as is_fancy ,0 as size, mr.name AS market_name from bets_odds b inner join matches m on b.match_id=m.match_id inner join markets mr on b.market_id=mr.market_id where b.delete_status != "1" AND b.bet_result_id IS NULL ' + condition + ' UNION ALL select m.name,b.run as selection_name, b.run as odds, b.stack, case when b.is_back="1" then b.profit else b.liability end as p_l, b.is_back, 1 as is_matched, b.delete_status, b.created_at, 1 as is_fancy , b.size, "" AS market_name from bets_fancy b inner join matches m  on b.match_id=m.match_id where b.delete_status != "1" AND b.bet_result_id IS NULL ' + condition + ') as x order by x.created_at desc', [userid, userid]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getAllBets",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getResultOdds = async (pSportsID, pMatchID, pMarketID, pSelectionID, pSportsNM, pMatchNM, pMarketNM, pSelectionNM) => {
	try {
		let sql = 'CALL sp_set_result_odds(?, ?, ?, ?, ?, ?, ?, ?, ?)';
		let getResult = await MysqlPool.query(sql, [pSportsID, pMatchID, pMarketID, pSelectionID, pSportsNM, pMatchNM, pMarketNM, pSelectionNM, CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE]);
		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (e) {
        logger.errorlog.error("getResultOdds",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getResultOddsPerSelection = async (pSportsID, pMatchID, pMarketID, pSelectionID, pOdds,pIsWinner) => {
    try {
        let sql = 'CALL sp_set_result_odds_per_selection(?, ?, ?, ?, ?, ?)';
        let getResult = await MysqlPool.query(sql, [pSportsID, pMatchID, pMarketID, pSelectionID, pOdds, pIsWinner]);

        return resultdb(CONSTANTS.SUCCESS, getResult[0]);
    } catch (e) {
        logger.errorlog.error("getResultOddsPerSelection",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let deleteBet = async (bet_id, user_id, market_id, is_fancy, is_void, remote_ip = '') => {
    const conn = await connConfig.getConnection();
	try {
        await conn.beginTransaction();
		if(is_fancy == 1) {

			let checkBet = await MysqlPool.query("SELECT * FROM bets_fancy WHERE id = ? AND bet_result_id IS NULL AND delete_status = '0' LIMIT 1;", [bet_id]);

			if(checkBet.length > 0) {
				let getFancyPosition = await fancyService.getFancyPosition(user_id, market_id);


				let oldLiability = getFancyPosition.data.liability;
				let fancy_score_position_id = getFancyPosition.data.id;

				let updateQuery;
				let message;
				if (is_void) {
					updateQuery = "UPDATE bets_fancy SET delete_status = '2', deleted_reason = 'Bet void by admin', deleted_by = 1, deleted_from_ip = ? WHERE id = ? LIMIT 1";
					message = "Fancy Bet Void Successfully";
				} else {
					updateQuery = "UPDATE bets_fancy SET delete_status = '1', deleted_reason = 'Bet deleted by admin', deleted_by = 1, deleted_from_ip = ? WHERE id = ? LIMIT 1";
					message = "Fancy Bet Deleted Successfully";
				}
				await conn.query(updateQuery, [remote_ip, bet_id]);
				let getRunTimeFancyPosition = await fancyService.getRunTimeFancyPosition(user_id, market_id, null, [bet_id]);


				let newLiability = (getRunTimeFancyPosition.data) ? getRunTimeFancyPosition.data.liability : 0;
				let liability = Math.abs(newLiability) - Math.abs(oldLiability);
				let newFancyPosition = (getRunTimeFancyPosition.data) ? getRunTimeFancyPosition.data.fancy_position : [];
				let fancyScorePositionData = {
					liability: newLiability,
					fancy_score_position_json: JSON.stringify(newFancyPosition)
				};

				await conn.query('update  fancy_score_position SET ? where id=?', [fancyScorePositionData, fancy_score_position_id]);

				await conn.query('update users SET liability=liability-?,balance=balance-? where id=?', [liability, liability, user_id]);

				await conn.commit();
				conn.release();
				return resultdb(CONSTANTS.SUCCESS, message, 1);
			}else{
				return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
			}
		}else{
			let checkBet = await MysqlPool.query("SELECT * FROM bets_odds WHERE id = ? AND bet_result_id IS NULL AND delete_status = '0' LIMIT 1;", [bet_id]);

			if(checkBet.length > 0) {
				let sql = 'CALL sp_delete_odds_bet(?, ?, ?, ?, ?);';
				let getResult = await conn.query(sql, [bet_id, user_id, market_id, is_void, remote_ip]);
				await conn.commit();
				conn.release();

				return resultdb(CONSTANTS.SUCCESS, getResult[0][0][0].retMess,getResult[0][0][0].resultV);
			}else{
				return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
			}
		}

	} catch (e) {
        logger.errorlog.error("deleteBet",e);
        await conn.rollback();
        conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateBetsOddsParSelectionId = async (data) => {
    try {
        let updateQuery = 'update bets_odds set odds=? where selection_id=?';
        let resFromDB = await MysqlPool.query(updateQuery, [data.odds, data.selection_id]);
        return resultdb(CONSTANTS.SUCCESS, resFromDB);
    } catch (error) {
        logger.errorlog.error("updateBetsOddsParSelectionId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getAllBetsByMatchWithSearch = async (user_id, user_type_id, match_id, page, search) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;
		let condition='';

		switch(user_type_id) {
			case 1:
				condition += ' AND a.admin_id = ? ';
				break;
			case 2:
				condition += ' AND a.master_id = ? ';
				break;
			case 3:
				condition += ' AND a.super_agent_id = ? ';
				break;
			case 4:
				condition += ' AND a.agent_id = ? ';
				break;
			default:
				condition += ' AND a.user_id = ? ';
		}

		let values = [];
		if(search != ''){
			condition += ' AND (b.name LIKE ? OR b.user_name LIKE ?) ';
			values = [match_id, user_id, '%' + search + '%', '%' + search + '%', match_id, user_id, '%' + search + '%', '%' + search + '%', offset, limit];
		}else{
			values = [match_id, user_id, match_id, user_id, offset, limit];
		}

		let query = 'SELECT ';
		if(page == 1){
			query += ' SQL_CALC_FOUND_ROWS ';
		}

        query += ' * FROM(SELECT a.id AS bet_id, a.user_id, b.name AS client_name, b.user_name AS client_user_name, c.name AS agent_name, c.user_name AS agent_user_name, d.name AS super_agent_name, d.user_name AS super_agent_user_name, e.name AS master_name, e.user_name AS master_user_name, g.name AS admin_name, g.user_name AS admin_user_name, a.market_id AS market_id, f.name AS market_name, a.sport_id, a.match_id, a.selection_name AS selection_name, a.odds AS odds, a.stack, a.is_back, a.delete_status, 0 AS is_fancy, a.created_at, a.is_matched, a.p_l,a.ip_address FROM bets_odds a INNER JOIN users b ON(a.user_id = b.id) LEFT JOIN users c ON(a.agent_id = c.id) LEFT JOIN users d ON(a.super_agent_id = d.id) LEFT JOIN users e ON(a.master_id = e.id) LEFT JOIN users g ON(a.admin_id = g.id) INNER JOIN markets f ON(a.market_id = f.market_id) WHERE a.match_id = ? AND a.delete_status != "1" AND a.bet_result_id IS NULL ' + condition + ' UNION ALL SELECT a.id AS bet_id, a.user_id, b.name AS client_name, b.user_name AS client_user_name, c.name AS agent_name, c.user_name AS agent_user_name, d.name AS super_agent_name, d.user_name AS super_agent_user_name, e.name AS master_name, e.user_name AS master_user_name, g.name AS admin_name, g.user_name AS admin_user_name, a.fancy_id AS market_id, a.fancy_name AS market_name, a.sport_id, a.match_id, a.run AS selection_name, a.run AS odds, a.stack, a.is_back, a.delete_status, 1 AS is_fancy, a.created_at, 1 AS is_matched, a.stack as p_l,a.ip_address FROM bets_fancy a INNER JOIN users b ON(a.user_id = b.id) LEFT JOIN users c ON(a.agent_id = c.id) LEFT JOIN users d ON(a.super_agent_id = d.id) LEFT JOIN users e ON(a.master_id = e.id) LEFT JOIN users g ON(a.admin_id = g.id) WHERE a.match_id = ? AND a.delete_status != "1" AND a.bet_result_id IS NULL ' + condition + ' ) AS x ORDER BY created_at DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS total;';
		let resFromDB = await MysqlPool.query(query, values);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getAllBetsByMatchWithSearch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getDeletedBets = async (user_id, user_type_id, page, search) => {
	try {
		let limit = CONSTANTS.LIMIT;
		let offset = (page - 1) * limit;
		let condition='';

		switch(user_type_id) {
			case 1:
				condition += ' AND a.admin_id = ? ';
				break;
			case 2:
				condition += ' AND a.master_id = ? ';
				break;
			case 3:
				condition += ' AND a.super_agent_id = ? ';
				break;
			case 4:
				condition += ' AND a.agent_id = ? ';
				break;
			default:
				condition += ' AND a.user_id = ? ';
		}

		let values = [];
		if(search != ''){
			condition += ' AND (b.name LIKE ? OR b.user_name LIKE ? OR g.name LIKE ?) ';
			values = [user_id, '%' + search + '%', '%' + search + '%', '%' + search + '%', user_id, '%' + search + '%', '%' + search + '%', '%' + search + '%', offset, limit];
		}else{
			values = [user_id, user_id, offset, limit];
		}

		let query = 'SELECT ';
		if(page == 1){
			query += ' SQL_CALC_FOUND_ROWS ';
		}

		query += ' * FROM(SELECT a.id AS bet_id, a.user_id, b.name AS client_name, b.user_name AS client_user_name, c.name AS agent_name, c.user_name AS agent_user_name, d.name AS super_agent_name, d.user_name AS super_agent_user_name, e.name AS master_name, e.user_name AS master_user_name, a.market_id AS market_id, f.name AS market_name, g.name AS match_name, a.sport_id, a.match_id, a.selection_name AS selection_name, a.odds AS odds, a.stack, a.is_back, a.delete_status, 0 AS is_fancy, a.created_at, a.is_matched, a.p_l, a.deleted_from_ip FROM bets_odds a LEFT JOIN users b ON(a.user_id = b.id) LEFT JOIN users c ON(a.agent_id = c.id) LEFT JOIN users d ON(a.super_agent_id = d.id) LEFT JOIN users e ON(a.master_id = e.id) LEFT JOIN markets f ON(a.market_id = f.market_id) LEFT JOIN matches g ON(a.match_id = g.match_id) WHERE  a.delete_status != "0" ' + condition + ' UNION ALL SELECT a.id AS bet_id, a.user_id, b.name AS client_name, b.user_name AS client_user_name, c.name AS agent_name, c.user_name AS agent_user_name, d.name AS super_agent_name, d.user_name AS super_agent_user_name, e.name AS master_name, e.user_name AS master_user_name, a.fancy_id AS market_id, a.fancy_name AS market_name, g.name AS match_name, a.sport_id, a.match_id, a.run AS selection_name, a.run AS odds, a.stack, a.is_back, a.delete_status, 1 AS is_fancy, a.created_at, 1 AS is_matched, a.stack as p_l, a.deleted_from_ip FROM bets_fancy a LEFT JOIN users b ON(a.user_id = b.id) LEFT JOIN users c ON(a.agent_id = c.id) LEFT JOIN users d ON(a.super_agent_id = d.id) LEFT JOIN users e ON(a.master_id = e.id) LEFT JOIN matches g ON(a.match_id = g.match_id) WHERE a.delete_status in( "1","2" ) ' + condition + ' ) AS x ORDER BY created_at DESC LIMIT ?, ?; SELECT FOUND_ROWS() AS total;';
		let resFromDB = await MysqlPool.query(query, values);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getDeletedBets",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getBetsByMarketAndUser = async (user_id, user_type_id, match_id, market_id, type) => {
	try {
		let condition='';
		switch(user_type_id) {
			case 1:
				condition+=' and b.admin_id= ?';
				break;
			case 2:
				condition+=' and b.master_id= ?';
				break;
			case 3:
				condition+=' and b.super_agent_id= ?';
				break;
			case 4:
				condition+=' and b.agent_id= ?';
				break;
			default:
				condition+=' and b.user_id= ? ';
		}

		let  query= '';
		if(type == '2'){
			query= 'select m.name,b.run as selection_name, b.run as odds,b.stack, case when b.is_back="1" then b.profit else b.liability end as p_l,b.is_back,1 as is_matched,b.created_at,b.id bet_id, b.user_id, m.result, b.bet_result_id, b.fancy_id as market_id, b.delete_status, b.deleted_reason, b.deleted_by, 1 as is_fancy,b.size,u.user_name, "" AS market_name from bets_fancy b inner join fancy m  on b.fancy_id=m.fancy_id inner join users u on u.id=b.user_id where b.delete_status = "0" AND b.match_id = ? AND b.fancy_id = ? ' + condition + ' order by b.created_at desc';
		}else{
			query= 'select m.name,b.selection_name,b.odds,b.stack,case when b.is_back="1" then b.p_l else b.liability end as p_l,b.is_back,b.is_matched,b.created_at,b.id bet_id, b.user_id, b.result, b.bet_result_id, b.market_id, b.delete_status, b.deleted_reason, b.deleted_by, 0 as is_fancy,0 as size,u.user_name, mr.name AS market_name from bets_odds b inner join matches m  on b.match_id=m.match_id inner join users u on u.id=b.user_id inner join markets mr on b.market_id=mr.market_id  where b.delete_status = "0" AND b.match_id = ? AND b.market_id = ? ' + condition + ' order by b.created_at desc';
		}

		let resFromDB = await MysqlPool.query(query, [match_id, market_id, user_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getBetsByMarketAndUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getBetCountByMatchAndUser = async (user_id, user_type_id, match_id) => {
	try {
		let condition='';
		switch(user_type_id) {
			case 1:
				condition+=' and b.admin_id= ?';
				break;
			case 2:
				condition+=' and b.master_id= ?';
				break;
			case 3:
				condition+=' and b.super_agent_id= ?';
				break;
			case 4:
				condition+=' and b.agent_id= ?';
				break;
			default:
				condition+=' and b.user_id= ? ';
		}

		let  query= 'SELECT SUM(records) records FROM ( (select COUNT(*) records from bets_fancy b where b.delete_status = "0" AND b.match_id = ?' + condition + ')  UNION ALL  (select COUNT(*) records from bets_odds b inner join matches m  on b.match_id=m.match_id where b.delete_status = "0" AND b.match_id = ?' + condition + ')) a';

		let resFromDB = await MysqlPool.query(query, [match_id, user_id, match_id, user_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getBetCountByMatchAndUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getBetDetails = async (bet_id, is_fancy) => {
	try {
		//add more fields as required
		let query = '';
		if(is_fancy){
			query = 'SELECT * FROM bets_fancy b WHERE b.id=? AND b.delete_status = "0"';
		}
		else{
			query = 'SELECT * FROM bets_odds b WHERE b.id=? AND b.delete_status = "0"';
		}
		let resFromDB = await MysqlPool.query(query, [bet_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getBetDetails",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let permanentDeleteBet = async (bet_id, is_fancy) => {
	const conn = await connConfig.getConnection();
	try {
		await conn.beginTransaction();
		let table_name = 'bets_odds';
		if(is_fancy == 1) {
			table_name = 'bets_fancy';
		}
		let query=`DELETE FROM ${table_name} WHERE id = ? AND delete_status IN('1', '2');`;
		await conn.query(query, [bet_id]);
		await conn.commit(); conn.release();
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (e) {
        logger.errorlog.error("permanentDeleteBet",e);
		await conn.rollback(); conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let deleteMarketIfBetNotExist = async (spost_id, market_id) => {
	try {
        let qry = 'SELECT * FROM sports where sport_id = ? LIMIT 1;';
        let sportsdetails = await MysqlPool.query(qry, [spost_id]);
        if (sportsdetails.length > 0 && sportsdetails[0].is_live_sport == "1") {
            let qry = 'SELECT id as bet_id FROM bets_odds where market_id = ? and delete_status = "0" LIMIT 1;';
            let betDetails = await MysqlPool.query(qry, [market_id]);
            if (betDetails.length>0){
                return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
            }else{
                let sql = 'DELETE FROM markets where market_id = ?';
                await MysqlPool.query(sql, [market_id])
                return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
            }
        } else {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }
    } catch (e) {
        logger.errorlog.error("deleteMarketIfBetNotExist",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
module.exports = {
	saveBet,
	getBetHistory,
	getBetsByMatchId,
    getBetsByMarketId,
	getAllBets,
	getResultOdds,
    validateBet,
	deleteBet,
    saveFancyBet,
    validateFancyBet,
	getAllBetsByMatchWithSearch,
    updateBetsOddsParSelectionId,
	getDeletedBets,
    getResultOddsPerSelection,
	getBetsByMarketAndUser,
	getBetDetails,
    permanentDeleteBet,
    deleteMarketIfBetNotExist
};
