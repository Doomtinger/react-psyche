# Flow Space · Mind Atlas

本地优先（local-first）、免注册的心理状态记录与自我觉察 Web 应用。核心闭环：**快速记录 → 3D 探索 → 时间线回看 → 周期回顾**。

技术基线（已锁定）：Next.js (App Router) + React + TypeScript + React Three Fiber + IndexedDB。AI 仅预留接口，第一版不接入。

## 快速开始

```bash
npm install
npm run dev      # 开发服务器 http://localhost:3000
npm run build    # 生产构建
npm run test     # 单元测试 / 集成测试 (Vitest)
npm run lint     # ESLint
npm run typecheck# tsc --noEmit
```

## 架构原则

- **记录数据是核心资产，Mind Atlas 是消费这些数据的探索视图。**
- React 页面**不直接**调用 IndexedDB；所有读写经过 `MoodRecordRepository` 抽象层。
- 3D 场景**不直接**读写数据库；它只消费由 `RecordService` 提供的标准记录数据，并发出“选择记录 / 改变视角”等交互事件。
- 业务统计（周期回顾）放在应用服务层，不写在 React 组件里。
- 导入 / 导出使用同一套带 `schemaVersion` 的数据结构（`flow-space-backup` v1），写入前完成整文件校验。
- 未来账号、云同步、AI 作为**新增实现**接入，不侵入现有页面与业务层调用方式。

## 目录结构

```
src/
├── app/                     # 路由页面 + 布局（Home / atlas / timeline / review / settings）
├── domain/                  # 实体类型、Repository 接口、统一错误模型（AppError）
├── features/
│   ├── records/             # 快速记录表单、详情、对话框 + Zod 校验
│   ├── atlas/               # 3D Mind Atlas（场景、节点、适配器、降级）
│   ├── timeline/            # 时间线列表与筛选
│   ├── review/              # 周期回顾
│   └── settings/            # 导出 / 导入 / 删除 / 偏好
├── application/             # Record / Query / Review / Export / Import 服务 + 容器装配
├── infrastructure/
│   ├── db/                  # IndexedDB 封装、迁移、Repository 实现
│   └── ai/                  # ReflectionProvider 接口 + DisabledReflectionProvider（预留）
└── shared/                  # 组件、hooks（RecordsProvider）、工具、常量
```

## 数据访问层与未来扩展

- `src/domain/repositories/MoodRecordRepository.ts` 定义唯一持久化契约。
- 当前实现：`IndexedDbMoodRecordRepository`。未来新增 `CloudMoodRecordRepository` 即可替换，页面与业务层无需改动。
- AI：`DisabledReflectionProvider` 现始终抛出，未来实现 `reflect(request)` 时再接入，且只能通过用户明确选择的记录、密钥留在服务端、输出与原始记录分离。

## 测试策略

- 单元测试：Zod 校验、Repository↔IndexedDB、周期统计、导入导出校验、3D 映射。
- 集成测试：`fake-indexeddb` 验证真实读写与迁移。
- 端到端关键路径（建议 Playwright）：新建记录刷新仍在 → 编辑同步 → 按日期筛选两视图一致 → 导出后删除再导入恢复 → 无效文件不覆盖 → 3D 失败仍可管理记录。

## 隐私与数据责任

记录保存在当前浏览器的本地存储（IndexedDB），**不**上传到任何服务器。清除浏览器数据、更换设备或浏览器可能导致记录无法访问——因此「导出备份」是 MVP 的正式功能，而非未来优化项。
