import { prisma } from './db'
import { ucastToPrisma } from '@open-policy-agent/ucast-prisma'

async function runFullTest() {
  console.log("🚀 开始全量测试...");

  // --- 测试 1: 普通列 + JSONB 深度路径 ---
  // 模拟 OPA 传来的 UCAST: (status == 'active' AND metadata.role == 'admin')
  const complexUcast = {
    operator: "and",
    type: "compound",
    value: [
      { field: "user.status", operator: "eq", type: "field", value: "active" },
      { field: "user.role", operator: "eq", type: "field", value: "admin" }
    ]
  };

  const where1 = ucastToPrisma(complexUcast, "TestUser", {
    translations: {
      user: {
        $self: "TestUser",
        status: "status",
        // 关键点：映射到 JSONB 内部路径
        role: "metadata.role" 
      }
    }
  });

  console.log("🧪 翻译出的 JSONB 查询对象:", JSON.stringify(where1, null, 2));

  const result1 = await prisma.testUser.findMany({ where: where1 });
  console.log(`✅ 查到 ${result1.length} 个符合条件的 Admin`);

  // --- 测试 2: 跨表关联查询 ---
  // 模拟：查询 User，条件是关联表 UserStats 的 loginCount > 50
  const joinUcast = {
    field: "stats.count",
    operator: "gt",
    type: "field",
    value: 50
  };

  const where2 = ucastToPrisma(joinUcast, "TestUser", {
    translations: {
      stats: {
        $self: "UserStats", // 关联模型
        count: "loginCount"
      }
    }
  });

  const result2 = await prisma.testUser.findMany({
    where: {
      UserStats: {
        some: where2 // 注意：如果是 1:N 关系，需要用 some 或 every
      }
    }
  });
  console.log(`✅ 跨表查询成功，查到 ${result2.length} 个活跃老用户`);
}

runFullTest().catch(console.error);