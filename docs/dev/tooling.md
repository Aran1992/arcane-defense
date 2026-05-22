# 工具链与提交门禁

## Prettier

**.prettierrc**（实现阶段创建）：

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**.prettierignore**：`dist`, `node_modules`, `coverage`

## ESLint

- **Flat config**：`eslint.config.js`
- **扩展**：`@eslint/js` recommended + `typescript-eslint` recommended + `eslint-config-prettier`（关闭与 Prettier 冲突的规则）
- **范围**：`src/**/*.ts`，配置文件自身可选 lint

## npm scripts（约定）

| 脚本           | 命令                 |
| -------------- | -------------------- |
| `dev`          | `vite`               |
| `build`        | `tsc && vite build`  |
| `preview`      | `vite preview`       |
| `lint`         | `eslint src`         |
| `lint:fix`     | `eslint src --fix`   |
| `format`       | `prettier --write .` |
| `format:check` | `prettier --check .` |

## Git 提交门禁

每次 `git commit` 前执行：

```text
git commit
  → husky pre-commit
    → lint-staged
      → *.{ts,tsx,js,json,md}: prettier --write
      → *.{ts,tsx}: eslint --fix
```

### 实现步骤（Phase 1）

```bash
npm install -D husky lint-staged prettier eslint typescript-eslint @eslint/js eslint-config-prettier
npx husky init
```

**.husky/pre-commit**：

```sh
npx lint-staged
```

**package.json** 片段：

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,json,md}": "prettier --write",
    "*.{ts,tsx}": "eslint --fix"
  }
}
```

提交前须 **无 ESLint error**；warning 策略由实现阶段配置。

## CI（可选，v1 可不实现）

Push / PR 时建议：

```yaml
- run: npm ci
- run: npm run format:check
- run: npm run lint
- run: npm run build
```

文件位置：`.github/workflows/ci.yml`（实现阶段添加）。

## 相关文档

- [stack.md](stack.md)
- [../AGENTS.md](../../AGENTS.md)
