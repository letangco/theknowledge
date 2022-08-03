import { Router } from 'express';
import * as CountryController from '../controllers/country.controller.js';
import * as AgentValidator from '../virtual_agent/validator/agent.validator';
const router = new Router();

router.route('/country/get-countries').get(CountryController.getCountries);
router.route('/country/get-country/:cuid').get(CountryController.getCountry);
router.route('/country/get-countries-expert').get(CountryController.getCountriesExpert);
router.route('/country/import').post(CountryController.importCountries);

// get state by country
router.route('/country/get-states/:id')
    .get(
        AgentValidator.getById,
        CountryController.getListStateByCountry
    );

export default router;
