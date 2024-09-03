import { Sequelize } from 'sequelize';
import pg from 'pg';

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    connectTimeout: 60000, // 60 seconds timeout for connecting
  },
});
