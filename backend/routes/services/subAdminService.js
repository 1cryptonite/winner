const MysqlPool = require('../../db');
const connConfig = require('../../db/indexTest');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');
const SALT_WORK_FACTOR=10;

let resultdb = globalFunction.resultdb;

let save = async (data) => {
    try {
            let resFromDB = await MysqlPool.query('SELECT id FROM sub_admins WHERE user_name = ? LIMIT 1;', [data.user_name]);
            let resUserFromDB = await MysqlPool.query('SELECT id FROM users WHERE user_name = ? LIMIT 1;', [data.user_name]);
            if (resFromDB.length > 0) {
                return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
            }else if(resUserFromDB.length > 0){
                return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
            }else{
                let genSalt=await bcrypt.genSalt(SALT_WORK_FACTOR);
                let hash=await  bcrypt.hash(data.password, genSalt);

                let data1={
                    user_name: data.user_name,
                    name: data.name,
                    remark: data.remark,
                    sub_admin_role_id: data.sub_admin_role_id,
                    create_at:globalFunction.currentDate(),update_at:globalFunction.currentDate(),
                    password: hash
                };
                let createdUserData = await MysqlPool.query('INSERT INTO sub_admins  SET ?',[data1]);
                return resultdb(CONSTANTS.SUCCESS, CONSTANTS.DATA_NULL);
            }
    } catch (error) {
        logger.errorlog.error("save",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let list = async () => {
    try {
        let qry = "SELECT sub_admins.id,sub_admin_roles.role_name role_name,sub_admins.user_name,sub_admins.name,sub_admins.remark,sub_admins.is_active,sub_admins.create_at FROM sub_admins LEFT JOIN sub_admin_roles ON sub_admins.sub_admin_role_id = sub_admin_roles.id;";

        let qryResult = await MysqlPool.query(qry);
        return resultdb(CONSTANTS.SUCCESS, qryResult);
    }
    catch (e) {
        logger.errorlog.error("list",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let update = async (data) => {
    try {
            let checkSubAdminFromDB = await MysqlPool.query('SELECT id FROM sub_admins WHERE id = ? LIMIT 1;', [data.id]);
            if (checkSubAdminFromDB.length > 0) {
                let resFromDB = await MysqlPool.query('SELECT id FROM sub_admins WHERE user_name = ? AND id != ? LIMIT 1;', [data.user_name,data.id]);
                let resUserFromDB = await MysqlPool.query('SELECT id FROM users WHERE user_name = ? LIMIT 1;', [data.user_name,data.id]);
                if (resFromDB.length > 0) {
                    return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
                }else if(resUserFromDB.length > 0){
                    return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
                } else {

                    let updateData={
                        user_name: data.user_name,
                        name: data.name,
                        remark: data.remark,
                        sub_admin_role_id: data.sub_admin_role_id,
                        update_at:globalFunction.currentDate(),
                    };

                    let resFromDB = await MysqlPool.query('UPDATE sub_admins SET ? WHERE id = ?', [updateData, data.id]);
                    return resultdb(CONSTANTS.SUCCESS, resFromDB);
                }
            }else{
                return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
            }
       
    } catch (error) {
        logger.errorlog.error("update",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let deleteById = async (data) => {
    try {
            let resFromDB = await MysqlPool.query('SELECT id FROM sub_admins WHERE id = ? LIMIT 1;', [data.id]);
            if (resFromDB.length > 0) {
                let resFromDB = await MysqlPool.query('DELETE from sub_admins WHERE id = ?', [data.id]);

                return resultdb(CONSTANTS.SUCCESS, resFromDB);
            } else {
                return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
            }
    } catch (error) {
        logger.errorlog.error("deleteById",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getSubAdminByUserName = async (user_name) => {
    try {
        let userdetails =await MysqlPool.query('SELECT * FROM sub_admins where user_name = ?',user_name);
        if (userdetails.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, userdetails);
        }
    } catch (error) {
        logger.errorlog.error("getSubAdminByUserName",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let getSubAdminUserById = async (id) => {
    try {
        let userdetails =await MysqlPool.query('SELECT * FROM sub_admins WHERE id = ? LIMIT 1;', id);
        if (userdetails.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, userdetails[0]);
        }
    } catch (error) {
        logger.errorlog.error("getSubAdminUserById",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let findById = async (id) => {
    try {
        let qry = "SELECT sub_admins.id,sub_admin_roles.role_name role_name,sub_admins.user_name,sub_admins.name,sub_admins.remark,sub_admins.is_active,sub_admins.create_at FROM sub_admins LEFT JOIN sub_admin_roles ON sub_admins.sub_admin_role_id = sub_admin_roles.id where sub_admins.id=?;";
        let qryResult = await MysqlPool.query(qry,[id]);

        if (qryResult.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, qryResult[0]);
        }
    }
    catch (e) {
        logger.errorlog.error("findById",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let saveStatus = async (data) => {
    try {
            let resFromDB = await MysqlPool.query('SELECT id FROM sub_admins WHERE id = ? LIMIT 1;', [data.id]);
            if (resFromDB.length > 0) {
                let resFromDB = await MysqlPool.query('UPDATE sub_admins SET is_active = IF(is_active="1", "0", "1")  WHERE id = ?', [ data.id]);
                return resultdb(CONSTANTS.SUCCESS, resFromDB);
            } else {
                return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
            }
    } catch (error) {
        logger.errorlog.error("saveStatus",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

module.exports = {
    save,
    list,
    update,
    deleteById,
    getSubAdminByUserName,
    findById,
    saveStatus,
    getSubAdminUserById,
};
