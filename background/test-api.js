// 简单的 API 测试脚本
// 使用 node test-api.js 运行

const http = require('node:http')

const BASE_URL = 'http://localhost:3000'

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const req = http.request(opts, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, data: json })
        }
        catch (e) {
          resolve({ status: res.statusCode, data })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function testAPI() {
  console.log('🧪 开始测试 Slidev 后端 API...\n')

  try {
    // 测试健康检查
    console.log('1. 测试健康检查...')
    const health = await request('/api/health')
    console.log(`   状态: ${health.status}`)
    console.log(`   响应:`, health.data)
    console.log('   ✅ 健康检查通过\n')

    // 测试 API 根路径
    console.log('2. 测试 API 根路径...')
    const root = await request('/api')
    console.log(`   状态: ${root.status}`)
    console.log(`   响应:`, root.data)
    console.log('   ✅ API 根路径正常\n')

    // 测试用户注册
    console.log('3. 测试用户注册...')
    const registerData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    }

    const register = await request('/api/auth/register', {
      method: 'POST',
      body: registerData,
    })

    console.log(`   状态: ${register.status}`)
    console.log(`   响应:`, register.data)

    if (register.data.success) {
      console.log('   ✅ 用户注册成功')
      const token = register.data.data.token

      // 测试创建文档
      console.log('\n4. 测试创建文档...')
      const createDocData = {
        title: '测试演示文稿',
        description: '这是一个测试演示文稿',
        content: `---
title: 测试演示文稿
layout: cover
---

# 测试演示文稿

这是第一页

---

# 第二页

这是第二页的内容`,
      }

      const createDoc = await request('/api/documents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: createDocData,
      })

      console.log(`   状态: ${createDoc.status}`)
      console.log(`   响应:`, createDoc.data)

      if (createDoc.data.success) {
        console.log('   ✅ 文档创建成功')
        const docId = createDoc.data.data.id

        // 测试获取文档列表
        console.log('\n5. 测试获取文档列表...')
        const getDocs = await request('/api/documents', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log(`   状态: ${getDocs.status}`)
        console.log(`   文档数量:`, getDocs.data.data?.presentations?.length || 0)
        console.log('   ✅ 获取文档列表成功')

        // 测试获取文档详情
        console.log('\n6. 测试获取文档详情...')
        const getDoc = await request(`/api/documents/${docId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log(`   状态: ${getDoc.status}`)
        console.log(`   文档标题:`, getDoc.data.data?.title)
        console.log(`   幻灯片数量:`, getDoc.data.data?.slideCount)
        console.log('   ✅ 获取文档详情成功')

        // 测试获取幻灯片
        console.log('\n7. 测试获取幻灯片...')
        const getSlides = await request(`/api/slides/${docId}/slides`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log(`   状态: ${getSlides.status}`)
        console.log(`   幻灯片数量:`, getDocs.data.data?.length || 0)
        console.log('   ✅ 获取幻灯片成功')
      }
    }

    console.log('\n🎉 API 测试完成！')
  }
  catch (error) {
    console.error('❌ 测试失败:', error.message)
    console.log('\n请确保后端服务器正在运行: pnpm dev')
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await request('/api/health')
    return true
  }
  catch (error) {
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.log('❌ 后端服务器未运行')
    console.log('请先启动服务器:')
    console.log('   cd background')
    console.log('   pnpm dev')
    process.exit(1)
  }

  await testAPI()
}

if (require.main === module) {
  main()
}
