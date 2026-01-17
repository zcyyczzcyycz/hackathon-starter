const express = require('express');
const router = express.Router();
const { getToken } = require('../controllers/auth');

// 定义模块内路由
router.post('/getToken', getToken);

router.post('/', (req, res) => {
  res.success('post');
});

module.exports = router; // 导出路由实例
