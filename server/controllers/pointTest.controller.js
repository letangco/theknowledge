import { commonGetQuery } from '../virtual_agent/query';
import * as PointTestService from '../services/pointTest.services';
export async function getListQuestionPointTest(req, res) {
    try {
        const query = commonGetQuery(req);
        const payload = await PointTestService.getListQuestionPointTestService(query);
        return res.RH.paging(payload, query.page, query.limit);
    } catch (error) {
        console.log('edit question point test: ', error);
        return res.status(error.status || 500).json(error);
    }
}
