# AGENTS.md

本仓库是 **uni-app + Vue 3 + Vite 的 CLI 工程**（从 HBuilderX 普通项目迁移而来）。

## 常用命令

```bash
npm install

# 开发
npm run dev:h5          # H5，默认 http://localhost:5173
npm run dev:mp-weixin   # 微信小程序，产物在 dist/dev/mp-weixin
npm run dev:app         # App，产物在 dist/dev/app

# 构建
npm run build:h5
npm run build:mp-weixin
npm run build:app

# 自动化测试
npm run test:h5         # 自动启动 dev server，再用 Jest + uni-automator 跑 H5 用例
HEADLESS=false npm run test:h5   # 想看浏览器操作时（Windows 用 cross-env HEADLESS=false ...）
```

## 目录约定

```text
.
├── src/
│   ├── App.vue
│   ├── main.js
│   ├── pages.json
│   ├── manifest.json
│   ├── uni.scss
│   ├── pages/            # 页面；测试文件放页面同级，命名 *.test.js
│   ├── components/       # 可复用组件
│   ├── api/              # 接口封装
│   ├── utils/            # 工具函数
│   ├── static/           # 静态资源
│   └── uni_modules/      # uni-app 插件
├── index.html            # H5 入口，引用 /src/main.js
├── vite.config.js
├── jest.config.js
├── jsconfig.json         # @/ -> src/ 的编辑器提示
└── androidPrivacy.json   # HBuilderX App 打包用
```

## 编码约定

- 路径别名 `@/` 指向 `src/`，优先使用 `@/utils/...`、`@/api/...`。
- 页面和组件使用 Vue 3 语法；页面生命周期仍用 uni-app 的 `onLoad`、`onShow` 等。
- 新增页面时同时更新 `src/pages.json`。
- 新增平台配置时修改 `src/manifest.json`。
- 不要直接修改 `dist/`、`unpackage/`、`node_modules/` 里的内容，这些都是产物或依赖。

## 自动化测试约定

- 测试文件：`src/**/*.test.js`，通常与页面同级。
- 测试运行器是 Jest 27，驱动层是 `@dcloudio/uni-automator`。
- `program` 是 automator 注入的全局对象，不需要 import。
- H5 测试通过 `h5.url` 复用 `npm run dev:h5` 启动的服务，`test:h5` 已用 `start-server-and-test` 串起来。
- 浏览器优先使用本机 Chrome；可用 `CHROME_PATH` 指定其它 Chromium。
- 选择器优先用唯一的 class，避免依赖父子选择器（微信小程序不支持）。
- 自定义组件内部元素要先 `page.$('组件')`，再在组件上 `.$()`。
- 等待用 `page.waitFor(selector)` 或 `page.waitFor(fn)`，不要到处写死 `waitFor(3000)`。
- 接口用 `program.mockUniMethod('request', ...)` 伪造，测试结束后 `restoreUniMethod`。
- 提交前至少跑一次：`npm run build:h5` 和 `npm run test:h5`。

## 平台说明

- H5：Vite dev server + Playwright，可进 CI。
- 微信小程序：需要本机安装微信开发者工具，并在 `src/manifest.json` 配好 `mp-weixin.appid`。
- App：CLI 只负责编译资源；真机运行、云打包、证书仍在 HBuilderX 中完成。
