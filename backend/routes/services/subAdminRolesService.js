/* eslint-disable indent */
const MysqlPool = require('../../db');
const globalFunction = require('../../utils/globalFunction');
const CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');

let resultdb = globalFunction.resultdb;

let save = async (data) => {
    try {
        if(data.id){
            let qryResult = await MysqlPool.query('SELECT id FROM sub_admin_roles WHERE role_name = ? AND id != ? LIMIT 1;', [data.role_name,data.id]);
            if (qryResult.length > 0) {
                return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
            } else {
                let qryResult = await MysqlPool.query('UPDATE sub_admin_roles SET ? WHERE id = ?', [data, data.id]);
                return resultdb(CONSTANTS.SUCCESS, qryResult);
            }
        }else{
            let qryResult = await MysqlPool.query('SELECT id FROM sub_admin_roles WHERE role_name = ? LIMIT 1;', [data.role_name]);
            if (qryResult.length > 0) {
                return resultdb(CONSTANTS.ALREADY_EXISTS, CONSTANTS.DATA_NULL);
            } else {
                let qryResult = await MysqlPool.query('INSERT INTO sub_admin_roles SET ?', data);
                return resultdb(CONSTANTS.SUCCESS, qryResult);
            }
        }
    } catch (error) {
        logger.errorlog.error("save",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let list = async () => {
    try {

        let qry = "SELECT id,role_name FROM sub_admin_roles;";
        let qryResult = await MysqlPool.query(qry);
        return resultdb(CONSTANTS.SUCCESS, qryResult);
    }
    catch (e) {
        logger.errorlog.error("list",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let delete_role = async (role_id) => {
    try {
        let resFromDB = await MysqlPool.query('SELECT * FROM sub_admins WHERE sub_admin_role_id = ? LIMIT 1;', [role_id]);
        if (resFromDB.length === 0) {
            let resFromDB = await MysqlPool.query('DELETE FROM sub_admin_roles WHERE id = ?', [role_id]);
            return resultdb(CONSTANTS.SUCCESS, resFromDB);
        } else {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }
    } catch (e) {
        logger.errorlog.error("delete_role",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};


let findById = async (id) => {
    try {
        let qry = "SELECT id,role_name,sub_admin_roles FROM sub_admin_roles where id=?;";
        let qryResult = await MysqlPool.query(qry,[id]);
        return resultdb(CONSTANTS.SUCCESS, qryResult);
    }
    catch (e) {
        logger.errorlog.error("findById",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let permissions = async () => {
    try {
        let qryResult = [{"label":"User","fields":[{"key":"user_menu","value":"User Menu"},{"key":"lock_settlement","value":"Lock Settlement"},{"key":"add_user","value":"Add User"},{"key":"view_account","value":"View Account"},{"key":"update_user","value":"Update User"},{"key":"deposit_withdraw","value":"Deposit Withdraw"},{"key":"change_pwd","value":"Change Password"},{"key":"user_lock","value":"User Lock"},{"key":"lock_betting","value":"Lock Betting"},{"key":"partnership","value":"Partnership"},{"key":"user_setting","value":"User Setting"},{"key":"lock_fancy_betting","value":"Lock Fancy Betting"}]},{"label":"Market Watch","fields":[{"key":"market_watch_menu","value":"Market Watch"},{"key":"bet_list","value":"Bet List"},{"key":"market_position","value":"Market Position"}]},{"label":"Manage Series\/Matches","fields":[{"key":"manage_series_match_menu","value":"Manage Series Match"},{"key":"view_match","value":"View Match"},{"key":"match_active","value":"Match Active"},{"key":"manage_match","value":"Manage Match Match"},{"key":"session_fancy","value":"Session Fancy"},{"key":"indian_fancy","value":"Indian Fancy"},{"key":"betfair_market","value":"Betfair Market"}]},{"label":"Sports Settings","fields":[{"key":"sports_setting_menu","value":"Sports Setting Menu"},{"key":"manual_sport","value":"Manual Sport"},{"key":"sports_setting_sub_menu","value":"Sports Setting"},{"key":"sports_status","value":"Sports Status"},{"key":"series_setting_sub_menu","value":"Series Setting Menu"},{"key":"manual_series","value":"Manual Series"},{"key":"series_status","value":"Series Status"},{"key":"match_setting_sub_menu","value":"Match Setting Menu"},{"key":"manual_match","value":"Manual Match"},{"key":"match_setting","value":"Match Setting"},{"key":"match_status","value":"Match Status"},{"key":"market_setting_sub_menu","value":"Market Setting Menu"},{"key":"market_setting","value":"Market Setting"},{"key":"market_status","value":"Market Status"},{"key":"apk_setting_sub_menu","value":"Apk Setting"},{"key":"apk_status","value":"Apk Status"},{"key":"manage_fancy_sub_menu","value":"Manage Fancy Menu"},{"key":"edit_fancy","value":"Edit Fancy"},{"key":"update_fancy","value":"Update Fancy"},{"key":"fancy_abandoned","value":"Fancy Abandoned"},{"key":"fancy_result","value":"Fancy Result"},{"key":"clear_all_data_sub_menu","value":"Clear All Data"},{"key":"match_result_sub_menu","value":"Match Result Menu"},{"key":"auto_result_declare","value":"Auto Result Declare"},{"key":"result","value":"Result"},{"key":"abandon","value":"Abandon"},{"key":"active_matches","value":"Active Matches"},{"key":"book_maker","value":"Book Maker"},{"key":"manual_market","value":"Manual Market"},{"key":"match_rollback_sub_menu","value":"Match Rollback Menu"},{"key":"rollback","value":"Rollback"}]},{"label":"Reports","fields":[{"key":"reports_menu","value":"Reports"},{"key":"settlement_sub_menu","value":"Settlement"},{"key":"casino_commission_sub_menu","value":"Casino Commission"},{"key":"bet_history_sub_menu","value":"Bet History"},{"key":"casino_result_report_sub_menu","value":"Casino Result Report"},{"key":"account_statement_sub_menu","value":"Account Statement"},{"key":"profit_loss_by_match_sub_menu","value":"Profit Loss By Match"},{"key":"profit_loss_by_upline_sub_menu","value":"ProfitLossByUpline"},{"key":"deleted_bets_sub_menu","value":"Deleted Bets"}]},{"label":"Header Menu","fields":[{"key":"notification_menu","value":"Notification"},{"key":"change_pwd_menu","value":"Change password"},{"key":"global_setting_menu","value":"Global setting"},{"key":"online_user_menu","value":"Online user"},{"key":"close_user_menu","value":"Close user"},{"key":"remove_data_menu","value":"Remove data"}]}];

        return resultdb(CONSTANTS.SUCCESS, qryResult);
    }
    catch (e) {
        logger.errorlog.error("permissions",e);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

let findByRoleName = async (role_name) => {
    try {
        let qryResult =await MysqlPool.query('SELECT * FROM sub_admin_roles where role_name = ?',role_name);
        if (qryResult.length<=0) {
            return resultdb(CONSTANTS.NOT_FOUND, CONSTANTS.DATA_NULL);
        }else{
            return resultdb(CONSTANTS.SUCCESS, qryResult);
        }
    } catch (error) {
        logger.errorlog.error("findByRoleName",error);
        return resultdb(CONSTANTS.SERVER_ERROR, CONSTANTS.DATA_NULL);
    }
};

module.exports = {
    save,
    list,
    delete_role,
    findById,
    permissions,
    findByRoleName,
};
