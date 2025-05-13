module.exports = {
    apps: [
      {
      name: 'app',          // 应用唯一标识
      script: 'app.js',     // 生产环境入口文件
      args: '--optimize',          // 启动参数（如性能优化标志）
      // instances: 'max',            // 根据 CPU 核数启动集群模式
      // exec_mode: 'cluster',        // 集群模式提升并发性能 
      autorestart: true,           // 崩溃后自动重启
      watch: true,                // 生产环境禁用文件监听
      max_memory_restart: '2G',    // 内存超限自动重启
      merge_logs: true,            // 集群日志合并
      // error_file: './logs/error.log',  // 统一错误日志路径
      // out_file: './logs/out.log',      // 标准输出日志路径
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',  // 日志时间戳格式
      env: {                       // 全局环境变量（开发默认）pm2 start 不带参数
        NODE_ENV: 'development',
        DEBUG: 'app:*'
      },
      env_production: {            // 生产环境启动 (pm2 start --env production)
        NODE_ENV: 'production',
        PORT: 8080,
        DATABASE_URL: 'prod_mongodb://user:pass@cluster:27017/db'
      }
    }],
    deploy: {                      // 多服务器部署配置
      production: {
        user: 'deploy-user',       // SSH 用户
        host: ['server1.com', 'server2.com'],  // 服务器 IP 或域名
        ref: 'origin/main',        // Git 分支
        repo: 'git@github.com:user/repo.git',   // 代码仓库地址
        path: '/var/www/prod',     // 服务器部署路径
        'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',  // 部署后钩子
        env: {
          NODE_ENV: 'production'   // 覆盖部署时的环境变量
        }
      }
    }
  };
  