import UserModel from '../models/user';
import AgentModel from '../models/agentInfo';
import { ERR_CODE } from '../../config/globalConstants';
import cuid from 'cuid';
import globalConstants from '../../config/globalConstants';
import sanitizeHtml from 'sanitize-html';
import { STATUS_AGENT } from '../constants';
import jwt from '../libs/jwToken';
import * as AgentService from '../services/agent.service';
import { commonGetQuery } from '../virtual_agent/query';
import CountryModel from '../models/country';
import StateModel from '../models/state';
import TagsAgent from '../models/agentTags';
import { hash, validate, generatePassword } from '../models/functions.js';
import { buildSlugUserName } from '../services/course.services';
import StringHelper from '../util/StringHelper';
import { Q } from '../libs/Queue';
import UserUseInviteCode from '../models/userUseInviteCode';

export async function registryUserAgentPage(req, res) {
    const newUser = new UserModel();
    var tokenActive = generatePassword(45);
    newUser.firstName = sanitizeHtml(req.body.user.firstName);
    newUser.lastName = sanitizeHtml(req.body.user.lastName);
    newUser.fullName = req.body.user.firstName + ' ' + req.body.user.lastName;
    newUser.userName = await buildSlugUserName(newUser.fullName);
    newUser.password = hash(sanitizeHtml(req.body.user.password));
    newUser.email = sanitizeHtml(req.body.user.email.toLowerCase());
    newUser.telephone = sanitizeHtml(req.body.user.telephone);
    newUser.expert = req.body.user.type && req.body.user.type === 'tutor' ? 1 : 0;
    newUser.tokenActive = tokenActive;
    newUser.point = {};
    newUser.cuid = cuid();
    let count = await UserModel.count({});
    newUser.code = StringHelper.generalCodeUser(count + 1);
    let user = await UserModel.findOne({ email: newUser.email }).lean();
    if (user) {
        return res.status(400).json({ success: false, err: "Email da ton tai!" });
    }
    newUser.save(async (err, saved) => {
        if (err) {
        res.status(500).send(err);
        }
        var dataSendMail = {
        type: 'registryAccountAgentPage', // type sendEmail
        language: req.headers.lang,
        data: {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            cuid: newUser.cuid,
            token: tokenActive,
            type: req.body.user.type
        }
        };
        Q.create(globalConstants.jobName.SEND_MAIL, dataSendMail).removeOnComplete(true).save();

        if (req.body.ref) {
        await UserUseInviteCode.create({
            user: saved._id,
            code: req.body.ref
        });
        }
        // if(req.body.refTask){
        //   await addTaskReferral(saved, req.body.refTask)
        // }
        // sendMail(dataSendMail);
        res.json({ result: 1 });
    });
}

export async function userRegisterAgent(req, res) {
    try {
        const { user } = req;
        const { body } = req;
        const hasUser = await UserModel.findOne({ _id: user._id, role: user.role });
        if (!hasUser) return res.status(400).json({
            success: false,
            err: "User khong ton tai!",
            err_code: ERR_CODE.USER_NOT_FOUND
        });
        if (!hasUser?.active || hasUser?.active !== 1) {
            return res.status(401).json({
                success: false,
                err: "User chưa được kích hoạt!",
                err_code: ERR_CODE.USER_IS_UNACTIVE
            });
        }
        // validatate account before register
        const hasAgent = await Promise.all([
            AgentModel.findOne({ user: user._id }),
            // AgentModel.findOne({ email: hasUser.email })
        ]);
        if (hasAgent[0]) return res.status(400).json({
            success: false,
            err: "User đã được đăng kí bởi agent!",
            err_code: ERR_CODE.USER_HAS_REGISTER_TO_AGENT
        });
        // if (hasAgent[1]) {
        //     return res.status(400).json({
        //         success: false,
        //         err: "Email đã được sử dụng!",
        //         err_code: ERR_CODE.EMAIL_HAS_BEEN_USED
        //     });
        // }
        const promiseCountry = await Promise.all([
            CountryModel.findOne({ _id: body.country }),
            StateModel.findOne({ _id: body.state })
        ]);
        if (!promiseCountry[0]) return res.status(404).json({
            success: false,
            err: "Country không chính xác!",
            err_code: ERR_CODE.COUNTRY_INVALID
        });
        if (!promiseCountry[1] || promiseCountry[1].countryId.toString() !== promiseCountry[0]._id.toString()) return res.status(404).json({
            success: false,
            err: "State không chính xác!",
            err_code: ERR_CODE.STATE_INVALID
        });
        const arrTags = [];
        const hasTag = body.tags.map(async (tag) => {
            const t = await TagsAgent.findOne({ _id: tag, type: body.role });
            if (t) {
                arrTags.push(tag);
                return tag;
            }
        });
        await Promise.all(hasTag)
        const agent = {
            user: hasUser._id,
            cuid: cuid(),
            email: body?.email,
            role: body?.role,
            telephone: body?.telephone,
            organization: body?.organization,
            ABNNumber: body.ABNNumber,
            address: body.address,
            tags: arrTags.filter((item, index) => arrTags.indexOf(item) === index),
            country: body.country,
            state: body.state
        };
        // validator role register
        const arrRole = [globalConstants.role.AGENT, globalConstants.role.UNIVERSITY];
        if (!arrRole.includes(body.role.toString())) {
            return res.status(400).json({
                success: false,
                err: "Role không chính xác!",
                err_code: ERR_CODE.ROLE_INVALID
            });
        } else {
            if (body.role === globalConstants.role.AGENT) {
                if (!body?.MARANumber) {
                    return res.status(400).json({
                        success: false,
                        error: [
                            {
                                msg: 'Invalid value',
                                params: 'MARANumber',
                                location: 'body'
                            }
                        ]
                    });
                } else {
                    agent.MARANumber = body.MARANumber;
                }
            }
            if (body.role === globalConstants.role.UNIVERSITY) {
                if (!body?.CIRCONumber) {
                    return res.status(400).json({
                        success: false,
                        error: [
                            {
                                msg: 'Invalid value',
                                params: 'CIRCONumber',
                                location: 'body'
                            }
                        ]
                    });
                } else {
                    agent.CIRCONumber = body.CIRCONumber;
                }
            }
        }
        await AgentModel.create(agent);
        return res.status(200).json({
            success: true,
            payload: agent
        });
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function AgentLogin(req, res) {
    try {
        var email = req.body.email.toLowerCase();
        var password = req.body.password;
        console.log(email, password);
        let agent = await AgentModel.findOne({ email: email }, '-__v -user');
        if (!agent) return res.status(404).json({
            success: false,
            err: "Không tìm thấy người dùng này!",
            err_code: ERR_CODE.USER_NOT_FOUND
        });
        if (agent.status !== 1) return res.status(401).json({
            success: false,
            err: "Không đủ quyền để truy cập vào tài khoản!",
            err_code: ERR_CODE.UNAUTHORIZE
        })
        agent = agent.toJSON();
        if (validate(agent.password, password)) {
            agent.bearerToken = jwt.issue({ _id: agent._id.toString() })
        } else {
            return res.json({
                success: false,
                err: "Tài khoản hoặc mật khẩu không đúng!"
            });
        }
        delete agent.password;
        return res.status(200).json({
            success: true,
            payload: agent
        });
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function getInfoAgentByToken(req, res) {
    try {
        const { user } = req;
        let agent = await AgentModel.findOne({ _id: user._id, role: user.role });
        agent = agent.toJSON();
        delete agent.password;
        delete agent.__v;
        return res.status(200).json({
            success: true,
            payload: agent
        });
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function createNews(req, res) {
    try {
        const { user, body } = req;
        const payload = await AgentService.createNewsByAgent(body, user);
        return res.json({
            success: true,
            data: payload
          });
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function getListNewsAgent(req, res) {
    try {
        const query = commonGetQuery(req);
        const { user } = req;
        const payload = await AgentService.getListNewsAgent(user, query);
        return res.RH.paging(payload, query.page, query.limit);
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function deleteNewByAgent(req, res) {
    try {
        const { id } = req.params;
        const { user } = req;
        const payload = await AgentService.deleteNewByAgent(user, id);
        return res.RH.success(payload);
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function updateNewsByAgent(req, res) {
    try {
        const { id } = req.params;
        const { user , body} = req;
        const payload = await AgentService.updateNewsByAgentService(user, id, body);
        return res.RH.success(payload);
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function getDetailNewsByAgent(req, res) {
    try {
        const { id } = req.params;
        const { user } = req;
        const payload = await AgentService.getDetailNewsByAgent(user, id);
        return res.RH.success(payload);
    } catch (error) {
        return res.status(500).send(error);
    }
}

export async function updateStatusNewsByAgent(req, res) {
    try {
        const { id } = req.params;
        const { user } = req;
        const payload = await AgentService.updateStatusNewsByAgent(user, id);
        return res.RH.success(payload);
    } catch (error) {
        return res.status(500).send(error);
    }
}