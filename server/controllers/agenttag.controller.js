import { commonGetQuery } from "../virtual_agent/query";
import * as TagAgentService from '../services/agenttag.services';

export async function getListTagAgent (req, res) {
    try {
        const query = commonGetQuery(req);
        const { role } = req.params;
        const payload = await TagAgentService.getListTagAgentService(query, role);
        return res.RH.success(payload);
    } catch (error) {
        console.log('Error on get List tag agent: ', error);
        return res.status(error.status || 500).send(error);
    }
}

export async function getDetailTagAgent (req, res) {
    try {
        const { id } = req.params;
        const tag = await TagAgentService.getDetailTagAgentService(id);
        return res.RH.success(tag);
    } catch (error) {
        console.log('Err on get detail tag agent: ', error);
        return res.status(error.status || 500).send(error);
    }
}
