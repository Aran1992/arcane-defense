# 技术栈

## 总览

| 层级   | 选型       | 说明                               |
| ------ | ---------- | ---------------------------------- |
| 语言   | TypeScript | `strict: true`                     |
| 构建   | Vite 6     | 开发服务器与生产打包               |
| 渲染   | PixiJS 8   | 2D WebGL/Canvas                    |
| 格式化 | Prettier   | 提交前自动格式化                   |
| 检查   | ESLint     | TypeScript 规则 + 与 Prettier 共存 |

## PixiJS

- **版本**：^8.x（与实现阶段 `package.json` 一致）
- **用法**：单 `Application`，`resizeTo: window` 或自定义竖屏缩放（见 [architecture.md](architecture.md)）
- **场景**：游戏世界 Container + UI 层（Pixi 或 DOM 叠加）

## Vite

- **模板**：`vanilla-ts` 或等价（实现阶段 `npm create vite@latest`）
- **入口**：`index.html` → `src/main.ts`
- **别名**（可选）：`@/` → `src/`

## TypeScript

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

## 目标平台

| 项         | 约定                                            |
| ---------- | ----------------------------------------------- |
| 设计分辨率 | **720 × 1280**（竖屏）                          |
| 适配       | 等比缩放 + 留黑边或安全区；横屏提示旋转（可选） |
| 优先       | 移动端浏览器 / WebView；桌面浏览器可调试        |

## 依赖（实现阶段预期）

```json
{
  "dependencies": {
    "pixi.js": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^6.0.0",
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

版本号以实现时安装为准；本文记录选型意图。

## 相关文档

- [tooling.md](tooling.md)
- [architecture.md](architecture.md)
