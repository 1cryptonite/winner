const express = require('express');
const router = express.Router();
const subAdminService = require('../services/subAdminService');
const userService = require('../services/userService');
const globalFunction = require('../../utils/globalFunction');
let apiSuccessRes = globalFunction.apiSuccessRes;
let apiErrorRes = globalFunction.apiErrorRes;
const CONSTANTS = require('../../utils/constants');
const logger = require('../../utils/logger');
const Joi = require('joi');

async function save(req, res) {  
    let {
        name,
        user_name,
        password,
        remark,
        sub_admin_role_id,  
    } = req.body;

    const schema = Joi.object({
        name: Joi.string().required(),
        user_name: Joi.string().required(),
        password: Joi.string().required(),
        remark: Joi.optional(),
        sub_admin_role_id: Joi.number().required().positive().strict(),
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
    });
    try {
        await schema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }
    let reqdaa = {
        user_name,
        password,
        remark,
        sub_admin_role_id,
        name,
    };

    let datafromService = await subAdminService.save(reqdaa);
    if (datafromService.statusCode === CONSTANTS.SUCCESS) {
         return apiSuccessRes(req, res, 'Sub admin save successfully');
    }else if(datafromService.statusCode === CONSTANTS.ALREADY_EXISTS){
         return apiSuccessRes(req, res, 'Error username already exists');
    } else {
         return apiErrorRes(req, res, 'Error to register sub admin !');
    }
}

async function list(req, res)
{ 
    try {
        const subAdminSchema = Joi.object({
            userid: Joi.number().required(),
            parent_ids: Joi.optional().required()
        });
        try {
            await subAdminSchema.validate(req.body, {
                abortEarly: true
            });
        } catch (error) {
            return apiErrorRes(req, res, error.details[0].message);
        }

        let datafromService = await subAdminService.list();
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

async function update(req, res) {  
    let {
        id,
        name,
        user_name,
        remark,
        sub_admin_role_id,  
    } = req.body;

    const schema = Joi.object({
        name: Joi.string().required(),
        user_name: Joi.string().required(),
        remark: Joi.optional(),
        sub_admin_role_id: Joi.number().required().positive().strict(),
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        id: Joi.number().required(),
    });
    try {
        await schema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }
    let reqdaa = {
        id,
        user_name,
        remark,
        sub_admin_role_id,
        name,
    };

    let datafromService = await subAdminService.update(reqdaa);
 
    if (datafromService.statusCode === CONSTANTS.SUCCESS) {
         return apiSuccessRes(req, res, 'Sub admin save successfully');
    }else if(datafromService.statusCode === CONSTANTS.NOT_FOUND){
         return apiSuccessRes(req, res, 'Sub admin not found');
    }else if(datafromService.statusCode === CONSTANTS.ALREADY_EXISTS){
            return apiSuccessRes(req, res, 'Error username already exists');
    } else {
         return apiErrorRes(req, res, 'Error to register sub admin !');
    }
}

async function subAdminDelete(req, res) {  
    let {
        id
     } = req.body;

    const schema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        id: Joi.number().required()
    });
    try {
        await schema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }
    let reqdaa = {
        id
    };

    let datafromService = await subAdminService.deleteById(reqdaa);

    if (datafromService.statusCode === CONSTANTS.SUCCESS) {
        let subAdminDetails  = await subAdminService.getSubAdminUserById(id);

        global._loggedInToken.forEach(async (element, index) => {
            if(element.user_name == subAdminDetails.data.user_name)
            {
                global._loggedInToken.splice(index, 1);
            }
        });

         return apiSuccessRes(req, res, 'Sub admin deleted successfully');
    }else if(datafromService.statusCode === CONSTANTS.NOT_FOUND){
         return apiSuccessRes(req, res, 'Error subadmin not exists');
    } else {
         return apiErrorRes(req, res, 'Error to update sub admin !');
    }
}

async function saveStatus(req, res) {  
    let {
        id
    } = req.body;

    const schema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        id: Joi.number().required()
    });
    try {
        await schema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }
    let reqdaa = {
        id
    };

    let datafromService = await subAdminService.saveStatus(reqdaa);

    if (datafromService.statusCode === CONSTANTS.SUCCESS) {
        let subAdminDetails  = await subAdminService.getSubAdminUserById(id);

        global._loggedInToken.forEach(async (element, index) => {
            if(element.user_name == subAdminDetails.data.user_name)
            {
                global._loggedInToken.splice(index, 1);
            }
        });
         return apiSuccessRes(req, res, 'Sub admin updated successfully');
    } else {
         return apiErrorRes(req, res, 'Error to update sub admin !');
    }
}

async function findById(req, res) {
    let {id}=req.body;
    const subAdminSchema = Joi.object({
        userid: Joi.number().required(),
        parent_ids: Joi.optional().required(),
        id: Joi.number().required(),
    });

    try {
        await subAdminSchema.validate(req.body, {
            abortEarly: true
        });
    } catch (error) {
        return apiErrorRes(req, res, error.details[0].message);
    }

    let parents =req.body.parent_ids;

    let datafromService = await subAdminService.findById(id);
    if (datafromService.statusCode===CONSTANTS.SUCCESS) {
        return apiSuccessRes(req, res, 'Success',datafromService.data);
    } else {
        return apiSuccessRes(req, res, 'not found.');
    }
}

router.post('/subAdmin/save', save);
router.get('/subAdmin/list', list);
router.post('/subAdmin/update', update);
router.post('/subAdmin/delete', subAdminDelete);
router.post('/subAdmin/saveStatus', saveStatus);
router.post('/subAdmin/findById', findById);
module.exports = router;
