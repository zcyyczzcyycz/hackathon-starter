const CHARSET = 'utf8';
const COLLATE = 'utf8_general_ci';

module.exports = {
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST ?? 'localhost',
  port: process.env.DB_PORT ?? '3306',
  dialect: process.env.DB_DIALECT ?? 'mysql', // or: 'postgres'
  connectTimeout: process.env.DB_TIMEOUT,

  pool: {
    max: 10, // 最大连接
    min: 0,
    idleTimeout: 10000,
  },
  charset: CHARSET,
  collate: COLLATE,
  timestamps: true,
  logging: false,
};
