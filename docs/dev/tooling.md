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

## CI / CD

### 自动部署（已配置）

Push 到 `master` 分支时自动构建并部署到 GitHub Pages：

- **Workflow**：`.github/workflows/deploy-gh-pages.yml`
- **步骤**：`checkout → npm ci → npm run build → peaceiris/actions-gh-pages`
- **发布分支**：`gh-pages`
- **预览地址**：`https://Aran1992.github.io/arcane-defense/`

### 质量门禁（可选，v1 暂未实现）

```yaml
- run: npm ci
- run: npm run format:check
- run: npm run lint
- run: npm run build
```

文件位置：`.github/workflows/ci.yml`（待实现）。

## 相关文档

- [stack.md](stack.md)
- [../AGENTS.md](../../AGENTS.md)
