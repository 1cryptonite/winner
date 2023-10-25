const express = require('express');
const router = express.Router();
const subAdminRolesService = require('../services/subAdminRolesService');
const globalFunction = require('../../utils/globalFunction');
const logger = require('../../utils/logger');

let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const CONSTANTS = require('../../utils/constants');

const Joi = require('joi');


async function permissions(req, res)
{   
    try {
        const subAdminRoleSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required()
        });
        try {
            await subAdminRoleSchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let datafromService = await subAdminRolesService.permissions();
        if (datafromService.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Success', datafromService.data);
        } else {
            return apiErrorRes(req, res, 'Data not available !');
        }
    } catch (e) {
        logger.errorlog.error("permissions",e);
        return apiErrorRes(req, res, 'Error to get data !');
    }
}

async function list(req, res)
{ 
    try {
        const subAdminRoleSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required()
        });
        try {
            await subAdminRoleSchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let datafromService = await subAdminRolesService.list();
        if (datafromService.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Success', datafromService.data);
        } else {
            return apiErrorRes(req, res, 'Data not available !');
        }
    } catch (e) {
        logger.errorlog.error("list",e);
        return apiErrorRes(req, res, 'Error to get data !');
    }
}


async function delete_role(req, res)
{
    try {
        let {role_id}=req.body;
        const subAdminRoleSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            role_id: Joi.number().required()
        });
        try {
            await subAdminRoleSchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let datafromService = await subAdminRolesService.delete_role(role_id);
        if (datafromService.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Sub admin role deleted successfully', datafromService.data);
        } else {
            return apiErrorRes(req, res, 'Error ,This role is already used !');
        }
    } catch (e) {
        logger.errorlog.error("delete_role",e);
        return apiErrorRes(req, res, 'Error to get data !');
    }
}

async function findById(req, res) {

    let {id}=req.body;
    const subAdminRoleSchema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        id: Joi.number().required(),
    });
    
    try {
        await subAdminRoleSchema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let parents =req.body.parent_ids;

    let datafromService = await subAdminRolesService.findById(id);
    if (datafromService.statusCode===CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Success',datafromService.data);

    } else {
        return apiSuccessRes(req, res, 'not found.');
    }
}

async function save(req, res) {
    try {

        let {id,role_name,sub_admin_roles}=req.body;
        const subAdminRoleSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required(),
            role_name: Joi.string().required(),
            sub_admin_roles: Joi.optional().required(),
            id: Joi.number().required(),
        });
        
        try {
            await subAdminRoleSchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            //errorlog.error('Invalid param.'+error);
            return apiErrorRes(req, res, error.details[0].message);
        }

        let reqdata = {
            id,
            role_name,
            sub_admin_roles,
            updated_at: globalFunction.currentDate(),
        };
        
        var user_permission = sub_admin_roles.split(",")

        var permissions = ['user_menu','add_user','view_account','update_user','deposit_withdraw','change_pwd','user_lock','lock_betting','partnership','user_setting','lock_fancy_betting','market_watch_menu','bet_list','lock_settlement','market_position','manage_series_match_menu','view_match','match_active','manage_match','session_fancy','indian_fancy','betfair_market','sports_setting_menu','manual_sport','sports_setting_sub_menu','sports_status','series_setting_sub_menu','manual_series','series_status','match_setting_sub_menu','manual_match','match_setting','match_status','market_setting_sub_menu','market_setting','market_status','apk_setting_sub_menu','apk_status','manage_fancy_sub_menu','edit_fancy','active_fancy','inactive_fancy','fancy_suspend','fancy_abandoned','fancy_result','clear_all_data_sub_menu','match_result_sub_menu','auto_result_declare','result','abandon','active_matches','book_maker','manual_market','match_rollback_sub_menu','rollback','reports_menu','settlement_sub_menu','casino_commission_sub_menu','bet_history_sub_menu','casino_result_report_sub_menu','account_statement_sub_menu','profit_loss_by_match_sub_menu','profit_loss_by_upline_sub_menu','deleted_bets_sub_menu','notification_menu','change_pwd_menu','global_setting_menu','online_user_menu','close_user_menu','remove_data_menu'];

        for(var permission of permissions) { 
            if(user_permission.indexOf(permission)==-1){
                reqdata[permission] = '0';
            }else{
                reqdata[permission] = '1';
            }
        }

        if(id==0){
            reqdata['created_at'] = globalFunction.currentDate();
        }

        let datafromService = await subAdminRolesService.save(reqdata);

        if (datafromService.statusCode === CONSTANTS.SUCCESS) {
            return apiSuccessRes(req, res, 'Subadmin role saved successfully');
        }else if(datafromService.statusCode === CONSTANTS.ALREADY_EXISTS){
            return apiSuccessRes(req, res, 'Error subadmin role already exists');
        } else {
            return apiSuccessRes(req, res, 'Error to create subadmin role.');
        }
    } catch (e) {
        logger.errorlog.error("save",e);
        return apiSuccessRes(req, res, 'Error to create subadmin role.');
    }
}

async function check_role_name(req, res) {
    let {
        role_name
    } = req.body;
    const profilechema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        role_name: Joi.required(),
    });
    try {
        await profilechema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let getUserDetailsFromDB = await subAdminRolesService.findByRoleName(role_name);
    if (getUserDetailsFromDB.statusCode === CONSTANTS.NOT_FOUND) {
        return apiSuccessRes(req, res, 'role name available!');
    } else if (getUserDetailsFromDB.statusCode === CONSTANTS.SUCCESS) {
        return apiErrorRes(req, res, 'role name already exist!');
    } else {
        return apiErrorRes(req, res, 'Some Thing Is Wrong!');
    }
}

router.get('/subAdminRoles/permissions', permissions);
router.get('/subAdminRoles/list', list);
router.post('/subAdminRoles/delete_role', delete_role);
router.post('/subAdminRoles/findById', findById);
router.post('/subAdminRoles/save', save);
router.post('/subAdminRoles/check_role_name', check_role_name);
module.exports = router;
