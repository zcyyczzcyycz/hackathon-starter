const fs = require('node:fs');
const path = require('node:path');
// const child_process = require('node:child_process')

// 自动扫描 src 目录下的子文件夹名称作为「作用域」候选（例如 src/apis 生成作用域 api）
const scopes = fs
  .readdirSync(path.resolve(__dirname), {
    withFileTypes: true,
  })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name.replace(/s$/, '')); // 移除目录名末尾的 s（如 apis -> api）

// 通过 git 状态自动推断当前修改的作用域（例如修改了 src/views/home 则作用域为 view）
// const scopeComplete = execSync('git status --porcelain || true')
//   .toString()
//   .trim()
//   .split('\n')
//   .find((r) => ~r.indexOf('M src')) // 查找修改过的 src 目录下的文件
//   ?
//   .replace(/(\/)/g, '%%') // 路径斜杠替换为 %%（如 src/views -> src%%views）
//   ?
//   .match(/src%%((\w|-)*)/) ? . [1] // 提取作用域部分（如 views）
//   ?
//   .replace(/s$/, '') // 移除末尾的 s

module.exports = {
  // 忽略包含 init 的提交（如不校验 git commit -m "init"）
  ignores: [(commit) => commit.includes('init')],

  // 继承社区标准配置 @commitlint/config-conventional
  extends: ['@commitlint/config-conventional'],

  // 自定义规则
  rules: {
    'body-leading-blank': [2, 'always'], // body 前必须空一行
    'footer-leading-blank': [1, 'always'], // footer 前必须空一行
    'header-max-length': [2, 'always', 108], // 标题最多 108 字符
    'subject-empty': [2, 'never'], // 标题描述不能为空
    'type-empty': [2, 'never'], // 提交类型不能为空
    'subject-case': [0], // 不限制标题大小写（如允许 Fix、fix）

    // 允许的提交类型列表（如 feat/fix/docs...）
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // Bug 修复
        'perf', // 性能优化
        'style', // 代码格式
        'docs', // 文档变更
        'test', // 测试相关
        'refactor', // 代码重构
        'build', // 构建流程变更
        'ci', // CI 配置变更
        'chore', // 其他杂项
        'revert', // 回滚提交
        'wip', // 开发中提交（Work in Progress）
        'workflow', // 工作流改进
        'types', // 类型定义变更
      ],
    ],
  },
  prompt: {
    // 快捷命令别名（如 pnpm commit :f 等价于 git commit -m "docs: fix typos"） :f 作为参数传递给工具
    alias: {
      f: 'docs: fix typos',
      r: 'docs: update README',
      s: 'style: update code format',
      b: 'build: bump dependencies',
      c: 'chore: update config',
    },

    // 作用域选择交互配置
    customScopesAlign: 'bottom', // 作用域列表位置，git commit 时，交互式命令行工具会弹出此列表，帮助开发者快速选择符合规范的作用
    defaultScope: true, // 如果你修改的是 src/views/home 目录下的文件,提交时会自动填写 home 作为作用域（不需要手动输入）
    scopes: [...scopes, 'mock'], // 候选作用域（src 目录下的文件夹 + mock手动扩展的作用域，通常对应项目中自定义的 src/mock 目录）

    // 是否允许自定义 Issue 前缀（比如 fix #123: xxx）。
    allowEmptyIssuePrefixs: false, // 禁止不写 Issue 前缀（如必须写 `#123`）
    allowCustomIssuePrefixs: false, // 禁止自定义 Issue 前缀（只能用预设的）

    // 扩展类型types
    typesAppend: [],

    // 定义czg交互式提交时每一步的「提问文案」必须通过特定命令（czg）触发交互流程
    messages: {
      // 控制着每一步交互的提示语
      type: '选择你要提交的类型 :',
      scope: '选择一个提交范围 (可选):',
      customScope: '请输入自定义的提交范围 :',
      subject: '填写简短精炼的变更描述 :\n',
      body: '填写更加详细的变更描述 (可选)。使用 "|" 换行 :\n',
      breaking: '列举非兼容性重大的变更 (可选)。使用 "|" 换行 :\n',
      footerPrefixsSelect: '选择关联issue前缀 (可选):',
      customFooterPrefixs: '输入自定义issue前缀 :',
      footer: '列举关联issue (可选) 例如: #31, #I3244 :\n',
      confirmCommit: '是否提交或修改commit ?',
    },
    // 规定允许的 commit 类型（类似选择题的选项）
    types: [
      {
        value: 'feat',
        name: 'feat: 新增功能',
        emoji: '✨',
        subject: '新增功能', // 新增：默认简短描述
      },
      {
        value: 'fix',
        name: 'fix: 修复缺陷',
        emoji: '🐛',
        subject: '修复缺陷', // 新增
      },
      {
        value: 'docs',
        name: 'docs: 文档变更',
        emoji: '📚',
        subject: '文档变更', // 新增
      },
      {
        value: 'style',
        name: 'style: 代码格式',
        emoji: '🎨',
        subject: '代码格式调整', // 新增
      },
      {
        value: 'refactor',
        name: 'refactor: 代码重构',
        emoji: '♻️',
        subject: '代码重构', // 新增：你需要的 refactor 默认描述
      },
      {
        value: 'perf',
        name: 'perf: 性能优化',
        emoji: '⚡',
        subject: '性能优化', // 新增
      },
      {
        value: 'test',
        name: 'test: 添加疏漏测试或已有测试改动',
        emoji: '✅',
        subject: '测试用例修改', // 新增
      },
      {
        value: 'build',
        name: 'build: 构建流程、外部依赖变更',
        emoji: '🏗️',
        subject: '构建流程变更', // 新增
      },
      {
        value: 'ci',
        name: 'ci: 修改 CI 配置、脚本',
        emoji: '🤖',
        subject: 'CI 配置修改', // 新增
      },
      {
        value: 'revert',
        name: 'revert: 回滚 commit',
        emoji: '⏪',
        subject: '回滚提交', // 新增
      },
      {
        value: 'chore',
        name: 'chore: 对构建过程或辅助工具和库的更改',
        emoji: '🔧',
        subject: '辅助工具配置修改', // 新增
      },
      {
        value: 'wip',
        name: 'wip: 正在开发中',
        emoji: '🚧',
        subject: '正在开发中', // 新增
      },
      {
        value: 'workflow',
        name: 'workflow: 工作流程改进',
        emoji: '🔄',
        subject: '工作流程优化', // 新增
      },
      {
        value: 'types',
        name: 'types: 类型定义文件修改',
        emoji: '🔤',
        subject: '类型定义文件修改', // 新增
      },
    ],
    // 允许跳过「作用域」的选择（直接回车）
    emptyScopesAlias: 'empty: 不填写',
    // 当预设的作用域不匹配时，允许手动输入
    customScopesAlias: 'custom: 自定义',
  },
};
