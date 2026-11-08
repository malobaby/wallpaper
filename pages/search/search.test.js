describe('/pages/search/search', () => {
  let page

  beforeAll(async () => {
    // 清掉历史搜索，保证每次测试的初始状态一致
    await program.callUniMethod('removeStorageSync', 'historySearch')

    page = await program.reLaunch('/pages/search/search')
    await page.waitFor('.searchLayout')
  })

  afterAll(async () => {
    // 恢复被 mock 的 uni 方法，并清掉测试产生的缓存
    await program.restoreUniMethod('request')
    await program.restoreUniMethod('showModal')
    await program.callUniMethod('removeStorageSync', 'historySearch')
    await program.callUniMethod('removeStorageSync', 'storgClassList')
  })

  it('默认展示 4 个热门搜索词', async () => {
    const recommend = await page.$('.recommend')
    expect(recommend).not.toBeNull()

    // 微信小程序不支持 .recommend .tab 这种父子选择器
    // 先拿容器，再在容器内找，跨端都稳
    const tabs = await recommend.$$('.tab')
    expect(tabs).toHaveLength(4)

    const texts = []
    for (const tab of tabs) {
      texts.push(await tab.text())
    }
    expect(texts).toEqual(['美女', '帅哥', '宠物', '卡通'])
  })

  it('点击热门词后展示搜索结果', async () => {
    // 页面通过 uni.request 搜索，这里 mock 返回 2 条数据
    await program.mockUniMethod('request', function (options) {
      options.success({
        statusCode: 200,
        data: {
          errCode: 0,
          errMsg: 'ok',
          data: [
            { _id: '1', smallPicurl: 'https://example.com/1.jpg' },
            { _id: '2', smallPicurl: 'https://example.com/2.jpg' }
          ]
        }
      })
    })

    const recommend = await page.$('.recommend')
    const firstTab = (await recommend.$$('.tab'))[0]
    await firstTab.tap()

    await page.waitFor(async () => {
      const list = await page.$('.list')
      if (!list) return false
      return (await list.$$('.item')).length === 2
    })

    const list = await page.$('.list')
    expect(await list.$$('.item')).toHaveLength(2)
  })

  it('输入关键词并搜索后展示搜索结果', async () => {
    // 重新打开页面，清掉上一条用例留下的结果
    page = await program.reLaunch('/pages/search/search')
    await page.waitFor('.searchLayout')

    await program.mockUniMethod('request', function (options) {
      options.success({
        statusCode: 200,
        data: {
          errCode: 0,
          errMsg: 'ok',
          data: [
            { _id: '3', smallPicurl: 'https://example.com/3.jpg' },
            { _id: '4', smallPicurl: 'https://example.com/4.jpg' }
          ]
        }
      })
    })

    // uni-search-bar 是自定义组件，先通过它内部的 class 找到根节点和输入框
    const searchBar = await page.$('.uni-searchbar')
    const input = await searchBar.$('.uni-searchbar__box-search-input')
    await input.tap()
    await input.input('猫')

    // 给 v-model 一点时间同步到 queryParams.keyword
    await page.waitFor(200)

    // 直接调用页面的 onSearch 方法，避免依赖键盘 confirm 事件
    await page.callMethod('onSearch')

    await page.waitFor(async () => {
      const list = await page.$('.list')
      if (!list) return false
      return (await list.$$('.item')).length === 2
    })

    const list = await page.$('.list')
    expect(await list.$$('.item')).toHaveLength(2)

    // 搜索历史里应该出现刚才输入的关键词
    const history = await program.callUniMethod('getStorageSync', 'historySearch')
    expect(history).toContain('猫')
  })

  it('确认后清空最近搜索', async () => {
    // 先造一条历史记录，再重新打开页面
    await program.callUniMethod('setStorageSync', 'historySearch', ['猫'])
    page = await program.reLaunch('/pages/search/search')
    await page.waitFor('.searchLayout')
    await page.waitFor('.history')

    // uni.showModal 是系统弹窗，测试里直接 mock 成“点击确定”
    await program.mockUniMethod('showModal', function (options) {
      options.success({ confirm: true, cancel: false })
    })

    const history = await page.$('.history')
    const clearIcon = await history.$('.icon')
    await clearIcon.tap()

    // 清空后 .history 整个消失
    await page.waitFor(async () => (await page.$('.history')) === null)

    // 存储里的 historySearch 也应该被删掉
    const stored = await program.callUniMethod('getStorageSync', 'historySearch')
    expect(stored || []).toHaveLength(0)
  })
})
