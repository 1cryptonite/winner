const MysqlPool = require('../../db');
const	globalFunction = require('../../utils/globalFunction');
const	CONSTANTS = require('../../utils/constants');
const	selectionService = require('../../routes/services/selectionService');
const	exchangeService = require('../../routes/services/exchangeService');
const connConfig = require('../../db/indexTest');
const redis_client = require('../../db/redis');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let getAllMarket = async (data) => {
	try {
		let calcTemp='';
		if (data.pageno===1) {
			calcTemp='SQL_CALC_FOUND_ROWS';
		}
		let queryString ='SELECT '+calcTemp+' markets.id,markets.is_active, markets.sport_id,markets.series_id,markets.match_id,markets.market_id,markets.name as marketName,matches.NAME as matchName,series.name as seriesName from markets INNER join matches on markets.match_id=matches.match_id INNER JOIN series ON markets.series_id=series.series_id  where 1=1 and markets.is_result_declared="0"';

		let conditionParameter=[];
		let offSet=' LIMIT ? OFFSET ?';

		if(data.marketName!==null){
			queryString+= ' and markets.name LIKE ? ';
			conditionParameter.push('%'+data.marketName+'%');
		}
		if(data.seriesName!==null){
			queryString+= ' and series.name LIKE ? ';
			conditionParameter.push('%'+data.seriesName+'%');
		}
		if(data.matchName!==null){
			queryString+= ' and matches.name LIKE ? ';
			conditionParameter.push('%'+data.matchName+'%');
		}
		if (data.limit!==null && data.pageno!==null) {
			conditionParameter.push(data.limit);
			conditionParameter.push(((data.pageno-1)*data.limit));
			queryString=queryString+offSet;
		}

		queryString=queryString+'; SELECT FOUND_ROWS() AS total;';

		let matchesdetails =await MysqlPool.query(queryString,conditionParameter);

		let returnRes={
			list:matchesdetails[0],
			total:matchesdetails[1][0].total
		};
		if (matchesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, returnRes);
		}
	} catch (error) {
		logger.errorlog.error("getAllMarket",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let createMarket = async (data) => {
	try {
		let matchData =await MysqlPool.query('SELECT COUNT(*) AS matchCount FROM matches AS m INNER JOIN series AS s ON(m.series_id=s.series_id) INNER JOIN sports AS sp ON(m.sport_id=sp.sport_id) WHERE m.match_id = ? AND m.is_active = "1" AND s.is_active = "1" AND sp.is_active = "1" LIMIT 1;',[data.match_id]);

		if (matchData[0].matchCount > 0) {
			let resFromDB = await MysqlPool.query('INSERT INTO markets SET ? ON DUPLICATE KEY UPDATE update_at=UNIX_TIMESTAMP()', data);

			if (resFromDB.affectedRows > 0) {
				await MysqlPool.query('UPDATE markets SET create_at = UNIX_TIMESTAMP(), update_at = UNIX_TIMESTAMP() WHERE id = ?', [resFromDB.insertId]);
			}
			return resultdb(CONSTANTS.SUCCESS, resFromDB);
		}else{
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}
	} catch (error) {
		logger.errorlog.error("createMarket",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateMarketStatus = async (id) => {
	try {
		let resFromDB = await MysqlPool.query('UPDATE markets  SET is_active = IF(is_active=?, ?, ?) WHERE market_id =?',['1','0','1',id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateMarketStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateMarketCardsData = async (cardJson,id) => {
    try {
        let resFromDB = await MysqlPool.query('UPDATE markets  SET card_data = ? WHERE market_id =?',[cardJson,id]);
        return resultdb(CONSTANTS.SUCCESS, resFromDB);
    } catch (error) {
		logger.errorlog.error("updateMarketCardsData",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getMarketByListOfID = async (idlist) => {
	try {
		let marketdetails =await MysqlPool.query('SELECT * FROM markets  where market_id  in  (?)',[idlist]);

		if (marketdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, marketdetails);
		}
	} catch (error) {
		logger.errorlog.error("getMarketByListOfID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let createMarketSelections = async (idlist) => {
	try {
		let data=JSON.parse(JSON.stringify(idlist));
		let marketdetails =await MysqlPool.query('INSERT INTO market_selection (match_id, market_id,  selection_id, name, sort_priority, liability_type) VALUES ? ',[data]);
		//console.log('INSERT INTO market_selection (match_id, market_id,  selection_id, name, sort_priority, liability_type) VALUES ? ',[data]);
		if (marketdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, marketdetails);
		}
	} catch (error) {
		logger.errorlog.error("createMarketSelections",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateMarket = async (parameter,condition) => {
	try {
		let resFromDB = await MysqlPool.query('UPDATE markets SET ? WHERE market_id in  (?)',[parameter, condition]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateMarket",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let gatDataByMarketId = async (marketId) => {
	try {
		let marketdetails = await MysqlPool.query('select mr.sport_id,mr.series_id,mr.match_id,mr.market_id,mr.max_bet_liability,mr.is_result_declared,mr.is_active,mr.is_visible,sp.is_live_sport, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market, mr.runner_json from markets mr inner join sports sp on mr.sport_id=sp.sport_id where mr.market_id=? limit 1', [marketId]);

		if (marketdetails === null || marketdetails.length == 0  ) {

			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		} else {
			return resultdb(CONSTANTS.SUCCESS, marketdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("gatDataByMarketId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};



let getMarketSettingById = async (id) => {
	try {
		let query='select max_bet_liability , max_market_liability, max_market_profit from markets where market_id=?';
		let marketdetails = await MysqlPool.query(query,[id]);
		
		if (marketdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			
			return resultdb(CONSTANTS.SUCCESS, marketdetails[0]);
		}
	} catch (error) {
		logger.errorlog.error("getMarketSettingById",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getTeamPosition = async (user_id,market_id,match_id,user_type=null,is_show_100_percent = 0) => {
	try {
	//	is_show_100_percent = 0;
		let selectSring ;
        let condition = " where market_id= ? " ;
        /*let condition  ;
		if(match_id > 0){
             condition = " where market_id= ? " ;
        }else{
            condition = " where match_id= ? " ;
            market_id = match_id;
        }*/

        if(is_show_100_percent == 1){
			selectSring=", sum(admin_win_loss + master_win_loss + super_agent_win_loss + agent_win_loss) as win_loss ";
		}

		switch(user_type) {
		case 1:
            condition+=' and admin_id= ? ';
			if(is_show_100_percent != 1){
				selectSring=", sum(admin_win_loss)  as win_loss ";
			}
			break;
		case 2:
            condition+=' and master_id= ?';
			if(is_show_100_percent != 1){
				selectSring=", sum(master_win_loss)  as win_loss ";
			}
			break;
		case 3:
            condition+=' and super_agent_id= ?';
			if(is_show_100_percent != 1){
				selectSring=", sum(super_agent_win_loss)  as win_loss ";
			}
			break;
		case 4:
            condition+=' and agent_id= ?';
			if(is_show_100_percent != 1){
				selectSring=", sum(agent_win_loss)  as win_loss ";
			}
			break;
		default:
            condition+=' and user_id= ?';
            selectSring=", unmatch_win_loss_value,win_value,loss_value, sum(win_value) + sum(loss_value) as win_loss "
		}
        let query='select match_id,market_id,selection_id,selection_name,sort_priority,liability_type,stack '+selectSring+' from odds_profit_loss '+condition + ' group by selection_id';


		let teamPosition = await MysqlPool.query(query,[market_id,user_id]);
		if (teamPosition===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{

			if(teamPosition.length > 0){

				return resultdb(CONSTANTS.SUCCESS, teamPosition);
			}else {
                let selectionsData;
				if(match_id > 0){
                      selectionsData = await selectionService.getSelectionByMarketId(market_id);
				}else{
                     selectionsData = await selectionService.getSelectionByMatchId(match_id);
				}


				selectionsData.data.map(function (data) {
                    data.market_id=data.market_id;
                    data.stack=data.stack;
                    data.selection_id=data.selection_id;
                    data.selection_name=data.name;
                    data.sort_priority=data.sort_priority;
                    data.unmatch_win_loss_value=0;
                    data.win_value=0;
                    data.loss_value=0;
                    data.win_loss=0;
                });

                return resultdb(CONSTANTS.SUCCESS, selectionsData.data);
			}

		}
	} catch (error) {
		logger.errorlog.error("getTeamPosition",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getTeamPositionForLiveGameMatch = async (user_id,market_id) => {
    try {


        let query='select ifnull(b.market_id,11.191708175507) market_id,ms.match_id,ms.name selection_name,ms.sort_priority,ms.selection_id, ifnull(sum(b.stack),0) win_loss from market_selection ms left   join   bets_odds  b on (b.match_id=ms.match_id and ms.selection_id=b.selection_id and b.market_id=11.191708175507 ) where  ms.match_id = -1 group by ms.selection_id';



        let teamPosition = await MysqlPool.query(query,[market_id,market_id,user_id]);
        if (teamPosition===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{

            if(teamPosition.length > 0){

                return resultdb(CONSTANTS.SUCCESS, {"liability":teamPosition[0].win_loss});
            }else {
            	return resultdb(CONSTANTS.SUCCESS, {"liability":0});
            }

        }
    } catch (error) {
		logger.errorlog.error("getTeamPositionForLiveGameMatch",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

/*let getLiabilityTeamPosition = async (user_id,market_id) => {
    try {


        let query='select min(win_value+loss_value) as win_loss from odds_profit_loss where market_id= ? and user_id= ? group by selection_id';



        let teamPosition = await MysqlPool.query(query,[market_id,user_id]);
        if (teamPosition===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{

            if(teamPosition.length > 0){

                return resultdb(CONSTANTS.SUCCESS, {"liability":teamPosition[0].win_loss});
            }else {
            	return resultdb(CONSTANTS.SUCCESS, {"liability":0});
            }

        }
    } catch (error) {
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};*/



let getLiveMatchMarketIdList = async () => {
	try {
		let query='select market_id as id, name   from markets';
		let marketdetails = await MysqlPool.query(query);

		if (marketdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, marketdetails);
		}
	} catch (error) {
		logger.errorlog.error("getLiveMatchMarketIdList",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let undeclearedMarkets = async () => {
	try {
		let query='SELECT a.sport_id, d.name AS sport_name, a.series_id, c.name AS series_name, a.match_id, b.name AS match_name, a.market_id, a.name AS market_name FROM markets AS a INNER JOIN matches AS b ON (a.match_id = b.match_id) INNER JOIN series AS c ON (a.series_id = c.series_id) INNER JOIN sports AS d ON (a.sport_id = d.sport_id) WHERE a.is_result_declared = "0" and a.market_id!=0 ORDER BY b.name ASC;';

		let matches = await MysqlPool.query(query);

		if (matches===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, matches);
		}
	} catch (error) {
		logger.errorlog.error("undeclearedMarkets",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let undeclearedMarketsForAutoDecliredResult = async () => {
    try {
        let query='SELECT a.sport_id, d.name AS sport_name, a.series_id, c.name AS series_name, a.match_id, b.name AS match_name, a.market_id, a.name AS market_name FROM markets AS a INNER JOIN matches AS b ON (a.match_id = b.match_id) INNER JOIN series AS c ON (a.series_id = c.series_id) INNER JOIN sports AS d ON (a.sport_id = d.sport_id) WHERE a.is_result_declared = "0" and b.match_date <= now() and a.match_id > 0 and a.sport_id > 0  ORDER BY b.name ASC;';

        let matches = await MysqlPool.query(query);

        if (matches===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, matches);
        }
    } catch (error) {
		logger.errorlog.error("undeclearedMarketsForAutoDecliredResult",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getMarketSelections = async (marketId) => {
	try {
		let query='SELECT ms.selection_id, ms.name FROM market_selection ms inner join matches m on m.match_id=ms.match_id  inner join sports sp on sp.sport_id=m.sport_id   inner join markets mr on case when  (mr.match_id <= 0 and sp.is_live_sport=1)  then mr.match_id=ms.match_id   else mr.market_id=ms.market_id end where mr.market_id=? ORDER BY ms.sort_priority ASC';

		let selections = await MysqlPool.query(query,[marketId]);

		if (selections===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, selections);
		}
	} catch (error) {
		logger.errorlog.error("getMarketSelections",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let declearedMarkets = async (sport_id = '',data) => {
	try {
		let conditions_market = '';
		let conditions_fancy = '';
		if(sport_id != ''){
			conditions_market += ' AND a.sport_id = ?';
			conditions_fancy += ' AND b.sport_id = ?';
		}

		let calcTemp='';
		if (data.pageno===1) {
			calcTemp='SQL_CALC_FOUND_ROWS';
		}

		let offSet=' ';
		if (data.limit!==null && data.pageno!==null) {
			offSet=' LIMIT '+data.limit+' OFFSET '+((data.pageno-1)*data.limit);
		}

		if (data.matchName!='') {
			conditions_market += ' AND b.name like "%'+data.matchName+'%"';
			conditions_fancy += ' AND b.name like "%'+data.matchName+'%"';
		}

		if (data.marketName!='') {
			conditions_market += ' AND a.name like "%'+data.marketName+'%"';
			conditions_fancy += ' AND a.name like "%'+data.marketName+'%"';
		}

		if (data.marketId!='') {
			conditions_market += ' AND a.market_id like "%'+data.marketId+'%"';
			conditions_fancy += ' AND a.fancy_id like "%'+data.marketId+'%"';
		}



		let query='SELECT '+calcTemp+' * FROM ( SELECT a.sport_id, d.name AS sport_name, a.series_id, c.name AS series_name, a.match_id, b.name AS match_name, a.market_id, a.name AS market_name, e.selection_id, CASE WHEN(a.is_abandoned = "0") THEN e.result ELSE "Abandoned" END AS result, e.id AS bet_result_id, "1" AS type, CASE WHEN(a.is_abandoned = "0") THEN f.name ELSE "Abandoned" END AS selection_name, a.is_abandoned, e.created_at FROM markets AS a INNER JOIN matches AS b ON (a.match_id = b.match_id) INNER JOIN series AS c ON (a.series_id = c.series_id) INNER JOIN sports AS d ON (a.sport_id = d.sport_id) INNER JOIN bet_results AS e ON(a.match_id=e.match_id AND a.market_id=e.market_id AND e.type="1") LEFT JOIN market_selection AS f ON (e.market_id = f.market_id AND e.selection_id = f.selection_id) WHERE is_result_declared = "1" ' + conditions_market + ' UNION ALL SELECT b.sport_id, d.name AS sport_name, b.series_id, c.name AS series_name, a.match_id, b.name AS match_name, a.fancy_id AS market_id, a.name AS market_name, e.selection_id, e.result, e.id AS bet_result_id, e.type, e.result AS selection_name, CASE WHEN(a.active = "3") THEN "1" ELSE "0" END AS is_abandoned, e.created_at FROM fancy AS a INNER JOIN matches AS b ON (a.match_id = b.match_id) INNER JOIN series AS c ON (b.series_id = c.series_id) INNER JOIN sports AS d ON (b.sport_id = d.sport_id) INNER JOIN bet_results AS e ON(a.match_id=e.match_id AND a.fancy_id=e.market_id AND e.type="2" ' + conditions_fancy + ') ) AS x   ORDER BY x.created_at DESC, x.match_id DESC '+offSet + ' ;SELECT FOUND_ROWS() AS total';



		let matches = await MysqlPool.query(query,[sport_id, sport_id]);
        
		if (matches===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, {list:matches[0],total:matches[1][0].total});
		}
	} catch (error) {
		logger.errorlog.error("declearedMarkets",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getRollbackOdds = async (pBetResultId, pMatchID, pMarketID) => {
	try {
		let sql = 'CALL sp_rollback_result_odds(?,?,?,?)';

		let getRollbackResult = await MysqlPool.query(sql, [pBetResultId, pMatchID, pMarketID, CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE]);

		return resultdb(CONSTANTS.SUCCESS, getRollbackResult[0]);
	} catch (e) {
		logger.errorlog.error("getRollbackOdds",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let addMarketFavourite = async ( user_id, market_id) => {
    try {

        let getRollbackResult = await MysqlPool.query('select id from  user_favourite where user_id =? and market_id =? limit 0,1', [user_id, market_id]);

		if(getRollbackResult.length <= 0){

            await MysqlPool.query('insert INTO user_favourite (user_id,market_id) VALUES (?,?) ', [user_id, market_id]);

		}else {
            await MysqlPool.query('delete from user_favourite where id =? ', [getRollbackResult[0]['id']]);
		}

        return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
    } catch (e) {
		logger.errorlog.error("addMarketFavourite",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let getAllFavouriteMarket = async (parentsId,user_id) => {
    try {
        parentsId = parentsId.split(',');
        let user_type_id = 5;
        let parem = [parentsId,user_id,user_id];
        let query=`SELECT mr.name market_name,m.name,m.match_id,m.match_date,mr.market_id,mr.runner_json,m.is_active ,mr.is_visible, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market
			FROM matches m 
			left join deactive_sport ds on (ds.sport_id=m.sport_id and ds.user_id in (?)) 
			left join  deactive_match dm on (dm.match_id=m.match_id and dm.user_id in (?)) 
			INNER JOIN markets mr ON (m.match_id=mr.match_id and mr.is_result_declared="0") 
			INNER JOIN user_favourite uf ON (uf.market_id=mr.market_id and uf.user_id=? ) 
			WHERE ds.id is NULL and dm.id is NULL 
		`;


        let marketdetails = await MysqlPool.query(query,parem);

        if (marketdetails===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{

			let marketIds = [];
			let marketIdsManual = [];
			marketdetails.map(function (data) {
				if(data.is_manual_market == '1' || data.is_manual_odds == '1') {
					marketIdsManual.push(data.market_id);
				}else{
					marketIds.push(data.market_id);
				}
			});

            let oddsMarketsData = await exchangeService.getOddsByMarketIds(marketIds, marketIdsManual);


            let resultsDatatemp=[];

            for (let i in marketdetails){

                let row = marketdetails[i];
                let runner_json = row.runner_json = JSON.parse(row.runner_json);
                let teamPosition  =  await getTeamPosition(user_id,row.market_id,row.match_id,user_type_id);

                await runner_json.map( function (runn,index) {

                    try {
                        runn.back = oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack;
                    } catch (e) {
                        runn.back =runn.back;
                    }

                    try {
                        runn.lay = oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay;
                    } catch (e) {
                        runn.lay =runn.lay;
                    }

                    let selectPostionData = teamPosition.data.find(function(x) {
                        return x.selection_id ==runn.selectionId;
                    });
                    runn.winloss =(selectPostionData ) ? selectPostionData.win_loss: 0 ;
                    //runn.winloss = 0 ;
                    return runn;
                });
                resultsDatatemp.push(row);

            }


            return resultdb(CONSTANTS.SUCCESS, resultsDatatemp);
        }
    } catch (error) {
		logger.errorlog.error("getAllFavouriteMarket",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};
let getMarketSession = async (marketId) => {
	try {
		let query ='SELECT market_id as id,match_id, name FROM markets where is_active="1" and (name="Match Odds" or  name="Winner" or match_id IN ("-154", "-156", "-1001", "-1002", "-1003", "-1004", "-1005") or sport_id IN ("7","4339")) ';

		let marketList = await MysqlPool.query(query,[marketId]);

		if (marketList===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, marketList);
		}
	} catch (error) {
		logger.errorlog.error("getMarketSession",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let abandonedMarket = async (pMatchID, pMarketID, pIsRollback) => {
	try {
		let sql = 'CALL sp_abandoned_market(?, ?, ?);';
		let getResult = await MysqlPool.query(sql, [pMatchID, pMarketID, pIsRollback]);
		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (e) {
		logger.errorlog.error("abandonedMarket",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateMarketVisibility = async (match_id, market_id, is_visible) => {
	try {
		let sql = 'UPDATE markets SET is_visible = ? WHERE match_id = ? AND market_id = ?;';
		let result = await MysqlPool.query(sql, [is_visible, match_id, market_id]);
		if(result.changedRows > 0) {
			return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
		}
	} catch (e) {
		logger.errorlog.error("updateMarketVisibility",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let marketResultDetailsByMarketId = async ( market_id) => {
	try {
		let sql = 'select * from markets where market_id = ? limit 1';
		let result = await MysqlPool.query(sql, [market_id]);

		if (result==null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, result[0]);
		}
	} catch (e) {
		logger.errorlog.error("marketResultDetailsByMarketId",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let marketResultListByMatchIdWithOutPagination = async ( match_id) => {
	try {
		let sql = 'select * from bet_results where match_id = ? order by id desc limit 10 ';
		let result = await MysqlPool.query(sql, [match_id]);

		if (result==null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, result);
		}
	} catch (e) {
		logger.errorlog.error("marketResultListByMatchIdWithOutPagination",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let marketResultListByMatchId = async ( data) => {
	try {

		let calcTemp='';
		if (data.pageno===1) {
			calcTemp='SQL_CALC_FOUND_ROWS';
		}

		let sql = 'select '+calcTemp+' * from bet_results where match_id = ? ';

		let conditionParameter=[data.match_id];
		let offSet=' LIMIT ? OFFSET ?';

		if(data.date!==null){
			sql+= ' AND DATE(FROM_UNIXTIME(created_at+19800)) = (date(?)) ';
			conditionParameter.push(data.date);
		}
		if(data.market_id!==null){
			sql+= ' AND market_id like ? ';
			let round_i = data.market_id + '%';
			conditionParameter.push(round_i);
		}

		if (data.pageno!==null && data.limit!==null) {
			conditionParameter.push(CONSTANTS.LIMIT);
			conditionParameter.push(((data.pageno-1)*CONSTANTS.LIMIT));
			sql=sql+offSet;
		}

		sql=sql+'; SELECT FOUND_ROWS() AS total;';

		let result = await MysqlPool.query(sql, conditionParameter);

		let returnRes={
			list:result[0],
			total:result[1][0].total,
			limit:CONSTANTS.LIMIT
		};

		if (result==null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, returnRes);
		}
	} catch (e) {
		logger.errorlog.error("marketResultListByMatchId",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let createBookMakerMarket = async (data) => {
	const conn = await connConfig.getConnection();
	try {

		await conn.beginTransaction();

		let marketData = await MysqlPool.query('SELECT b.is_bookmaker_market_exist, c.is_allow_bookmaker_market, a.* FROM markets AS a INNER JOIN matches AS b ON (a.match_id = b.match_id) INNER JOIN sports AS c ON (a.sport_id = c.sport_id) WHERE a.match_id = ? AND a.market_id = ? LIMIT 1;', [data.match_id, data.market_id]);
		if(marketData.length > 0){
			marketData = marketData[0];

			if(marketData.is_allow_bookmaker_market == '0'){
				await conn.rollback(); conn.release();
				return resultdb(CONSTANTS.SERVER_ERROR, 'Bookmaker market not allowed for this sport !');
			}

			if(marketData.is_bookmaker_market_exist == '1'){
				await conn.rollback(); conn.release();
				return resultdb(CONSTANTS.SERVER_ERROR, 'Bookmaker market already exist for this match !');
			}

			data.market_name = 'Bookmaker Market ' + data.market_name;
			let market_id = data.market_id + '_bookmaker';
			let odds_id = 'ODDS_' + data.market_id;
			let odds_id_bookmaker = 'ODDS_' + market_id;
			let odds;
			if(marketData.is_manual == '1'){
				odds = await redis_client.localClient.get(odds_id);
			}else{
				odds = await redis_client.client.get(odds_id);
			}

			if (odds == null) {
				await conn.rollback(); conn.release();
				return resultdb(CONSTANTS.SERVER_ERROR, 'Market not available !');
			}else {

				let odds_data = JSON.parse(odds);
				odds_data.marketId = market_id;

				await odds_data.runners.forEach(async (element, index) => {
					odds_data.runners[index].selectionId = odds_data.runners[index].selectionId + '_' + market_id;
					odds_data.runners[index].status = 'ACTIVE';

					odds_data.runners[index].ex.availableToBack = [
						{price: 0.00, size: ''},
						{price: '', size: ''},
						{price: '', size: ''}
					];
					odds_data.runners[index].ex.availableToLay = [
						{price: 0.00, size: ''},
						{price: '', size: ''},
						{price: '', size: ''}
					];
				});

				marketData.runner_json = JSON.parse(marketData.runner_json);
				await marketData.runner_json.forEach(async (element, index) => {
					marketData.runner_json[index].selectionId = marketData.runner_json[index].selectionId + '_' + market_id;
					marketData.runner_json[index].status = 'ACTIVE';
				});

				marketData.runner_json = JSON.stringify(marketData.runner_json);
				let final_odds_data = JSON.stringify(odds_data);
				await redis_client.localClient.set(odds_id_bookmaker, final_odds_data);

				await conn.query('UPDATE matches SET is_bookmaker_market_exist = "1" WHERE match_id = ?;', [data.match_id]);

				await conn.query('INSERT INTO markets (sport_id, series_id, match_id, market_id, name, runner_json, is_active, is_visible, is_manual, is_result_declared, is_abandoned, is_manual_odds, is_bookmaker_market, card_data, create_at, update_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())', [marketData.sport_id, marketData.series_id, data.match_id, market_id, data.market_name, marketData.runner_json, '1', '1', '1', '0', '0', '1', '1', marketData.card_data]);

				await conn.query('INSERT INTO market_selection (match_id, market_id, selection_id, name, sort_priority, sort_name) SELECT match_id, ? AS market_id, CONCAT(selection_id, "_", ?), name, sort_priority, sort_name FROM market_selection WHERE match_id = ? AND market_id = ?', [market_id, market_id, data.match_id, data.market_id]);

				await conn.commit(); conn.release();
				return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
			}
		}else{
			await conn.rollback(); conn.release();
			return resultdb(CONSTANTS.SERVER_ERROR, 'Match/Market not available !');
		}
	} catch (error) {
		logger.errorlog.error("createBookMakerMarket",error);
		await conn.rollback(); conn.release();
		return resultdb(CONSTANTS.SERVER_ERROR, 'An error occurred !');
	}
};

let changeMarketOddsMode = async (data) => {
	try {
		await MysqlPool.query('UPDATE markets SET is_manual_odds = ? WHERE match_id = ? AND market_id = ? LIMIT 1;', [data.is_manual_odds, data.match_id, data.market_id]);
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (error) {
		logger.errorlog.error("changeMarketOddsMode",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getMarketByMatch = async (match_id) => {
	try {
		let queryString ='SELECT id, is_active, sport_id, series_id, match_id, market_id, name as market_name from markets WHERE is_result_declared="0" AND match_id = ?;';

		let result = await MysqlPool.query(queryString, [match_id]);
		return resultdb(CONSTANTS.SUCCESS, result);
	} catch (error) {
		logger.errorlog.error("getMarketByMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let deleteMarketNoHaveProfitLoss = async () => {
	try {
		let queryString =`
		delete  from markets where  is_result_declared="1" and market_id !="0" AND is_abandoned = "0" and market_id not in (
		  select distinct  market_id  from user_profit_loss where type = "1");
		delete  from bet_results where result != "Abandoned" AND market_id not in (
		  select distinct  market_id  from user_profit_loss)`;


		let result = await MysqlPool.query(queryString);
		return resultdb(CONSTANTS.SUCCESS, result[0].affectedRows);
	} catch (error) {
		logger.errorlog.error("deleteMarketNoHaveProfitLoss",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateMarketId = async (matchId, oldMarketId, NewMarketId) => {
	try {
		let liveSport =await MysqlPool.query(`
			update account_statements set market_id=? where market_id=? and match_id = ?;
			update bets_odds set market_id=? where market_id=? and match_id = ?;
			update bet_results set market_id=? where market_id=? and match_id = ?;
			update markets set market_id=? where market_id=? and match_id = ?;
			update market_selection set market_id=? where market_id=? and match_id = ?;
			update odds_profit_loss set market_id=? where market_id=? and match_id = ?;
			update user_profit_loss set market_id=? where market_id=? and match_id = ?;
			update user_favourite set market_id=? where market_id=?;
		`,[NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId, matchId, NewMarketId, oldMarketId]);
		if (liveSport===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, liveSport);
		}
	} catch (error) {
		logger.errorlog.error("updateMarketId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getUserBook = async (user_id, user_type_id,market_id) => {
	try {

		let query = '';
		let whereCondition = '';

		switch (user_type_id) {
			case 1:
				query = `select u.id,u.parent_user_type_id parent_id, u.user_type_id, u.name, u.user_name, match_id,market_id,selection_id,selection_name,sort_priority,liability_type,stack,
					
					sum(case when sort_priority=1 then admin_win_loss ELSE 0 END )AS team1,
					sum(case when sort_priority=2 then admin_win_loss ELSE 0 END )AS team2,
					sum(case when sort_priority=3 then admin_win_loss ELSE 0 END )AS team3
					
					
					from odds_profit_loss
							  
					inner join users u on 
					(
					(u.id=odds_profit_loss.master_id and u.parent_id = ${user_id})
					 OR (u.id=odds_profit_loss.super_agent_id and u.parent_id = ${user_id})
					 OR (u.id=odds_profit_loss.agent_id and u.parent_id = ${user_id}) 
					 OR (u.id=odds_profit_loss.user_id and u.parent_id = ${user_id})
					 )
					
					WHERE odds_profit_loss.admin_id = ${user_id}  AND market_id=${market_id}
					 group by u.id`;
				break;
			case 2:
				query = `select u.id,u.parent_user_type_id parent_id, u.user_type_id, u.name, u.user_name, match_id,market_id,selection_id,selection_name,sort_priority,liability_type,stack,
					
					sum(case when sort_priority=1 then master_win_loss ELSE 0 END )AS team1,
					sum(case when sort_priority=2 then master_win_loss ELSE 0 END )AS team2,
					sum(case when sort_priority=3 then master_win_loss ELSE 0 END )AS team3
					
					from odds_profit_loss
							  
					inner join users u on 
					(
					(u.id=odds_profit_loss.super_agent_id and u.parent_id = ${user_id})
					 OR (u.id=odds_profit_loss.agent_id and u.parent_id = ${user_id}) 
					 OR (u.id=odds_profit_loss.user_id and u.parent_id = ${user_id})
					 )
					
					WHERE odds_profit_loss.master_id = ${user_id}  AND market_id=${market_id}
					 group by u.id`;
				break;
			case 3:
				query = `select u.id,u.parent_user_type_id parent_id, u.user_type_id, u.name, u.user_name, match_id,market_id,selection_id,selection_name,sort_priority,liability_type,stack,
					
					sum(case when sort_priority=1 then super_agent_win_loss ELSE 0 END )AS team1,
					sum(case when sort_priority=2 then super_agent_win_loss ELSE 0 END )AS team2,
					sum(case when sort_priority=3 then super_agent_win_loss ELSE 0 END )AS team3
					
					
					from odds_profit_loss
					
							  
					inner join users u on 
					(
					(u.id=odds_profit_loss.agent_id and u.parent_id = ${user_id}) 
					 OR (u.id=odds_profit_loss.user_id and u.parent_id = ${user_id})
					 )
					
					WHERE odds_profit_loss.super_agent_id = ${user_id}  AND market_id=${market_id}
					 group by u.id`;
				break;
			case 4:
				query = `select u.id,u.parent_user_type_id parent_id, u.user_type_id, u.name, u.user_name, match_id,market_id,selection_id,selection_name,sort_priority,liability_type,stack,
				
					sum(case when sort_priority=1 then agent_win_loss ELSE 0 END )AS team1,
					sum(case when sort_priority=2 then agent_win_loss ELSE 0 END )AS team2,
					sum(case when sort_priority=3 then agent_win_loss ELSE 0 END )AS team3
					
					
					from odds_profit_loss
							  
					inner join users u on 
					(
						(u.id=odds_profit_loss.user_id and u.parent_id = ${user_id})
					 )
					
					WHERE odds_profit_loss.agent_id = ${user_id}  AND market_id=${market_id}
					 group by u.id`;
				break;
			default:
				query = `select u.id,u.parent_user_type_id parent_id, u.user_type_id, u.name, u.user_name, match_id,market_id,selection_id,selection_name,sort_priority,liability_type,stack,
					
					sum(case when sort_priority=1 then loss_value+win_value ELSE 0 END )AS team1,
					sum(case when sort_priority=2 then loss_value+win_value ELSE 0 END )AS team2,
					sum(case when sort_priority=3 then loss_value+win_value ELSE 0 END )AS team3
					
					
					from odds_profit_loss
							  
					inner join users u on 
					(
					(u.id=odds_profit_loss.master_id and u.parent_id = ${user_id})
					 OR (u.id=odds_profit_loss.super_agent_id and u.parent_id = ${user_id})
					 OR (u.id=odds_profit_loss.agent_id and u.parent_id = ${user_id}) 
					 OR (u.id=odds_profit_loss.user_id and u.parent_id = ${user_id})
					 )
					
					WHERE odds_profit_loss.admin_id = ${user_id}  AND market_id=${market_id}
					 group by u.id`;
		}
		let resFromDB = await MysqlPool.query(query, true);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("getUserBook",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	getAllMarket,
	createMarket,
	updateMarketStatus,
    updateMarketCardsData,
	getMarketByListOfID,
	createMarketSelections,
	updateMarket,
	gatDataByMarketId,
	getMarketSettingById,
	getTeamPosition,
    getTeamPositionForLiveGameMatch,
    /*getLiabilityTeamPosition,*/
	getLiveMatchMarketIdList,
	undeclearedMarkets,
    undeclearedMarketsForAutoDecliredResult,
	getMarketSelections,
	declearedMarkets,
	getRollbackOdds,
    addMarketFavourite,
    getAllFavouriteMarket,
	getMarketSession,
	abandonedMarket,
	updateMarketVisibility,
	marketResultDetailsByMarketId,
	marketResultListByMatchId,
	marketResultListByMatchIdWithOutPagination,
	createBookMakerMarket,
	changeMarketOddsMode,
	getMarketByMatch,
	deleteMarketNoHaveProfitLoss,
	updateMarketId,
	getUserBook
};
