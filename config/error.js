// 自定义API错误类示例
class ApiError extends Error {
  constructor(message, statusCode = 400, errorCode) {
    super(message);
    this.statusCode = statusCode; // 请求状态码
    this.errorCode = errorCode; // 应用内部错误码
    this.isOperational = true; // 标记为可预期错误（区分业务异常 / 系统异常）
    Error.captureStackTrace(this, this.constructor);
  }
}

// next(new ApiError('用户不存在', 404, 10003));

// 继承 ApiError，实现更细分的错误类型
class ParameterError extends ApiError {
  constructor(message, errorCode = 10000) {
    // 固定 HTTP 400 状态码，语义化表示「参数错误」
    super(message, 400, errorCode);
    this.name = 'ParameterError'; // 自定义错误名称，方便日志排查
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = '未认证，请先登录', errorCode = 20000) {
    // 固定 HTTP 401 状态码，语义化表示「未认证/令牌失效」
    super(message, 401, errorCode);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends ApiError {
  constructor(message = '无权限访问', errorCode = 30000) {
    // 固定 HTTP 403 状态码，语义化表示「禁止访问」
    super(message, 403, errorCode);
    this.name = 'ForbiddenError';
  }
}
