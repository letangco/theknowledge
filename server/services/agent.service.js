import Slug from 'slug';
import { ERR_CODE } from '../../config/globalConstants';
import AgentModel from '../models/agentInfo';
import NewsModel from '../models/newsAgent';
import { v4 as uuidv4 } from 'uuid';
import { updateUrlImage, getUrlImage } from '../virtual_agent/file';
import configs from '../config';

/**
 * 
 * @param {*} body 
 * @param {*} user 
 * @returns {}
 */
export async function createNewsByAgent(body, user) {
    try {
        const agent = await AgentModel.findOne({ _id: user._id, role: user.role });
        if (!agent) return Promise.reject({status:404, success:false, err: ERR_CODE.AGENT_NOT_FOUND});
        let slug = Slug(body?.title, '-');
        const hasSlug = await NewsModel.findOne({ slug });
        if (hasSlug) slug = slug + '-' + uuidv4();
        let data = {
            userAgent: agent._id,
            title: body.title,
            priority: body.priority || false,
            sort: body?.sort || 1,
            banner: body?.banner ? updateUrlImage(body?.banner, configs.domainHttpHost) : '',
            slug,
            content: body.content,
            authorName: body?.authorName ? body.authorName : agent.fullName,
            authorRole: user.role,
            status: body?.status || true,
            shortDescription: body.shortDescription
        };
        return await NewsModel.create(data);
    } catch (error) {
        console.log('error createUser : ', error);
        return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
};

/**
 * 
 * @param {*} user 
 * @param {*} options 
 * @returns 
 */
export async function getListNewsAgent(user, options) {
    try {
        const conditionAll = {};
        // sort
        let sort;
        if (!options.sort) {
            sort = { sort: 'asc' };
        } else {
            switch (options.sort.toString()) {
                case 'index_asc':
                    sort = { sort: 'asc' };
                    break;
                case 'index_desc':
                    sort = { sort: 'desc' };
                    break;
                case 'name_asc': 
                    sort = { title: 'asc' };
                    break;
                case 'name_desc':
                    sort = { title: 'desc' };
                    break;
                case 'created_asc':
                    sort = { createdAt: 'asc' };
                    break;
                case 'created_desc':
                    sort = { createdAt: 'desc' };
                    break;
                default:
                    return Promise.reject({ status: 400, success: false, error: ERR_CODE.TYPE_SORT_INVALID });
            }
        }
        // search keyword
        let keyword;
        if (options?.keyword) {
            keyword = Slug(options?.keyword, ' ');
        } else keyword = '';
        const conditionSearchs = [];
        // search
        if (keyword) {
            conditionSearchs.push(
                { searchString: { $regex: keyword, $options: 'i' } },
            );
        } else {
            conditionSearchs.push(
                { searchString: { $regex: '', $options: 'i' } },
            );
        }
        conditionAll.['$or'] = conditionSearchs;
        // filter deactive/active
        switch (options.status) {
            case 'true':
            case 'false':
                conditionAll.status = options.status;
                break;
            case '':
            case undefined:
                break;
            default:
                return Promise.reject({ status: 400, success: false, error: ERR_CODE.STATUS_INVALID });
        }
        conditionAll.userAgent = user?._id;
        conditionAll.authorRole = user?.role;
        const news = await Promise.all([
            NewsModel
            .find(conditionAll, '-__v -userAgent -authorRole')
            .sort(sort)
            .skip(options.skip)
            .limit(options.limit),
            NewsModel.count(conditionAll)
        ]);
        const payload = news[0].map((item) => {
            item?.banner ? item.banner = getUrlImage(configs.domainHttpHost, item.banner) : '';
            return item;
        })
        return [news[1], payload];
    } catch (error) {
        console.log('error get list news agent: ', error);
        return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
}

/**
 * 
 * @param {*} user 
 * @param {*} id 
 * @returns 
 */
export async function deleteNewByAgent(user, id) {
    try {
        const news = await NewsModel.findOne({ _id: id, userAgent: user._id, authorRole: user.role });
        if (!news) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
        if (news.priority === true) return Promise.reject({ status: 404, success: false, error: ERR_CODE.NEWS_IS_PRIORITY });
        await news.remove();
        return true;
    } catch (error) {
        console.log('error delete news agent: ', error);
        return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
}
/**
 * 
 * @param {*} user 
 * @param {*} id 
 * @param {*} data 
 * @returns 
 */
export async function updateNewsByAgentService(user, id, data) {
    try {
        const newsAgent = await NewsModel.findOne({ _id: id, userAgent: user._id, authorRole: user.role });
        if (!newsAgent) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
        delete data?.authorRole;
        delete data?.userAgent;
        let slug;
        if (data.title === newsAgent.title) {
            delete data.slug;
            delete data.title;
        } else {
            slug = Slug(data.title, '-');
            data.searchString = slug;
            const hasSlug = await NewsModel.findOne({ slug: slug });
            if (hasSlug) {
                data.slug = slug + '-' + uuidv4();
            } else {
                data.slug = slug;
            }
        }
        if (data?.priority) {
            delete data.priority;
        }
        if (data?.banner) {
            data.banner = updateUrlImage(data.banner, configs.domainHttpHost);
        }
        Object.keys(data)
            .forEach((key) => {
                newsAgent[key] = data[key];
            });
        await newsAgent.save();
        return true;
    } catch (error) {
        console.log('err update news agent: ', error);
        return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
}

export async function getDetailNewsByAgent(user, id) {
    try {
        const newsAgent = await NewsModel.findOne({ _id: id, userAgent: user._id, authorRole: user.role }, '-__v -authorRole -userAgent');
        if (!newsAgent) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
        const result = newsAgent.toJSON();
        result?.banner ? result.banner = getUrlImage(configs.domainHttpHost, newsAgent?.banner) : result.banner = '';
        return result;
    } catch (error) {
        console.log('err get detail news agent: ', error);
        return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
}

export async function updateStatusNewsByAgent(user, id) {
    try {
        const newsAgent = await NewsModel.findOne({ _id: id, userAgent: user._id, authorRole: user.role }, '-__v -authorRole -userAgent');
        if (!newsAgent) return Promise.reject({ status: 404, success: false, error: ERR_CODE.ERR_NOT_FOUND });
        // if (newsAgent.priority === true) {
        //     return Promise.reject({ status: 404, success: false, error: ERR_CODE.NEWS_IS_PRIORITY });
        // }
        newsAgent.status = !newsAgent.status;
        await newsAgent.save();
        return true;
    } catch (error) {
        console.log('update status news agent: ', error);
        return Promise.reject({status:500, success: false, error:'Internal Server Error.'});
    }
}