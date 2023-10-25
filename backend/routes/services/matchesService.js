const MysqlPool = require('../../db');
const	globalFunction = require('../../utils/globalFunction');
const	CONSTANTS = require('../../utils/constants');
const	exchangeService = require('../../routes/services/exchangeService');
const	marketsService = require('../../routes/services/marketsService');
const	fancyService = require('../../routes/services/fancyService');
const	userModel = require('../../routes/model/userModel');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

let getMarketPosition = async (user_id,market_ids,user_type=null) => {
	try {

		let selectSring;
		let condition = " " ;
		switch(user_type) {
			case 1:
				condition+=' and admin_id= ?';
				selectSring=" ,sum(admin_win_loss) as win_loss";
				break;
			case 2:
				condition+=' and master_id= ?';
				selectSring=" ,sum(master_win_loss)  as win_loss";
				break;
			case 3:
				condition+=' and super_agent_id= ?';
				selectSring=" ,sum(super_agent_win_loss)  as win_loss";
				break;
			case 4:
				condition+=' and agent_id= ?';
				selectSring=" ,loss_value,sum(agent_win_loss)  as win_loss";
				break;
			default:
				condition+=' and user_id= ?';
				selectSring=" ,win_value,loss_value, (win_value+loss_value) as win_loss"
		}
		let query=`
        	SELECT mr.name,pl.match_id,pl.selection_id,pl.selection_name ${selectSring}
			FROM markets mr
			inner JOIN odds_profit_loss pl ON pl.market_id=mr.market_id
		 	WHERE pl.market_id =?   ${condition} GROUP BY  pl.selection_id
        `;
        console.log(MysqlPool.format(query,[market_ids,user_id]));
		let teamPosition = await MysqlPool.query(query,[market_ids,user_id]);

		if (teamPosition===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, teamPosition);

		}
	} catch (error) {
		logger.errorlog.error("getMarketPosition",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getMatchForUserPanel = async (parentsId,userid=null) => {
	try {
		parentsId = parentsId.split(',');
		let parem = [parentsId,parentsId,userid];

		let query=`SELECT m.name,m.match_id,m.match_date,mr.market_id,mr.runner_json,m.is_active, 0 AS is_fancy , sp.sport_id, sp.name AS sport_name, (CASE WHEN (uf.id IS NULL) THEN 'N' ELSE 'Y' END) AS is_favourite ,mr.is_visible, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market
			FROM matches m 
			INNER join sports sp on m.sport_id=sp.sport_id 
            INNER join series sr on m.series_id=sr.series_id 
			left join deactive_sport ds on (ds.sport_id=m.sport_id and ds.user_id in (?)) 
			left join  deactive_match dm on (dm.match_id=m.match_id and dm.user_id in (?))  
			INNER JOIN markets mr ON (m.match_id=mr.match_id AND  CASE when sp.is_live_sport = "0" then ((mr.name="Match Odds" or mr.match_id IN ("-154", "-156", "-1001", "-1002", "-1003", "-1004", "-1005") or mr.sport_id IN ("7","4339") ) ) and mr.is_result_declared="0" AND mr.is_active = "1" else 1=1 end  )  
			left JOIN user_favourite uf ON (uf.market_id=mr.market_id  and uf.user_id = ?) 
			WHERE ds.id is NULL and dm.id is NULL AND sp.is_active = "1" AND sr.is_active = "1" AND m.is_active = "1" AND m.sport_id IN (1,2,4,7,4339)`;

        query+=' group by  m.match_id';

		let marketData = await MysqlPool.query(query,parem);
		if (marketData===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{

			let marketIds = [];
			let marketIdsManual = [];
			marketData.map(function (data) {
				if(data.is_manual_market == '1' || data.is_manual_odds == '1') {
					marketIdsManual.push(data.market_id);
				}else{
					marketIds.push(data.market_id);
				}
			});

			let oddsMarketsData = await exchangeService.getOddsByMarketIds(marketIds, marketIdsManual);
			let  resultsData =  marketData.filter( function(row) {
					let runner_json = row.runner_json = JSON.parse(row.runner_json);


					try {
						row.inplay = oddsMarketsData.data[row.market_id].inplay;
					} catch (e) {
						row.inplay =false;
					}

                    runner_json.map(function (runn,index) {

                        try {

                            if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack).length > 0){
                                runn.back = oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack;
                            }else {
                                runn.back =runn.back;
                            }

                        } catch (e) {
                            runn.back =runn.back;
                        }

                        try {
                            if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay).length > 0){
                                runn.lay = oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay;
                            }else {
                                runn.lay =runn.lay;
                            }

                        } catch (e) {
                            runn.lay =runn.lay;
                        }

                    });
                    	if(row.inplay){
                    		return row;			
                    	}
					
					}
			);

			return resultdb(CONSTANTS.SUCCESS, resultsData);
		}
	} catch (error) {
		logger.errorlog.error("getMatchForUserPanel",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAllMatches = async (data) => {

	try {
		let calcTemp='';
		if (data.pageno===1) {
			calcTemp='SQL_CALC_FOUND_ROWS';
		}
		let LoginUserData = userModel.getUserData();
		let  parent_id = LoginUserData.parent_id.split(',');


		let queryString =` SELECT ${calcTemp} matches.match_id,matches.match_date,matches.start_date,matches.name,matches.is_manual,
		case 
			when (dma.match_id is null) then 
			1
			else
			0
		end
		as is_active , sports.sport_id, sports.name as sports_name FROM matches 
		INNER join sports on matches.sport_id=sports.sport_id 
		INNER join series on matches.series_id=series.series_id 
		left join deactive_sport ds on (ds.sport_id=matches.sport_id and ds.user_id in(?)) 
		left join deactive_match dm on (dm.match_id=matches.match_id and dm.user_id in(?)) 
		left join deactive_match dma on (matches.match_id=dma.match_id and dma.user_id in(?)) 
		left join markets mr on (matches.match_id=mr.match_id and mr.is_result_declared="0")
		where 1=1 and dm.match_id is null AND sports.is_active = "1" AND series.is_active = "1" and mr.id is not null `;

		let conditionParameter=[parent_id,parent_id,LoginUserData.id];

		if(data.sport_id!==null){
			queryString+= ` and sports.sport_id =? `;
			conditionParameter.push(data.sport_id);
		}
		if(data.status!==null){
			queryString+= ` and matches.is_active =? `;
			conditionParameter.push(''+data.status);
		}
		if(data.match_name!==null){
			queryString+= ` and matches.name like ?`;
			conditionParameter.push('%'+data.match_name+'%');
		}

		if((data.series_id)){
			queryString+= ` and matches.series_id =? `;
			conditionParameter.push(data.series_id);
		}

		queryString+= ` group by matches.match_id order by matches.id desc `;

		if (data.limit &&  data.pageno){
			let offSet=` LIMIT ?, ? `;
			conditionParameter.push(((data.pageno-1)*data.limit));
			conditionParameter.push(data.limit);
			queryString=queryString+offSet;
		}


		//if (data.pageno===1) {
			queryString=queryString+'; SELECT FOUND_ROWS() AS total;';

		//}

		let matchesdetails =await MysqlPool.query(queryString,conditionParameter);
		
		let totalCount = 0;
		if (data.pageno===1) {
			totalCount = matchesdetails[1][0].total;
		}
		matchesdetails = matchesdetails[0];

		let returnRes={
			list:((data.series_id) ? [matchesdetails] : matchesdetails),
			total:totalCount
		};
		if (matchesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, returnRes);
		}

	} catch (error) {
		logger.errorlog.error("getAllMatches",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getActiveMatchesBySportId = async (data) => {

	try {

		//let globalSettingQuery = 'SELECT * FROM matches WHERE is_active = 1 AND sport_id = '+data.sport_id;

		let globalSettingQuery = 'SELECT m.name as match_name,m.match_date, s.name as series_name FROM matches m, series s WHERE m.series_id = s.series_id AND m.is_active = 1 AND m.sport_id = '+data.sport_id;

		//let globalSettingQuery = 'SELECT m.*, s.name as sport_name FROM matches m, sports s WHERE m.sport_id = s.sport_id';

		//let globalSettingQuery = 'SELECT s.name AS sport_name, m.* FROM matches m JOIN sports AS s ON FIND_IN_SET(s.sport_id, m.sport_id)';

		//let globalSettingQuery = 'SELECT k.name, GROUP_CONCAT(d.id) FROM sports AS k INNER JOIN matches as d ON k.sport_id = d.sport_id GROUP BY k.name';

		let resFromDB = await MysqlPool.query(globalSettingQuery);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("getActiveMatchesBySportId",error);
 		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let createMatches = async (data) => {
	try {
		let resFromDB= await MysqlPool.query('INSERT INTO matches SET ?',data);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("createMatches",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateMatchStatus = async (match_id,userid) => {
	try {
		let checkDeactiveMatch = await MysqlPool.query('select id from deactive_match where user_id=? and match_id=? limit 0,1',[userid,match_id]);
		let message = '';
		if(checkDeactiveMatch.length > 0 ){
			await MysqlPool.query(' delete from deactive_match where id =? ',[checkDeactiveMatch[0]['id']]);
			await MysqlPool.query("UPDATE markets  SET is_active = '1' WHERE match_id =?",[match_id]);
			message ="Successfully Active";
		}else{
			await MysqlPool.query('INSERT INTO deactive_match SET ?',[{
				user_id:userid,
				match_id:match_id
			}]);
			await MysqlPool.query("UPDATE markets SET is_active = '0' WHERE match_id =?",[match_id]);
			message ="Successfully Deactive";
		}
		return resultdb(CONSTANTS.SUCCESS, message);
	} catch (error) {
		logger.errorlog.error("updateMatchStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateOnlineMatchStatus = async (id) => {
	try {
		let resFromDB = await MysqlPool.query('UPDATE matches  SET is_active = IF(is_active=?, ?, ?) WHERE match_id = ?',['1','0','1',id]);
		//let resFromDB=await Markets.create(data,{isNewRecord:true});
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateOnlineMatchStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getMatchesByListOfID = async (idlist) => {
	try {
		let seriesdetails =await MysqlPool.query('SELECT * FROM matches  where match_id  in  (?)',[idlist]);
		if (seriesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, seriesdetails);
		}
	} catch (error) {
		logger.errorlog.error("getMatchesByListOfID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getLiveSportMatchList = async () => {
	try {
		let liveSport =await MysqlPool.query('SELECT match_id,concat(s.name,\'-\',m.name) as name FROM matches m   inner join sports s on s.sport_id=m.sport_id and s.is_live_sport=1');
		if (liveSport===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, liveSport);
		}
	} catch (error) {
		logger.errorlog.error("getLiveSportMatchList",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateMatchId = async (oldMatchId,NewMatchId) => {
	try {
		let liveSport =await MysqlPool.query(`
			update account_statements set match_id=? where match_id=?;
			update bets_fancy set match_id=? where match_id=?;
			update bets_odds set match_id=? where match_id=?;
			update bet_results set match_id=? where match_id=?;
			update deactive_match set match_id=? where match_id=?;
			update fancy set match_id=? where match_id=?;
			update fancy_score_position set match_id=? where match_id=?;
			update markets set match_id=? where match_id=?;
			update market_selection set match_id=? where match_id=?;
			update matches set match_id=? where match_id=?;
			update odds_profit_loss set match_id=? where match_id=?;
			update user_favourite set match_id=? where match_id=?;
			update user_profit_loss set match_id=? where match_id=?;
		`,[NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId, NewMatchId, oldMatchId]);
		if (liveSport===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, liveSport);
		}
	} catch (error) {
		logger.errorlog.error("updateMatchId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getActiveMatchesByListOfID = async (idlist) => {
	try {
		let seriesdetails =await MysqlPool.query('SELECT * FROM matches  where match_id  in  (?) and is_active="1"',[idlist]);
		if (seriesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, seriesdetails);
		}
	} catch (error) {
		logger.errorlog.error("getActiveMatchesByListOfID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateMatch = async (parameter,condition) => {
	try {
		let resFromDB = await MysqlPool.query('UPDATE matches SET ? WHERE match_id in  (?)',[parameter, condition]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getMatch = async (parentsId, sport_id = '') => {
	try {
		parentsId = parentsId.split(',');

		let conditions = '';

		if(sport_id != ''){
			conditions += ' AND m.sport_id = ? ';
		}

		let matchesdetails = await MysqlPool.query('SELECT aa.*, CASE WHEN (SELECT COUNT(*) AS total FROM bets_odds AS bo WHERE bo.match_id = aa.match_id LIMIT 1) > 0 THEN 1 ELSE 0 END AS is_bet_exist FROM (SELECT m.*,mr.market_id FROM matches m INNER join sports sp ON (m.sport_id=sp.sport_id AND sp.is_active = "1") INNER join series sr ON (m.series_id=sr.series_id AND sr.is_active = "1") LEFT JOIN deactive_sport ds ON (ds.sport_id=m.sport_id AND ds.user_id IN (?)) LEFT JOIN deactive_match dm ON (dm.match_id=m.match_id AND dm.user_id IN (?)) INNER JOIN markets mr ON (m.match_id=mr.match_id AND ((mr.is_active = "1" AND mr.is_result_declared="0" AND sp.is_live_sport = "0") OR (sp.is_live_sport = "1"))) WHERE m.is_active = "1" AND ds.id is NULL and dm.id is NULL ' + conditions + ' GROUP BY m.match_id) AS aa ORDER BY aa.start_date DESC', [parentsId, parentsId, sport_id]);
		if (matchesdetails === null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		} else {
			return resultdb(CONSTANTS.SUCCESS, matchesdetails);
		}
	} catch (error) {
		logger.errorlog.error("getMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getMatchSettingById = async (id) => {
	try {
		let query='select id, match_date, odd_limit, volume_limit, min_stack, max_stack, score_type, score_key,liability_type,is_active from matches where match_id=? limit 1';
		let marketData = await MysqlPool.query(query,[id]);
		if (marketData===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, (marketData.length > 0) ? marketData[0]: null );
		}
	} catch (error) {
		logger.errorlog.error("getMatchSettingById",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getMatchForUserPanelBySportId = async (parentsId,sportId=null,series_id=null,userid=null) => {
	try {
		parentsId = parentsId.split(',');
		let parem = [parentsId,parentsId,userid];
		let query=`SELECT m.name,m.match_id,m.match_date,mr.market_id,mr.runner_json,m.is_active, (SELECT (CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END)   FROM fancy WHERE fancy.match_id = m.match_id ) AS is_fancy , sp.sport_id, sp.name AS sport_name, (CASE WHEN (uf.id IS NULL) THEN 'N' ELSE 'Y' END) AS is_favourite ,mr.is_visible, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market
			FROM matches m 
			INNER join sports sp on m.sport_id=sp.sport_id 
            INNER join series sr on m.series_id=sr.series_id 
			left join deactive_sport ds on (ds.sport_id=m.sport_id and ds.user_id in (?)) 
			left join  deactive_match dm on (dm.match_id=m.match_id and dm.user_id in (?))  
			INNER JOIN markets mr ON (m.match_id=mr.match_id AND  CASE when sp.is_live_sport = "0" then ((mr.name="Match Odds" or mr.match_id IN ("-154", "-156", "-1001", "-1002", "-1003", "-1004", "-1005") or mr.sport_id IN ("7","4339") ) ) and mr.is_result_declared="0" AND mr.is_active = "1" else 1=1 end  )  
			left JOIN user_favourite uf ON (uf.market_id=mr.market_id  and uf.user_id = ?) 
			WHERE ds.id is NULL and dm.id is NULL AND sp.is_active = "1" AND sr.is_active = "1" AND m.is_active = "1"  `;

		if(sportId!=0){
			query+=' and m.sport_id= ?';
			parem.push(sportId);
		}
		if(series_id!=0){
			query+=' and m.series_id= ?';
			parem.push(series_id);
		}

        query+=' group by  m.match_id';
		let marketData = await MysqlPool.query(query,parem);
		if (marketData===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{

			let marketIds = [];
			let marketIdsManual = [];
			marketData.map(function (data) {
				if(data.is_manual_market == '1' || data.is_manual_odds == '1') {
					marketIdsManual.push(data.market_id);
				}else{
					marketIds.push(data.market_id);
				}
			});

			let oddsMarketsData = await exchangeService.getOddsByMarketIds(marketIds, marketIdsManual);
			let  resultsData =  marketData.map( function(row) {
					let runner_json = row.runner_json = JSON.parse(row.runner_json);

					try {
						row.inplay = oddsMarketsData.data[row.market_id].inplay;
					} catch (e) {
						row.inplay =false;
					}
					if (sportId > 0){

                        runner_json.map(function (runn,index) {

                            try {

                                if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack).length > 0){
                                    runn.back = oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack;
                                }else {
                                    runn.back =runn.back;
                                }

                            } catch (e) {
                                runn.back =runn.back;
                            }

                            try {
                                if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay).length > 0){
                                    runn.lay = oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay;
                                }else {
                                    runn.lay =runn.lay;
                                }

                            } catch (e) {
                                runn.lay =runn.lay;
                            }

                        });
					}
					else if (sportId == '-4'){

						let matchTimeStamp = Math.round((new Date(row.match_date).getTime() / 1000) / 60);
						let currentTimeStamp = Math.round((Date.now() / 1000) / 60);

						if (matchTimeStamp <= currentTimeStamp) {
							row.inplay =true;
						}else{
							row.inplay =false;
						}

					}else {
							row.inplay =true;
						}

						return row;
					}
			);

			return resultdb(CONSTANTS.SUCCESS, resultsData);
		}
	} catch (error) {
		logger.errorlog.error("getMatchForUserPanelBySportId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getInPlayMatchForUserPanelBySportId = async (parentsId,sportId=null,series_id=null, hide_by_sport = 0) => {
    try {
        parentsId = parentsId.split(',');
        let parem = [parentsId,parentsId];
        let query=`SELECT m.name,m.match_id,m.match_date,mr.market_id,mr.runner_json,m.is_active,m.sport_id, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market 
			FROM matches m 
			INNER join sports sp on m.sport_id=sp.sport_id 
            INNER join series sr on m.series_id=sr.series_id 
			left join deactive_sport ds on (ds.sport_id=m.sport_id and ds.user_id in (?)) 
			left join  deactive_match dm on (dm.match_id=m.match_id and dm.user_id in (?)) 
			INNER JOIN markets mr ON (m.match_id=mr.match_id AND (mr.name="Match Odds" or mr.name="Winner" or mr.match_id IN ("-154", "-156", "-1001","-1002", "-1003", "-1004", "-1005") or mr.sport_id IN ("7","4339") ) and mr.is_result_declared="0") 
			WHERE ds.id is NULL and dm.id is NULL AND sp.is_active = "1" AND sr.is_active = "1" AND m.is_active = "1" AND mr.is_active = "1" `;

        if(sportId!=0){
            query+=' and m.sport_id= ?';
            parem.push(sportId);
        }
        if(series_id!=0){
            query+=' and m.series_id= ?';
            parem.push(series_id);
        }

		if(hide_by_sport == 1){
			//query+=' AND sp.sport_id > 0 ';
			query+=' AND sp.is_live_sport = "0" ';
		}

        let marketData = await MysqlPool.query(query,parem);
        if (marketData===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
			let onlineMatch=[];
			let popularMatch=[];

			let marketIds = [];
			let marketIdsManual = [];
			marketData.map(function (data) {
				if(data.is_manual_market == '1' || data.is_manual_odds == '1') {
					marketIdsManual.push(data.market_id);
				}else{
					marketIds.push(data.market_id);
				}
			});

            let oddsMarketsData = await exchangeService.getOddsByMarketIds(marketIds, marketIdsManual);
            let  resultsData =  marketData.map( function(row,roeIndex) {
					let inplay =false;
					try {
						if(sportId>=0){
							inplay = oddsMarketsData.data[row.market_id].inplay;
						}

					} catch (e) {
                        inplay = false;
					}
					if(row.market_id==0){
						inplay = true;
					}

				let runner_json = row.runner_json = JSON.parse(row.runner_json);
            		if(inplay==true){


                        runner_json.map(function (runn,index) {

                            try {

                                if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack).length > 0){
                                    runn.back = oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack;
                                }else {
                                    runn.back =runn.back;
                                }

                            } catch (e) {
                                runn.back =runn.back;
                            }

                            try {
                                if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay).length > 0){
                                    runn.lay = oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay;
                                }else {
                                    runn.lay =runn.lay;
                                }

                            } catch (e) {
                                runn.lay =runn.lay;
                            }

                        });
                        onlineMatch.push(row);
					}else{
                        popularMatch.push(row);
					}

                }
            );

            /*resultsData =  resultsData.filter(function (d) {
				return d==null ? false : true;
            });*/

            return resultdb(CONSTANTS.SUCCESS, {"onlineMatch":onlineMatch,"popularMatch":popularMatch});
        }
    } catch (error) {
		logger.errorlog.error("getInPlayMatchForUserPanelBySportId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

/**
 *
 * @param parentsId
 * @param matchId
 * @returns {Promise<{statusCode, data}>}
 */
let matchDetails = async (user_id,user_type_id,parentsId,matchId,is_show_100_percent = 0) => {

	try {

		parentsId = parentsId.split(',');
		let liveMarketId = '0';
		let checkMarket = await MysqlPool.query('SELECT mr.* FROM markets AS mr INNER JOIN sports AS sp ON(sp.is_live_sport = "1" AND mr.sport_id = sp.sport_id) WHERE mr.match_id = ? AND mr.market_id != "0" ORDER BY mr.id DESC LIMIT 1;',[matchId]);

		if (checkMarket.length > 0) {
			if(checkMarket[0].is_active == '1' && checkMarket[0].is_result_declared == '0'){
				let checkMarket0 = await MysqlPool.query('SELECT * FROM markets AS mr WHERE mr.match_id = ? AND mr.market_id = "0" AND mr.update_at > ? LIMIT 1;',[matchId, checkMarket[0].update_at]);
				if (checkMarket0.length === 0) {
					liveMarketId = checkMarket[0].market_id;
				}
			}
		}

		/*This condition is to fetch all markets of matka because one matka match has multiple markets and they are grouped by round id example:

			1.100.873189.100evenodd
            1.100.873189.100hilow
            1.100.873189.100single
            1.100.873189.100sp
            1.100.873189.100spall
            1.100.873189.100dp
            1.100.873189.100dpall
            1.100.873189.100trioall

            Here 1.100.873189.100 part of market id is common and related to one match. And only these markets ids which start with 1.100.873189.100 are fetched.
		*/
		let tmp_market_id = '';
		if((matchId == '-154' || matchId == '-156' || matchId == '-1001' || matchId == '-1002' || matchId == '-1003' || matchId == '-1004' || matchId == '-1005' || matchId == '-1010') && liveMarketId != '0'){
			let tmp_market_id_arr = liveMarketId.split('.');
			console.log(tmp_market_id_arr);
			if(tmp_market_id_arr.length >= 4) {
				tmp_market_id = tmp_market_id_arr[0] + '.' + tmp_market_id_arr[1] + '.' + tmp_market_id_arr[2] + '.' + tmp_market_id_arr[1];
			}else if (matchId == "-1005") {
				tmp_market_id= liveMarketId.replace("updown", "");
				tmp_market_id= tmp_market_id.replace("color", "");
				tmp_market_id= tmp_market_id.replace("evenodd", "");
				tmp_market_id= tmp_market_id.replace("suit", "");
			}
		}



		let query= `select * from (SELECT m.name match_name,mr.name market_name,m.match_id,case when (sp.is_live_sport = "1") then now() else m.match_date end as match_date,case when mr.market_id=0 then concat(m.match_id,'_',mr.market_id) else mr.market_id end as market_id ,mr.runner_json,m.is_active , m.score_type, score_key, mr.is_visible,
		(CASE WHEN (uf.id IS NULL) THEN 'N' ELSE 'Y' END) AS is_favourite, sp.is_show_last_result, sp.is_show_tv, us.odds_max_stack,us.odds_min_stack, sp.sport_id, sp.name AS sport_name, sr.series_id, sr.name AS series_name, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market, m.live_sport_tv_url
		FROM matches m 
			INNER join sports sp on m.sport_id=sp.sport_id 
			INNER join user_setting_sport_wise us on (us.sport_id=sp.sport_id and us.user_id= ? )
            INNER join series sr on m.series_id=sr.series_id 
			left join deactive_sport ds on (ds.sport_id=m.sport_id and ds.user_id in (?)) 
			left join  deactive_match dm on (dm.match_id=m.match_id and dm.user_id in (?)) 
			INNER JOIN markets mr ON (m.match_id=mr.match_id AND ((mr.is_active="1" and mr.is_result_declared="0" AND sp.is_live_sport = "0") OR (sp.is_live_sport = "1" AND mr.market_id = ?) OR(mr.match_id IN ("-154", "-156", "-1001", "-1002", "-1003","-1004", "-1005","-1010")  AND ? != "" AND mr.market_id like ?)   ))  
			left JOIN user_favourite uf ON (uf.market_id=mr.market_id  and uf.user_id = ?) 
		WHERE ds.id is NULL and dm.id is NULL and m.match_id= ? AND sp.is_active = "1" AND sr.is_active = "1" AND m.is_active = "1" ORDER BY mr.update_at desc,mr.id desc limit 1000 ) m group by m.market_name `;
	
			console.log(liveMarketId);
			
			console.log(tmp_market_id);
			console.log(MysqlPool.format(query,[user_id,parentsId,parentsId,liveMarketId,tmp_market_id, tmp_market_id+'%',user_id,matchId]));	
		
		
		let marketData = await MysqlPool.query(query,[user_id,parentsId,parentsId,liveMarketId,tmp_market_id, tmp_market_id+'%',user_id,matchId]);


		if (marketData==null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{

			let marketIds = [];
			let marketIdsManual = [];
			marketData.map(function (data) {
				if(data.is_manual_market == '1' || data.is_manual_odds == '1') {
					marketIdsManual.push(data.market_id);
				}else{
					marketIds.push(data.market_id);
				}
			});

			let oddsMarketsData = await exchangeService.getOddsByMarketIds(marketIds, marketIdsManual);


			let resultDataTemp=[];

			for (let i in marketData){

				let row = marketData[i];

				try {
					row.status = oddsMarketsData.data[row.market_id].status;
				} catch (e) {
					row.status = 'SUSPENDED';
				}

				var market_selection_ids = [];

                try {
                    row.cards = oddsMarketsData.data[row.market_id].cards;
                } catch (e) {
                    row.cards = [];
                }
                try {
                    row.cardsTotal = oddsMarketsData.data[row.market_id].cardsTotal;
                } catch (e) {
                    row.cardsTotal = [];
                }
				try {
					//row.tv_url = oddsMarketsData.data[row.market_id].tv_url;
					row.tv_url = row.live_sport_tv_url;
				} catch (e) {
					row.tv_url = '';
				}
                try {
                    row.results = oddsMarketsData.data[row.market_id].results;
                } catch (e) {
                    row.results = [];
                }
                try {
                    row.autotime = oddsMarketsData.data[row.market_id].autotime;
                } catch (e) {
                    row.autotime = 0;
                }

				let runner_json = row.runner_json = JSON.parse(row.runner_json);
				let teamPosition  =  await marketsService.getTeamPosition(user_id,row.market_id,matchId,user_type_id,is_show_100_percent);
				 runner_json.map(async function (runn,elementIndex) {
					let back_change = 0;
					let lay_change = 0;
					 let index;
					 if(matchId >= 0){
                         try {
                             index = oddsMarketsData.data[row.market_id].runners.findIndex(function(i) {
                                 return runn.selectionId ==i.selectionId;
                             });
                         } catch (e) {
                             index = -1;

                         }
					 }else {
                         index = elementIndex;
					 }

					try {
						if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack).length > 0){
                            runn.back = oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack;

							if( oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack[0].price!=_OldOddsMarketsData.data[row.market_id].runners[index].ex.availableToBack[0].price){
                                back_change=1;
							}

						}else {
                            runn.back =runn.back;
						}

					} catch (e) {
						runn.back =runn.back;
					}

					try {
						if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay).length > 0){
                            runn.lay = oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay;
                            if( oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay[0].price!=_OldOddsMarketsData.data[row.market_id].runners[index].ex.availableToLay[0].price){
                                lay_change=1;
                            }
						}else {
                            runn.lay =runn.lay;
						}

					} catch (e) {
						runn.lay =runn.lay;
					}

					 try {
						 runn.status = oddsMarketsData.data[row.market_id].runners[index].status;
					 } catch (e) {
						 runn.status = '';
					 }

                     runn.back_change=back_change;
                     runn.lay_change=lay_change;
					 try {
						 runn.card = oddsMarketsData.data[row.market_id].runners[index].card;
					 } catch (e) {
						 //runn.card=[];
					 }
					let selectPostionData = teamPosition.data.find(function(x) {
						return x.selection_id ==runn.selectionId;
					});
					runn.winloss =(selectPostionData ) ? selectPostionData.win_loss.toFixed(2) : 0.00 ;
					//runn.winloss = 0 ;
                     market_selection_ids.push(row.market_id+'_'+runn.selectionId);
					return runn;
				});
                row.market_selection_ids= market_selection_ids.toString();
				resultDataTemp.push(row);

			}

            global._OldOddsMarketsData=oddsMarketsData;

			let fancy  = await fancyService.getFancyByMatchId(user_id,user_type_id,matchId,parentsId);
				fancy =fancy.data;


			let fancyIds = [];
			let fancyIdsManual = [];
			fancy.map(function (data) {
				if(data.is_indian_fancy == '1' || data.fancy_mode == '1') {
					fancyIdsManual.push(data.fancy_id);
				}else{
					fancyIds.push(data.fancy_id);
				}
			});

            let fancyDataFromApi = await exchangeService.getFancyByFancyIds(fancyIds, fancyIdsManual);
			let fancyArray =[];
			for (let f in fancy){

				let fancyElement = fancy[f];
				if(user_type_id!=5){
                    let fancyPos =  await fancyService.getRunTimeFancyPosition(user_id,fancyElement.fancy_id,user_type_id,[0],is_show_100_percent);
// console.log(fancyPos);
                    fancyElement.score_position=fancyPos.data.liability==0 ?  null :Math.round(fancyPos.data.liability,2);
                    fancyElement.fancy_score_position_json=JSON.stringify(fancyPos.data.fancy_position);
				}

                try {
                    let tempElement =  fancyDataFromApi.data[fancyElement.fancy_id];
                    fancyElement.display_message =(tempElement.GameStatus) ? tempElement.GameStatus : null ;
                    fancyElement.session_size_yes =tempElement.BackSize1;
                    fancyElement.session_value_yes =tempElement.BackPrice1;
                    fancyElement.session_size_no =tempElement.LaySize1;
                    fancyElement.session_value_no =tempElement.LayPrice1;
                } catch (e) {
                    fancyElement.display_message ='Result Awaiting' ;
                }
                fancyArray.push(fancyElement);
			}

			resultDataTemp=JSON.parse(JSON.stringify(resultDataTemp));

			let matchOddsObject = resultDataTemp.find(element => (element.market_name === "Match Odds" || element.match_id == "-154" || element.match_id == "-156" || element.match_id == "-1001" || element.match_id == "-1002" || element.match_id == "-1003" || element.match_id == "-1004" || element.match_id == "-1005" || element.sport_id == "7" || element.sport_id == "4339" || element.match_id == "-1010"));
			let index = resultDataTemp.findIndex(element => (element.market_name === "Match Odds" || element.match_id == "-154" || element.match_id == "-156" || element.match_id == "-1001" || element.match_id == "-1002" || element.match_id == "-1003" || element.match_id == "-1004" || element.match_id == "-1005" || element.sport_id == "7" || element.sport_id == "4339" || element.match_id == "-1010"));

			if (matchOddsObject && index > 0) {
				const newData = [
					...resultDataTemp.slice(0, index),
					...resultDataTemp.slice(index + 1)
				];
				resultDataTemp=[matchOddsObject,...newData]
			}

			return resultdb(CONSTANTS.SUCCESS, {"match":resultDataTemp,'fancy':fancyArray});
		}
	} catch (error) {
		logger.errorlog.error("matchDetails",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getAllMatchesSportssession = async () => {
	try {
		let matchesdetails =await MysqlPool.query('SELECT * FROM matches where sports_id=4');
		if (matchesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, matchesdetails);
		}
	} catch (error) {
		logger.errorlog.error("getAllMatchesSportssession",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let getMatchUser = async (match_id,parent_id,parent_type) => {
	try {
		// let query='select users.id,users.parent_id,users.user_type_id,users.name,users.user_name from users inner join  bets_odds on users.id=';

		// switch(parent_type) {
		// 	case 1:
		// 		query+=' bets_odds.master_id  ';
		// 		break;
		// 	case 2:
		// 		query+=' bets_odds.super_agent_id';
		// 		break;
		// 	case 3:
		// 		query+=' bets_odds.agent_id';
		// 		break;
		// 	case 4:
		// 		query+=' bets_odds.user_id';
		// 		break;
		// 	default:
		// 		query+=' ';
		// }
		// query+=" where bets_odds.match_id=? and users.parent_id= ? and delete_status='0' group by users.id";
		//let matchUser = await MysqlPool.query(query,[match_id,parent_id]);
		let query = "SELECT aa.* FROM(SELECT a.id, a.parent_id, a.user_type_id, a.name, a.user_name FROM bets_odds  AS b INNER JOIN users AS a ON (a.id = b.admin_id) WHERE b.match_id = ? AND b.delete_status = '0' AND a.parent_id = ? UNION ALL SELECT a.id, a.parent_id, a.user_type_id, a.name, a.user_name FROM bets_odds  AS b INNER JOIN users AS a ON (a.id = b.master_id) WHERE b.match_id = ? AND b.delete_status = '0' AND a.parent_id = ? UNION ALL SELECT a.id, a.parent_id, a.user_type_id, a.name, a.user_name FROM bets_odds  AS b INNER JOIN users AS a ON (a.id = b.super_agent_id) WHERE b.match_id = ? AND b.delete_status = '0' AND a.parent_id = ? UNION ALL SELECT a.id, a.parent_id, a.user_type_id, a.name, a.user_name FROM bets_odds  AS b INNER JOIN users AS a ON (a.id = b.agent_id) WHERE b.match_id = ? AND b.delete_status = '0' AND a.parent_id = ? UNION ALL SELECT a.id, a.parent_id, a.user_type_id, a.name, a.user_name FROM bets_odds  AS b INNER JOIN users AS a ON (a.id = b.user_id) WHERE b.match_id = ? AND b.delete_status = '0' AND a.parent_id = ?) AS aa GROUP BY aa.id"
		let matchUser = await MysqlPool.query(query, [match_id, parent_id, match_id, parent_id, match_id, parent_id, match_id, parent_id, match_id, parent_id]);

		if (matchUser===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, matchUser);
		}
	} catch (error) {
		logger.errorlog.error("getMatchUser",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let searchMatches = async (search) => {
	try {
		let query='SELECT m.sport_id, m.series_id, m.match_id, m.name, m.match_date, m.start_date FROM matches m left join markets mr on (m.match_id=mr.match_id and mr.is_result_declared="0")  WHERE m.name LIKE "%"'+'?'+'"%" AND m.is_active="1" and mr.id is not null group by m.match_id';

		let matches = await MysqlPool.query(query,[search]);

		if (matches===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, matches);
		}
	} catch (error) {
		logger.errorlog.error("searchMatches",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getMatchAndMarketPosition = async (user_id,match_id,user_type=null) => {
    try {

        let selectSring;
        let condition = " " ;
        switch(user_type) {
            case 1:
                condition+=' and admin_id= ?';
                selectSring=" ,sum(admin_win_loss) as win_loss";
                break;
            case 2:
                condition+=' and master_id= ?';
                selectSring=" ,sum(master_win_loss)  as win_loss";
                break;
            case 3:
                condition+=' and super_agent_id= ?';
                selectSring=" ,sum(super_agent_win_loss)  as win_loss";
                break;
            case 4:
                condition+=' and agent_id= ?';
                selectSring=" ,loss_value,sum(agent_win_loss)  as win_loss";
                break;
            default:
                condition+=' and user_id= ?';
                selectSring=" ,win_value,loss_value, (win_value+loss_value) as win_loss"
        }
        let query=`
        	SELECT mr.name,pl.match_id,pl.selection_id,pl.selection_name ${selectSring}
			FROM markets mr
			inner JOIN odds_profit_loss pl ON pl.market_id=mr.market_id
		 	WHERE pl.match_id=?  ${condition} GROUP BY pl.market_id, pl.selection_id
        `;

        let teamPosition = await MysqlPool.query(query,[match_id,user_id]);

        if (teamPosition===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, teamPosition);

        }
    } catch (error) {
		logger.errorlog.error("getMatchAndMarketPosition",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let getActiveMatch = async () => {
	try {
		let matchesdetails =await MysqlPool.query('SELECT * FROM matches where is_active="1"');
		if (matchesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, matchesdetails);
		}
	} catch (error) {
		logger.errorlog.error("getActiveMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getManualOddsMarketByMatch = async (matchId) => {

	try {
		let query= `SELECT m.name match_name, mr.name market_name, m.match_id, CASE WHEN (sp.is_live_sport = "1") THEN NOW() ELSE m.match_date END AS match_date, CASE WHEN mr.market_id=0 THEN CONCAT(m.match_id, '_', mr.market_id) ELSE mr.market_id END AS market_id, mr.runner_json, m.is_active, m.score_type, score_key, mr.is_visible, sp.is_show_last_result, sp.is_show_tv, sp.sport_id, sp.name AS sport_name, sr.series_id, sr.name AS series_name, mr.is_manual AS is_manual_market, mr.is_manual_odds, mr.is_bookmaker_market
		FROM matches m 
			INNER JOIN sports sp on m.sport_id=sp.sport_id 
            INNER JOIN series sr on m.series_id=sr.series_id 
            INNER JOIN markets mr ON (m.match_id=mr.match_id AND mr.is_active="1" and mr.is_result_declared="0" AND (mr.is_manual = "1" OR mr.is_manual_odds = "1") )
		WHERE m.match_id= ? AND sp.is_active = "1" AND sr.is_active = "1" AND m.is_active = "1" ORDER BY mr.id ASC`;

		let marketData = await MysqlPool.query(query,[matchId]);

		if (marketData==null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			let marketIdsManual = [];
			marketData.map(function (data) {
				marketIdsManual.push(data.market_id);
			});

			let oddsMarketsData = await exchangeService.getOddsByMarketIds([], marketIdsManual);

			let resultDataTemp=[];
			for (let i in marketData){
				let row = marketData[i];

				try {
					row.status = oddsMarketsData.data[row.market_id].status;
				} catch (e) {
					row.status = 'SUSPENDED';
				}

				let runner_json = row.runner_json = JSON.parse(row.runner_json);
				runner_json.map(async function (runn,elementIndex) {
					let index;
					if(matchId >= 0){
						try {
							index = oddsMarketsData.data[row.market_id].runners.findIndex(function(i) {
								return runn.selectionId ==i.selectionId;
							});
						} catch (e) {
							index = -1;
						}
					}else {
						index = elementIndex;
					}

					try {
						if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack).length > 0){
							runn.back = oddsMarketsData.data[row.market_id].runners[index].ex.availableToBack;
						}else {
							runn.back =runn.back;
						}
					} catch (e) {
						runn.back =runn.back;
					}

					try {
						if((oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay).length > 0){
							runn.lay = oddsMarketsData.data[row.market_id].runners[index].ex.availableToLay;
						}else {
							runn.lay =runn.lay;
						}
					} catch (e) {
						runn.lay =runn.lay;
					}

					try {
						runn.status = oddsMarketsData.data[row.market_id].runners[index].status;
					} catch (e) {
						runn.status = '';
					}

					return runn;
				});
				resultDataTemp.push(row);
			}
			resultDataTemp=JSON.parse(JSON.stringify(resultDataTemp));

			return resultdb(CONSTANTS.SUCCESS, {"match":resultDataTemp});
		}
	} catch (error) {
		logger.errorlog.error("getManualOddsMarketByMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateLiveSportTvUrlBySuperAdmin = async (data) => {
	try {
		let live_sport_tv_url = null;
		if(data.live_sport_tv_url!=''){
			live_sport_tv_url = data.live_sport_tv_url;
		}
		let resFromDB = await MysqlPool.query('UPDATE matches SET live_sport_tv_url = ? WHERE series_id = ? AND match_id = ?', [live_sport_tv_url, data.series_id, data.match_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateLiveSportTvUrlBySuperAdmin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateMatchCupStatusBySuperAdmin = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('UPDATE matches SET is_cup = ? WHERE series_id = ? AND match_id = ?', [data.is_cup, data.series_id, data.match_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateMatchCupStatusBySuperAdmin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getCups = async () => {
	try {
		let LoginUserData = userModel.getUserData();
		let parent_id = LoginUserData.parent_id.split(',');

		let queryString = `SELECT matches.match_id, matches.name, sports.sport_id, sports.name as sports_name
FROM matches
INNER JOIN sports ON matches.sport_id = sports.sport_id
INNER JOIN series ON matches.series_id = series.series_id
LEFT JOIN deactive_sport ds ON (ds.sport_id = matches.sport_id AND ds.user_id IN(?))
LEFT JOIN deactive_match dm ON (dm.match_id=matches.match_id AND dm.user_id IN(?))
WHERE is_cup = "1" AND ds.id is null AND dm.id is null AND sports.is_active = "1" AND series.is_active = "1" AND matches.is_active = "1" `;

		let cupList = await MysqlPool.query(queryString, [parent_id, parent_id]);

		if (cupList === null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		} else {
			return resultdb(CONSTANTS.SUCCESS, cupList);
		}
	} catch (error) {
		logger.errorlog.error("getCups",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


module.exports = {
	getMarketPosition,getMatchForUserPanel,getAllMatches,createMatches,getActiveMatchesByListOfID,
	updateMatchStatus,getMatchesByListOfID,updateOnlineMatchStatus,
	updateMatch,getMatch,getMatchSettingById,
	getMatchForUserPanelBySportId,
    getInPlayMatchForUserPanelBySportId,
	getAllMatchesSportssession,
	getMatchUser,
	matchDetails,
    getMatchAndMarketPosition,
	searchMatches,
	getActiveMatch,
	getLiveSportMatchList,
	getActiveMatchesBySportId,
	getManualOddsMarketByMatch,
	updateMatchId,
	updateLiveSportTvUrlBySuperAdmin,
	updateMatchCupStatusBySuperAdmin,
	getCups
};
