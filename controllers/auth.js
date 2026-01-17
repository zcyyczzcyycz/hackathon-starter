const jwt = require('jsonwebtoken');

exports.getToken = (req, res, next) => {
  const { id } = req.body;
  const token = 'Bearer ' + jwt.sign({ id }, process.env.TOKEN_SECRET, { expiresIn: 60, algorithm: 'HS256' }); //在token前添加字符串【'Bearer  '】注意有个空格
  res.success(token);
};
