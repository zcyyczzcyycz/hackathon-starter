const logger = require('morgan');
const Bowser = require('bowser');
const fs = require('fs');
const path = require('path');

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

// 根据 HTTP 状态码显示不同颜色
logger.token('colored-status', (req, res) => {
  const status = res.statusCode;
  let color;
  if (status >= 500) color = colors.red;
  else if (status >= 400) color = colors.yellow;
  else if (status >= 300) color = colors.cyan;
  else color = colors.green;

  return color + status + colors.reset;
});

// 生成无时区偏移的标准化时间戳
logger.token('short-date', () => {
  const now = new Date();
  return now.toLocaleString('sv').replace(',', '');
});

// 解析客户端 User-Agent，返回「操作系统 / 浏览器 版本」（如 Windows/Chrome v120）
logger.token('parsed-user-agent', (req) => {
  const userAgent = req.headers['user-agent'];
  if (!userAgent) return 'Unknown';
  const parsedUA = Bowser.parse(userAgent);
  const osName = parsedUA.os.name || 'Unknown';
  const browserName = parsedUA.browser.name || 'Unknown';

  // Get major version number
  const version = parsedUA.browser.version || '';
  const majorVersion = version.split('.')[0];

  return `${osName}/${browserName} v${majorVersion}`;
});

// 计算响应数据大小，格式化显示为 xx.xxKB
logger.token('bytes-sent', (req, res) => {
  // Check for original uncompressed size first
  let length =
    res.getHeader('X-Original-Content-Length') || // Some compression middlewares add this
    res.get('x-content-length') || // Alternative header
    res.getHeader('Content-Length');

  // For static files
  if (!length && res.locals && res.locals.stat) {
    length = res.locals.stat.size;
  }

  // For response bodies (API responses)
  if (!length && res._contentLength) {
    length = res._contentLength;
  }

  // If we found a length, format it
  if (length && Number.isNaN(Number(length)) === false) {
    return `${(parseInt(length, 10) / 1024).toFixed(2)}KB`;
  }

  // For chunked responses
  const transferEncoding = res.getHeader('Transfer-Encoding');
  if (transferEncoding === 'chunked') {
    return 'chunked';
  }

  return '-';
});

// 服务器是否把响应完整地传给了客户端
logger.token('transfer-state', (req, res) => {
  if (!res._header) return 'NO_RESPONSE'; // 完全没响应
  if (res.finished) return 'COMPLETE'; // 响应完成
  return 'PARTIAL'; // 部分响应
});

// 更加tokens生成自定义日志
const getMorganFormat = () =>
  process.env.NODE_ENV === 'production' ? ':short-date :method :url :colored-status :response-time[0]ms :bytes-sent :transfer-state - :parsed-user-agent' : '[:short-date]  :method  :url  :status (:response-time[0]ms) | Size::bytes-sent :transfer-state | IP::remote-addr | Client::parsed-user-agent';

// 现在morganFormat保存格式化字符串，可以传入mogan方法
const morganFormat = getMorganFormat();

// 用于 ‌动态捕获并记录 HTTP 响应内容的大小,将总长度保存在 res._contentLength 属性
const captureContentLength = (req, res, next) => {
  const originalWrite = res.write;
  const originalEnd = res.end;
  let length = 0;

  res.write = (...args) => {
    const [chunk] = args;
    if (chunk) {
      length += chunk.length;
    }
    return originalWrite.apply(res, args);
  };

  res.end = (...args) => {
    const [chunk] = args;
    if (chunk) {
      length += chunk.length;
    }
    if (length > 0) {
      res._contentLength = length;
    }
    return originalEnd.apply(res, args);
  };

  next();
};

// 定义两个独立的写入流
const stdoutStream = fs.createWriteStream(
  path.join(process.cwd(), 'logs/out.log'),
  { flags: 'a' }, // 追加模式
);
const stderrStream = fs.createWriteStream(path.join(process.cwd(), 'logs/error.log'), { flags: 'a' });

exports.morganLogger = () => (req, res, next) => {
  captureContentLength(req, res, () => {
    logger(morganFormat, {
      immediate: false,
      stream: {
        write: (log) => {
          const targetStream = res.statusCode < 400 ? stdoutStream : stderrStream;
          targetStream.write(log);
        },
      },
    })(req, res, next);
  });
};

fs.watchFile(path.join(process.cwd(), 'logs/out.log'), (curr) => {
  if (curr.size > 1024 * 1024) fs.writeFileSync(path.join(process.cwd(), 'logs/out.log'), ''); // 1MB阈值^[6]
});
fs.watchFile(path.join(process.cwd(), 'logs/error.log'), (curr) => {
  if (curr.size > 1024 * 1024) fs.writeFileSync(path.join(process.cwd(), 'logs/error.log'), ''); // 1MB阈值^[6]
});

// Expose for testing
exports._getMorganFormat = getMorganFormat;
