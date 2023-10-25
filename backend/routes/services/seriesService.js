const MysqlPool = require('../../db');
const	globalFunction = require('../../utils/globalFunction');
const	CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');
let resultdb = globalFunction.resultdb;

let getAllSeries = async (data) => {

	try {
		let calcTemp='';
		if (data.pageno===1) {
			calcTemp='SQL_CALC_FOUND_ROWS';
		}
		let queryString ='SELECT '+calcTemp+' series.series_id,series.name,series.is_manual,series.is_active, sports.sport_id, sports.name as sports_name FROM series  INNER join sports on series.sport_id=sports.sport_id where 1=1';

		let conditionParameter=[];
		let offSet=' LIMIT ? OFFSET ?';
		
		if(data.sport_id!==null){
			queryString+= ' and sports.sport_id =? ';
			conditionParameter.push(data.sport_id);
		}
		if(data.status!==null){
			queryString+= ' and series.is_active =? ';
			conditionParameter.push(''+data.status);
		}
		if(data.series_name!==null){
			queryString+= ' and series.name like ?';
			conditionParameter.push('%'+data.series_name+'%');
		}
		if (data.pageno!==null && data.limit!==null) {
			conditionParameter.push(data.limit);
			conditionParameter.push(((data.pageno-1)*data.limit));
			queryString=queryString+offSet;
		}

		queryString=queryString+'; SELECT FOUND_ROWS() AS total;';

		let seriesdetails =await MysqlPool.query(queryString,conditionParameter);

		let returnRes={
			list:seriesdetails[0],
			total:seriesdetails[1][0].total
		};
		
		if (seriesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, returnRes);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getAllSeries",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let createSeries = async (data) => {
	try {
		//console.log('datadata  ',data);
		let resFromDB= await MysqlPool.query('INSERT INTO series SET ?',data);
		//console.log('resFromDB  ',resFromDB);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("createSeries",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let updateSeriesStatus = async (id) => {
	try {
		//console.log('datadata  ',id);
		let resFromDB = await MysqlPool.query('UPDATE series  SET is_active = IF(is_active=?, ?, ?) WHERE series_id = ?',['1','0','1',id]);
		//let resFromDB=await Markets.create(data,{isNewRecord:true});
		//console.log('resFromDB  ',resFromDB);
		return resultdb(CONSTANTS.SUCCESS, resFromDB);
	} catch (error) {
		logger.errorlog.error("updateSeriesStatus",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};
let getSeriesByListOfID = async (idlist) => {
	try {
		let seriesdetails =await MysqlPool.query('SELECT * FROM series  where series_id  in  (?)',[idlist]);
		if (seriesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, seriesdetails);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getSeriesByListOfID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getActiveSeriesByListOfID = async (idlist) => {
	try {
		let seriesdetails =await MysqlPool.query('SELECT * FROM series  where series_id  in  (?) and is_active="1"',[idlist]);
		if (seriesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, seriesdetails);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getActiveSeriesByListOfID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};

let getActiveSeriesBySportID = async (sport_id) => {
	try {
		let queryString='SELECT * FROM series  where is_active = "1" ';
		let condition=[];
		let whereCondition=' ';
		if (sport_id!==0) {
			whereCondition=' and sport_id=? ';
			condition.push(sport_id);
		}
		let seriesdetails =await MysqlPool.query(queryString+whereCondition,condition);
		if (seriesdetails===null) {
			return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
		}else{
			return resultdb(CONSTANTS.SUCCESS, seriesdetails);
		}
	} catch (error) {
		//console.log(error);
		logger.errorlog.error("getActiveSeriesBySportID",error);
		return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
	}
};


module.exports = {
	getAllSeries,createSeries,updateSeriesStatus,getSeriesByListOfID,getActiveSeriesByListOfID,getActiveSeriesBySportID
};
