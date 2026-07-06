import swaggerJsdoc from 'swagger-jsdoc';

export const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'SnapRules API', version: '1.0.0' }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
