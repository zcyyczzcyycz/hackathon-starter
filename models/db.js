const mysql = require('mysql2/promise');
const dbConfig = require("../config/mysql.js");

// const connection = mysql.createPool({
//   host: dbConfig.HOST,
//   user: dbConfig.USER,
//   password: dbConfig.PASSWORD,
//   database: dbConfig.DB
// });
const connection = mysql.createPool({
  host: 'localhost',
  user: 'zcy',
  password: '123456',
  database: 'test',
  port:3306
});

// 通过query使用sql语句
(async () => {
  try {
  const [results, fields] = await connection.execute(
    'SELECT * FROM game'
  );
  console.log(results); // results contains rows returned by server
  console.log(fields); // fields contains extra meta data about results, if available
  connection.end()
} catch (err) {
  console.log(err);
}
})();





module.exports = connection;