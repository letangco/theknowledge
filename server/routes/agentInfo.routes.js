import { Router } from 'express';
import isAdmin from '../libs/Auth/isAdmin';
import { isUser, isAgent } from '../virtual_agent/auth/jwt';
import * as AgentController from '../controllers/agent.controller';
import * as AgentValidator from '../virtual_agent/validator/agent.validator';

const router = new Router();

// user sign up from virtual agent page
router.route('/registry/agent-page')
    .post(
        AgentController.registryUserAgentPage
    );

router.route('/agents/register')
    .post(
        isUser.auth(),
        AgentValidator.userRegisterAgent,
        AgentController.userRegisterAgent
    );

router.route('/agents/login')
    .post(
        AgentValidator.loginAgent,
        AgentController.AgentLogin
    );

router.route('/agents/get-by-token')
    .get(
        isAgent.auth(),
        AgentController.getInfoAgentByToken
    );

router.route('/agents/news')
    .post(
        isAgent.auth(),
        AgentValidator.createNewsAgent,
        AgentController.createNews
    )
    .get(
        isAgent.auth(),
        AgentController.getListNewsAgent
    );

router.route('/agents/news/:id')
    .delete(
        isAgent.auth(),
        AgentValidator.deleteNewsAgentByAuthor,
        AgentController.deleteNewByAgent
    )
    .put(
        isAgent.auth(),
        AgentValidator.updateNewsAgentByAuthor,
        AgentController.updateNewsByAgent
    )
    .get(
        isAgent.auth(),
        AgentValidator.deleteNewsAgentByAuthor,
        AgentController.getDetailNewsByAgent
    );

router.route('/agents/news/change-status/:id')
    .put(
        isAgent.auth(),
        AgentValidator.updateStatusNewsAgentByAuthor,
        AgentController.updateStatusNewsByAgent
    )
export default router;

