import { Router } from 'express';
import * as AgentTagController from '../controllers/agenttag.controller';
import * as AgentTagValidator from '../virtual_agent/validator/tag.validator';

const router = new Router();

router.route('/tags/agents/:role')
    .get(
        AgentTagValidator.filterRoleTag,
        AgentTagController.getListTagAgent
    );

router.route('/tags/agents/detail/:id')
    .get(
        AgentTagValidator.getById,
        AgentTagController.getDetailTagAgent
    );

export default router;