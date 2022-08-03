import slug from "slug";
import TagAgentModel from '../models/agentTags';
import globalConstants, { ERR_CODE } from '../../config/globalConstants';

export async function getListTagAgentService(options, role) {
    try {
        const conditionAll = {};
        if (options.keyword) {
            conditionAll.tagName = { $regex: slug(options.keyword, ' '), $options:'$i' };
        }
        if (role) {
            switch (role) {
                case globalConstants.role.AGENT:
                    conditionAll.type = globalConstants.role.AGENT;
                    break;
                case globalConstants.role.UNIVERSITY:
                    conditionAll.type = globalConstants.role.UNIVERSITY;
                    break;
                default:
                    return Promise.reject({status:400 , success:false , err: ERR_CODE.ROLE_INVALID});
            }
        }
        const result = await TagAgentModel.find(conditionAll).sort({ sort: 1, tagName: 'asc' });
        return result;
    } catch (error) {
        return Promise.reject({status:500 , success:false , err:"Internal Server Error."});
    }
}

export async function getDetailTagAgentService(id) {
    try {
        const tag = await TagAgentModel.findOne({ _id: id }, '-__v -updatedAt');
        if (!tag) return Promise.reject({status:404 , success:false , err: ERR_CODE.ERR_NOT_FOUND});
        return tag;
    } catch (error) {
        return Promise.reject({status:500 , success:false , err:"Internal Server Error."});
    }
}