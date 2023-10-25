const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const	userModel = require('../../routes/model/userModel');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let createFancy = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('SELECT * FROM fancy WHERE fancy_id = ? LIMIT 1;', [data.fancy_id]);
		if (resFromDB.length > 0) {
			return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
		} else {
			let resFromDB = await MysqlPool.query('INSERT INTO fancy SET ?', data);
			return resultdb(CONSTANTS.SUCCESS, resFromDB);
		}
	} catch (error) {
        logger.errorlog.error("createFancy",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getFancy = async (data) => {
	try {

		let userData = userModel.getUserData();
		let userId = userData.id;
		let userTypeId = userData.user_type_id;
		let parentIds = userData.parent_id;

		let match_id = '';
		let fancyQuery = 'SELECT b.sport_id, d.name AS sport_name, b.series_id, c.name AS series_name, a.match_id, b.name AS match_name, a.fancy_id, a.name AS fancy_name, super_admin_fancy_id, selection_id, fancy_type_id, date_time, active, is_indian_fancy, display_message, super_admin_message ';

		if(userTypeId == 1){
			fancyQuery = fancyQuery + ' ,0 AS is_self_deactived ';
		}else{
			fancyQuery = fancyQuery + ' ,(CASE WHEN (f.id IS NULL) THEN 0 ELSE 1 END) AS is_self_deactived ';
		}

		fancyQuery = fancyQuery + ' FROM fancy AS a INNER JOIN matches AS b ON (a.match_id = b.match_id) INNER JOIN series AS c ON (b.series_id = c.series_id) INNER JOIN sports AS d ON (b.sport_id = d.sport_id) ';

		if(userTypeId != 1){
			fancyQuery = fancyQuery + ' LEFT JOIN deactive_fancy AS e ON(a.fancy_id = e.fancy_id AND e.user_id IN(?)) LEFT JOIN deactive_fancy AS f ON(a.fancy_id = f.fancy_id AND f.user_id = ?) ';
		}

		fancyQuery = fancyQuery + ' WHERE active IN("0", "1","2") AND result IS NULL ';

		if (data.match_id) {
			match_id = data.match_id;
			fancyQuery = fancyQuery + ' AND a.match_id = "' + match_id + '" ';
		}

		if(userTypeId != 1) {
			fancyQuery = fancyQuery + ' AND e.id IS NULL ';
		}

		let resFromDB = await MysqlPool.query(fancyQuery, [parentIds.split(','), userId]);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getFancy",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getFancyBySuperAdmin = async (data) => {
	try {
		//console.log('there are the input data ===>', data);

		let fancyQuery = 'select * from fancy where sport_id = "' + data.market_id + '"';


		let resFromDB = await MysqlPool.query(fancyQuery);
		//console.log('fancyQueryfancyQueryfancyQueryfancyQuery===', resFromDB);


		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getFancyBySuperAdmin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getmarketId = async (data) => {
	try {

        let getMarketQuery = 'select market_id   from markets where match_id="' + data.match_id + '" and (name="Match Odds" or  name="Winner" or match_id IN ("-154", "-156", "-1001", "-1002", "-1003", "-1004", "-1005")  or sport_id IN ("7","4339") )';
		let resFromDB = await MysqlPool.query(getMarketQuery);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("getmarketId",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getFancyByMatchId = async (user_id,user_type_id,match_id,parentsId) => {
    try {

        let condition,select;
        switch(user_type_id) {
            case 1:
                condition=' admin_id  ';
                select=' sum(fs.liability*(admin_partnership/100)) score_position  ';
                break;
            case 2:
                condition=' master_id';
                select=' sum(fs.liability*(master_partnership/100)) score_position  ';
                break;
            case 3:
                condition=' super_agent_id';
                select=' sum(fs.liability*(super_agent_partnership/100)) score_position  ';
                break;
            case 4:
                condition=' agent_id';
                select=' sum(fs.liability*(agent_partnership/100)) score_position  ';
                break;
            default:
                condition=' user_id ';
                select=' sum(fs.liability) score_position  ';
        }

        let fancyQuery = 'select f.is_indian_fancy, f.fancy_mode, f.active,f.display_message,f.fancy_id,f.session_size_no,f.session_size_yes,f.session_value_no,f.session_value_yes,f.sport_id,f.name,'+select+',fs.fancy_score_position_json fancy_score_position_json, f.max_session_bet_liability, f.max_session_liability, ifnull(f.super_admin_message, "") as super_admin_message from fancy f  left join fancy_score_position fs on (fs.fancy_id=f.fancy_id and fs.'+condition+'=?) left join deactive_fancy df on (df.fancy_id=f.fancy_id and df.user_id in (?)) where f.active IN("0", "1") AND f.result IS NULL AND f.match_id = ? and df.id IS NULL group by f.fancy_id order by f.name asc';

        let resFromDB = await MysqlPool.query(fancyQuery, [user_id,parentsId,match_id]);

        return resultdb(CONSTANTS.SUCCESS, resFromDB);

    } catch (error) {
        logger.errorlog.error("getFancyByMatchId",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let getFancyById = async (id) => {
	try {
		let fancyQuery = 'select * from fancy where fancy_id = ? limit 0,1';
		let resFromDB = await MysqlPool.query(fancyQuery, [id]);

		return resultdb(CONSTANTS.SUCCESS, resFromDB);

	} catch (error) {
        logger.errorlog.error("getFancyById",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updatefancyData = async (inputKey, inputValue, fancy_id) => {

	try {
		let updateQuery = 'update fancy set ' + inputKey + ' = "' + inputValue + '" where fancy_id =?';

		let resFromDB = await MysqlPool.query(updateQuery, [fancy_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("updatefancyData",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updatefancy = async (data) => {
	try {


		let updateQuery = 'update fancy set max_stack = "' + data.max_stack + '",rate_diff = "' + data.rate_diff + '",point_diff = "' + data.point_diff + '",session_value_yes = "' + data.session_value_yes + '",session_value_no = "' + data.session_value_no + '",session_size_yes = "' + data.session_size_yes + '",remark = "' + data.remark + '" where fancy_id =' + data.fancy_id;
		let resFromDB = await MysqlPool.query(updateQuery);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("updatefancy",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
// id, max_stack, max_stack, rate_diff, point_diff, session_value_yes, session_value_no, session_size_yes, remark




let matchResultFancy = async (sport_id, match_id, fancy_id, result,sportName,matchName) => {
	try {
		let sql = 'CALL sp_set_result_fancy(?,?,?,?,?,?,?,?)';

		let getResult = await MysqlPool.query(sql,[sport_id, match_id, fancy_id, result,sportName,matchName, CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE, CONSTANTS.IS_SESSION_COMMISSION_TO_ADMIN]);

		return resultdb(CONSTANTS.SUCCESS, getResult[0]);
	} catch (e) {
        logger.errorlog.error("matchResultFancy",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let abandonedFancy = async (fancyID, pIsRollback) => {
	try {
		let sql = 'CALL sp_abandoned_fancy(?, ?)';
		let getResult = await MysqlPool.query(sql, [fancyID, pIsRollback]);

		return resultdb(CONSTANTS.SUCCESS, getResult[0][0]);
	} catch (e) {
        logger.errorlog.error("abandonedFancy",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getRollbackFancy = async (pBetResultId, pMatchID, pFancyID) => {
	try {
		let sql = 'CALL sp_rollback_result_fancy(?,?,?,?)';

		let getRollbackResult = await MysqlPool.query(sql, [pBetResultId, pMatchID, pFancyID, CONSTANTS.SUPER_ADMIN_COMMISSION_TYPE]);

		return resultdb(CONSTANTS.SUCCESS, getRollbackResult[0]);
	} catch (e) {
        logger.errorlog.error("getRollbackFancy",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getBetsFancy = async (fancy_id) => {
	try {
		let sql = 'select * from bets_fancy where fancy_id=?';
		let getResult = await MysqlPool.query(sql, [fancy_id]);

		return resultdb(CONSTANTS.SUCCESS, getResult);
	} catch (e) {
        logger.errorlog.error("getBetsFancy",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getFancyBetForUserPosition = async (user_id,fancy_id,user_type_id=null,notInIds=[],is_show_100_percent=0) => {
    try {
        let condition;
        let selectioName;
        switch(user_type_id) {
            case 1:
                condition=' and admin_id=?  ';
                if(is_show_100_percent==1){
                    selectioName=' ,100 as per ';        
                }else{
                    selectioName=' ,admin as per ';    
                }
                break;
            case 2:
                condition=' and master_id=? ';
                if(is_show_100_percent==1){
                    selectioName=' ,100 as per ';        
                }else{
                    selectioName=' ,master as per ';    
                }                
                break;
            case 3:
                condition=' and super_agent_id=? ';
                if(is_show_100_percent==1){
                    selectioName=' ,100 as per ';        
                }else{
                    selectioName=' ,super_agent as per ';    
                }                
                break;
            case 4:
                condition=' and agent_id=? ';
                if(is_show_100_percent==1){
                    selectioName=' ,100 as per ';        
                }else{
                    selectioName=' ,agent as per ';    
                }                
                break;
            default:
                condition=' and user_id=? ';
                selectioName=' , 100 as per ';
        }

        if( notInIds.length > 0){
            condition+=" and id not in (?) "
        }

        let sql = 'select run,is_back,size,sum(stack) as stack '+selectioName+' from bets_fancy where delete_status="0" and fancy_id=? '+condition+' group by run,is_back,size,admin,master,super_agent,agent order by run';
        let getResult = await MysqlPool.query(sql, [fancy_id,user_id,notInIds]);
    //    console.log(MysqlPool.format(sql, [fancy_id,user_id,notInIds]))
        return resultdb(CONSTANTS.SUCCESS, getResult);
    } catch (e) {
        logger.errorlog.error("getFancyBetForUserPosition",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getFancyPosition = async (user_id,fancy_id) => {
    try {

        let sql = 'select id,profit,liability,fancy_score_position_json from fancy_score_position where fancy_id=? and user_id=? limit 0,1';
        let getResult = await MysqlPool.query(sql, [fancy_id,user_id]);
        if(getResult.length>0){
            return resultdb(CONSTANTS.SUCCESS, getResult[0]);
		}
        return resultdb(CONSTANTS.SUCCESS, {"id":0,"liability":0,"profit":0,"fancy_score_position_json":[]});

    } catch (e) {
        logger.errorlog.error("getFancyPosition",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getRunTimeFancyPosition = async (user_id,fancy_id,user_type_id,notInArray,is_show_100_percent) => {
    try {
        let data;
        let fancyList = await  getFancyBetForUserPosition(user_id,fancy_id,user_type_id,notInArray,is_show_100_percent);
        // console.log(fancyList);
      
        if(user_type_id==5){
             minus = -1;
        } 

        let fancyListData = [];
        if (fancyList.statusCode === CONSTANTS.SUCCESS) {
            fancyListData = fancyList.data;
            if(fancyListData.length > 0 ){
                let run=[];
                let resultValues=[];
                let orgRun=[];
                let lastPosition  =0;
                let max_exposure  =0;
                for (let i in fancyListData){
                    let fancy = fancyListData[i];
                    run.push(fancy.run-1);
                }
                run.push(fancyListData[fancyListData.length-1].run);
                //console.log(fancyListData);
                orgRun = run;

                run =  [...new Set(run)];
                //console.log("runrun",run);
                run.map( function (r,ind) {
                    let tempTotal = 0;
                    fancyListData.map(async function (f) {

                        let stack = (f.stack*f.per)/100;
                        if(f.is_back==1){
                            if(f.run <=r){

                                tempTotal-= stack*(f.size/100);
                            }else{
                                tempTotal+=stack;
                            }

                        }else{

                            if(f.run >r){

                                tempTotal-=stack;

                            }else{
                                tempTotal+=stack*(f.size/100);
                            }

                        }
                      //  tempTotal = minus*((tempTotal)*f.per)/100;
                    });

                    if(user_type_id==5){
                         minus = -1;
                         if((orgRun.length)-1 == ind){
                            resultValues.push({"key":lastPosition+'+',"value": minus * tempTotal.toFixed(2)});
                        }else{
                            if(lastPosition==r){
                                resultValues.push({"key":lastPosition,"value":minus * tempTotal.toFixed(2)});
                            }else{
                                resultValues.push({"key":lastPosition+'-'+r,"value":minus * tempTotal.toFixed(2)});
                            }
                        }
                    }else{
                        if((orgRun.length)-1 == ind){
                            resultValues.push({"key":lastPosition+'+',"value":tempTotal.toFixed(2)});
                        }else{
                            if(lastPosition==r){
                                resultValues.push({"key":lastPosition,"value":tempTotal.toFixed(2)});
                            }else{
                                resultValues.push({"key":lastPosition+'-'+r,"value":tempTotal.toFixed(2)});
                            }
                        }
                    } 

                    lastPosition = r+1;
                    if(max_exposure > tempTotal){
                        max_exposure= tempTotal;
                    }

                });
                data = {"fancy_position":resultValues,"liability":max_exposure};
            }else {
                data = {"fancy_position":[],"liability":0};
            }
        }else{
             data = {"fancy_position":[],"liability":0};
        }


        return resultdb(CONSTANTS.SUCCESS, data);

    } catch (e) {
        logger.errorlog.error("getRunTimeFancyPosition",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let createFancyPosition = async (user_id,fancy_id,dataObj) => {
    try {
		let DataOject  = {
            "run": parseInt(dataObj.run),
            "is_back": dataObj.is_back ,
            "size":dataObj.size,
            "stack": dataObj.stack
		};


        let fancyList = await  getFancyBetForUserPosition(user_id,fancy_id);
        	let fancyListData = [];
			if (fancyList.statusCode === CONSTANTS.SUCCESS) {
                fancyListData = fancyList.data;
                fancyListData.push(DataOject);
			}else {
                fancyListData.push(DataOject);
			}
        fancyListData.sort((a, b) => (a.run > b.run) ? 1 : -1);
            // fancyListData.sort(function (run1, run2) {
            //     if (run1.run > run2.run) return 1;
            // });


            let run=[];
            let resultValues=[];
            let orgRun=[];
            let lastPosition  =0;
            let max_exposure  =0;
            let max_profit  =0;
            for (let i in fancyListData){
                let fancy = fancyListData[i];
                run.push(fancy.run-1);
            }
            run.push(fancyListData[fancyListData.length-1].run);
            orgRun = run;

            run =  [...new Set(run)];

            run.map( function (r,ind) {
                let tempTotal = 0;
                fancyListData.map( function (f) {

                    if(f.is_back==1){

                        if( r < f.run){

                            tempTotal-= f.stack;

                        }else{
                            tempTotal+=f.stack*(f.size/100);
                        }

                    }else{
                        //console.log("layeeee",f.run);
                        if( r >= f.run){
                           tempTotal-=f.stack*(f.size/100);

                        }else{
                            tempTotal+=f.stack;
                        }

                    }
                });

                if((orgRun.length)-1 == ind){
                    resultValues.push({"key":lastPosition+'+',"value":tempTotal.toFixed(2)});
                }else{
                    if(lastPosition==r){
                        resultValues.push({"key":lastPosition,"value":tempTotal.toFixed(2)});
                    }else{
                        resultValues.push({"key":lastPosition+'-'+r,"value":tempTotal.toFixed(2)});

                    }

                }

                lastPosition = r+1;
                if(max_exposure > tempTotal){
                    max_exposure= tempTotal;
                }
                if(max_profit < tempTotal){
                    max_profit= tempTotal;
                }

            });
            let data = {"fancy_position":resultValues,"liability":max_exposure,"profit":max_profit};
            return resultdb(CONSTANTS.SUCCESS, data);

    } catch (e) {
        logger.errorlog.error("createFancyPosition",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};



let getActiveFancyList = async (match_id, parentsId) => {
    try {
		parentsId = parentsId.split(',');
        let sql = 'select f.id,f.selection_id from fancy f left join deactive_fancy df on (df.fancy_id=f.fancy_id and df.user_id in (?)) where f.match_id in (?) and df.id IS NULL';
        let getResult = await MysqlPool.query(sql,[parentsId, match_id]);
        return resultdb(CONSTANTS.SUCCESS, getResult);
    } catch (e) {
        logger.errorlog.error("getActiveFancyList",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getFancyUser = async (match_id,parent_id,parent_type) => {
    try {
        let query='select users.id,users.parent_id,users.user_type_id,users.name,users.user_name from users inner join  bets_fancy on users.id=';

        switch(parent_type) {
            case 1:
                query+=' bets_fancy.master_id  ';
                break;
            case 2:
                query+=' bets_fancy.super_agent_id';
                break;
            case 3:
                query+=' bets_fancy.agent_id';
                break;
            case 4:
                query+=' bets_fancy.user_id';
                break;
            default:
                query+=' ';
        }
        query+=" where bets_fancy.match_id=? and  users.parent_id= ?  group by users.id";

        let matchUser = await MysqlPool.query(query,[match_id,parent_id]);

        if (matchUser===null) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{

            return resultdb(CONSTANTS.SUCCESS, matchUser);
        }
    } catch (e) {
        logger.errorlog.error("getFancyUser",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let setFancyRiskManagement = async (data) => {
	try {
		await MysqlPool.query('UPDATE fancy SET max_session_bet_liability = ?, max_session_liability = ? WHERE fancy_id = ?;',[data.max_session_bet_liability, data.max_session_liability, data.fancy_id]);
		return resultdb(CONSTANTS.SUCCESS, 'Updated Successfully');
	} catch (e) {
        logger.errorlog.error("setFancyRiskManagement",e);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateFancyStatusBySuperAdmin = async (data) => {
	try {
		if(data.is_update_all == 1){
			await MysqlPool.query('UPDATE fancy SET active = ? WHERE active != "3" AND match_id = ?', [data.active, data.match_id]);
		}else{
			let fancy_id = data.match_id + '_' + data.selection_id;
			await MysqlPool.query('UPDATE fancy SET active = ? WHERE active != "3" AND fancy_id = ?', [data.active, fancy_id]);
		}
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (error) {
        logger.errorlog.error("updateFancyStatusBySuperAdmin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateFancyMessageBySuperAdmin = async (data) => {
	try {
		let fancy_id = data.match_id + '_' + data.selection_id;
		await MysqlPool.query('UPDATE fancy SET super_admin_message = ? WHERE fancy_id = ?', [data.message, fancy_id]);
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (error) {
        logger.errorlog.error("updateFancyMessageBySuperAdmin",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateDeactiveFancyStatus = async (data) => {
	try {
		let resFromDB = await MysqlPool.query('SELECT user_id, fancy_id FROM deactive_fancy WHERE user_id = ? AND fancy_id = ? LIMIT 1',[data.user_id, data.fancy_id]);
		if (resFromDB.length > 0) {
			await MysqlPool.query('DELETE FROM deactive_fancy WHERE user_id=? AND fancy_id=?',[data.user_id,data.fancy_id]);
			return resultdb(CONSTANTS.SUCCESS, 'Fancy activated successfully');
		}else{
			await MysqlPool.query('INSERT INTO deactive_fancy SET ?',[data]);
			return resultdb(CONSTANTS.SUCCESS, 'Fancy deactivated successfully');
		}
	} catch (error) {
        logger.errorlog.error("updateDeactiveFancyStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


let updatefancyOdds = async (data) => {
	try {
		let updateQuery = 'UPDATE fancy SET rate_diff = ?, point_diff = ?, session_value_yes = ?, session_value_no = ?, session_size_yes = ? WHERE fancy_id = ?';
		let resFromDB = await MysqlPool.query(updateQuery, [data.rate_diff, data.point_diff, data.session_value_yes, data.session_value_no, data.session_size_yes, data.fancy_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
        logger.errorlog.error("updatefancyOdds",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getMaxSelectionIdMatch = async (match_id) => {
	try {
		let fancyQuery = 'SELECT IFNULL(MAX(selection_id), "'+CONSTANTS.MANUAL_FANCY+'_0") selection_id FROM fancy WHERE match_id = ? AND is_indian_fancy=1 LIMIT 1';
		let resFromDB = await MysqlPool.query(fancyQuery, [match_id]);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		//console.log(error);
        logger.errorlog.error("getMaxSelectionIdMatch",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let changeFancyMode = async (data) => {
	try {
		await MysqlPool.query('UPDATE fancy SET fancy_mode = ? WHERE fancy_id = ? AND is_indian_fancy = "0" LIMIT 1;', [data.fancy_mode, data.fancy_id]);
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (error) {
        logger.errorlog.error("changeFancyMode",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let updateRatePointDiff = async (data) => {
	try {
		await MysqlPool.query('UPDATE fancy SET rate_diff = ?, point_diff = ? WHERE fancy_id = ? LIMIT 1;', [data.rate_diff, data.point_diff, data.fancy_id]);
		return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
	} catch (error) {
        logger.errorlog.error("updateRatePointDiff",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

module.exports = {
	createFancy,
	getFancy,
	getFancyBySuperAdmin,
	getmarketId,
	getFancyById,
	updatefancyData,
	updatefancy,
	matchResultFancy,
	abandonedFancy,
	getRollbackFancy,
	getBetsFancy,
    getActiveFancyList,
    getFancyByMatchId,
    getFancyUser,
    getFancyBetForUserPosition,
    createFancyPosition,
    getRunTimeFancyPosition,
    getFancyPosition,
	setFancyRiskManagement,
	updateFancyStatusBySuperAdmin,
	updateFancyMessageBySuperAdmin,
	updateDeactiveFancyStatus,
	updatefancyOdds,
	getMaxSelectionIdMatch,
	changeFancyMode,
	updateRatePointDiff
};
