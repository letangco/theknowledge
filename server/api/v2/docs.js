import swaggerJSDoc from 'swagger-jsdoc';
import { API_DOCS_HOST } from '../../config';

const swaggerDefinition = {
  info: {
    title: 'Tesse API Docs',
    version: '2.0.0',
    description: 'Tesse API Docs',
  },
  host: API_DOCS_HOST,
  basePath: '/v2',
  produces: ['application/json'],
  consumes: ['application/json'],
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'token',
      in: 'header',
    },
  },
  security: [{ jwt: [] }],
};

const options = {
  swaggerDefinition,
  apis: [
    'server/api/validatorErrorHandler.js',
    'server/components/**/*.model.js',
    'server/components/**/*.route.js',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;

