const path = require('path');
const multer = require('multer');

//获取绝对路径
let fullPath = path.resolve(process.cwd() + '/public/upload');

//设置文件的名称
let filename = '';

let storage = multer.diskStorage({
  //设置存储路径
  destination: (req, file, cb) => {
    cb(null, fullPath);
  },
  //设置存储的文件名
  filename: (req, file, cb) => {
    filename = file.originalname;
    cb(null, filename);
  },
});
exports.upload = multer({ storage });

exports.errorHandler = (err, req, res, next) => {
  // 局部错误捕获回调（必须4个参数，Express 识别为错误处理中间件）
  // 区分 multer 内置错误和自定义错误
  let errorMsg = '文件上传失败';
  let errorCode = 400;

  // 处理 multer 内置标准错误（MulterError）
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        errorMsg = '文件过大，最大支持 5MB';
        break;
      case 'NO_FILE':
        errorMsg = '请选择要上传的文件';
        break;
      default:
        errorMsg = err.message;
    }
  } else if (err) {
    // 处理自定义错误（如 fileFilter 中抛出的错误）
    errorMsg = err.message;
  }
  next(err);
};
