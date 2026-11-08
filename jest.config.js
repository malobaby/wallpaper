const fs = require('fs')

// H5 自动化测试用 Playwright 驱动浏览器。
// 优先使用本机 Chrome，避免额外下载 Playwright 浏览器；也可以用 CHROME_PATH 覆盖。
const chromePath =
  process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const executablePath = fs.existsSync(chromePath) ? chromePath : undefined

module.exports = {
  globalTeardown: '@dcloudio/uni-automator/dist/teardown.js',
  testEnvironment: '@dcloudio/uni-automator/dist/environment.js',
  testEnvironmentOptions: {
    // automator 的 WebSocket 端口，必须和 dev:h5:test 的 --autoPort 一致
    port: 9520,
    // h5.url 指向已经启动的 dev server；有 url 时 automator 会跳过编译
    h5: {
      url: 'http://localhost:5173/xxmwall/',
      options: {
        // 默认无头模式，适合 CI 和 AI 自动跑；想看浏览器操作时设置 HEADLESS=false
        headless: process.env.HEADLESS !== 'false',
        ...(executablePath ? { executablePath } : {})
      }
    },
    'mp-weixin': {
      port: 9420,
      launch: true,
      teardown: 'disconnect'
    },
    app: {
      android: {
        appid: '__UNI__B8FCDB7',
        package: '',
        executablePath: ''
      },
      ios: {
        id: '',
        executablePath: ''
      }
    }
  },
  testTimeout: 30000,
  reporters: ['default'],
  watchPathIgnorePatterns: ['/node_modules/', '/dist/', '/.git/'],
  moduleFileExtensions: ['js', 'json'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/uni_modules/']
}
