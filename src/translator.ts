import { ucastToPrisma as originalUcastToPrisma } from '@open-policy-agent/ucast-prisma';

export function ucastToPrisma(
  ucast: any,
  primary: string,
  options: any = {}
): any {
  // 1. 调用原始翻译器生成基础结构
  const baseWhere = originalUcastToPrisma(ucast, primary, options);

  // 2. 对生成的结果进行后处理，专门处理包含 "|" 的键名
  return postProcess(baseWhere);
}

function postProcess(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(postProcess);
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (key.includes('|')) {
        const [column, ...pathParts] = key.split('|') as [string, ...string[]];
        const value = obj[key];
        
        // 处理嵌套路径（例如 "metadata|role.name"）
        const fullPath = pathParts.join('|').split('.');
        
        // 转换为 Prisma 的 JSONB 过滤格式
        newObj[column] = {
          path: fullPath,
          ...value
        };
      } else {
        newObj[key] = postProcess(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}
