# 元件仓 · 开源演示版

> Hardware Inventory Demo — 本地电子元器件库存管理，含 3D 器件收纳、BOM 导入、Gerber 焊接对料和 12 套主题。  
> 纯静态前端。所有数据只保存在浏览器 `localStorage`。

![3D 器件收纳](docs/screenshot.png)

![12 套主题](docs/themes.png)

---

## 这是什么

这是从实际使用的「元件仓」网站中抽出的开源演示版。它保留了完整的本地业务页面：

- **库存总览**：元件种类、库存总量、低库存、库位统计、分类占比、最近操作。
- **元件明细**：搜索、分类/库存/库位筛选、单个/批量出入库、收藏、CSV/JSON 导入导出、补货清单。
- **出入库记录**：入库/出库流水、筛选、统计。
- **板卡 / BOM**：导入 XLSX / XLS / CSV BOM，自动拆分被动器件，匹配库存，确认后本地扣减并保存板卡领料记录。
- **焊接对料**：打开 Gerber ZIP，加载 BOM 和坐标，点击器件在板上点亮焊盘，板卡可保存在本机。
- **3D 器件收纳**：L01–L08 长盒、IC01 芯片试管盒、C01 电容盒、R01 电阻盒，共 11 个盒子 / 691 个位置；支持自定义盒子、格子改名、关联库存器件、本地保存。
- **扫码**：嘉立创标签二维码本地解析，支持摄像头和 USB 扫码枪；不联网。
- **12 套主题**：经典绿、深空黑、午夜蓝、暗夜紫、石墨灰、森林绿、海洋蓝、日落橙、樱花粉、雪白、赛博青、复古棕。


---

## 快速开始

### 方式一：本地静态服务器（推荐）

```bash
npm install
npm run serve
# 打开 http://127.0.0.1:4173
```

也可以使用任意静态服务器，例如：

```bash
npx serve public
# 或
python -m http.server 4173 --directory public
```

### 方式二：直接打开

`public/index.html` 是纯静态页面。由于浏览器对 `file://` 下的模块加载有限制，建议用上面的静态服务器方式。

### GitHub Pages

仓库自带 `.github/workflows/pages.yml`。把代码推到 GitHub 的 `main` 分支后：

1. 打开仓库 **Settings → Pages**；
2. Source 选择 **GitHub Actions**；
3. 等待 Actions 完成，即可通过 `https://<用户名>.github.io/<仓库名>/` 访问。

页面里的资源路径都是相对路径，放在子目录下也能正常加载。

---

## 初始数据与本地存储

- 默认是**空仓库**：不包含任何真实库存，也不预置演示元件；首次打开所有统计为 0。
- 访问者可以自己添加元件、导入 BOM、编辑 3D 位置；所有数据只保存在当前浏览器 `localStorage`。
- 顶栏的「清空本机数据」按钮可以一键删除当前浏览器里的本地数据。
- 换浏览器、换设备或清除浏览器数据后，数据不会自动同步。

本地存储键：

| 键 | 用途 |
| --- | --- |
| `component-vault-open-source-data-v1` | 元件、流水、板卡、3D 位置、收纳盒 |
| `component-vault-theme` | 当前主题 |
| `component-vault-theme-mode` | 当前主题明暗模式 |
| `component-vault-sidebar-collapsed` | 侧栏收缩状态 |

![空仓库的元件明细](docs/empty-inventory.png)

---

## 目录结构

```
.
├── public/                      # 静态站点根目录
│   ├── index.html               # 页面结构、侧栏、弹窗
│   ├── app.js                   # 库存 / BOM / 焊接 / 扫码 / 3D Bridge
│   ├── styles.css               # 主样式、侧栏、12 套主题
│   ├── theme.js                 # 主题定义与切换
│   ├── config.js                # 开源演示版配置（云端/立创均关闭）
│   ├── bom-manager.js           # BOM 解析、被动器件拆分与匹配
│   ├── pickplace-manager.js     # 坐标文件解析
│   ├── gerber-session.js        # Gerber 会话
│   ├── solder-board-store.js    # 本机板卡保存
│   ├── qr-decoder.js            # 嘉立创标签字段解析
│   ├── jsQR.min.js              # 二维码识别（本地）
│   ├── jszip.min.js             # Gerber ZIP 解压
│   ├── pcb-stackup.min.js       # Gerber 渲染
│   ├── xlsx.full.min.js         # BOM / CSV 读取
│   ├── lucide.min.js            # 图标
│   └── storage3d/               # 3D 器件收纳
│       ├── main.js              # 3D 交互源码
│       ├── model.js             # 盒子编号与自定义盒子规则
│       ├── storage.css          # 3D 页样式
│       └── bundle.js            # 已打包的 3D 模块
├── scripts/serve.cjs            # 本地静态服务器
├── licenses/                    # 第三方许可证文本
├── THIRD_PARTY_NOTICES.md       # 第三方组件说明
└── package.json
```

---

## 开发与构建

3D 收纳的源码在 `public/storage3d/main.js`，使用 esbuild 打包成 `public/storage3d/bundle.js`：

```bash
npm run build
```

修改 `main.js` 或 `model.js` 后必须重新构建，否则页面加载的仍是旧的 `bundle.js`。

页面本身不需要构建；改 `public/` 下的 HTML/CSS/JS 后刷新即可。

---

## 立创商城搜索

开源版**不包含**立创商城代理服务，`public/config.js` 中：

```js
window.LCSC_LOOKUP = { apiBase: '' };
```

因此「立创搜索（需代理）」按钮会提示需要自建代理。如果你希望恢复这个功能，需要自己部署一个同源的 `/api/lcsc/search` 和 `/api/lcsc/detail` 代理，然后把 `apiBase` 改成对应前缀。不要让浏览器直接请求立创商城，跨域和访问策略会失败。

---

## 隐私与安全

- 没有账号、密码、Cookie、Token、Session。
- 没有云端同步，没有后端数据库。
- 没有上传接口；BOM、Gerber、二维码都在浏览器本地解析。
- 仓库默认不包含任何库存数据；访问者自己添加的数据只保存在本机浏览器，不会上传。
- 导入自己的 BOM / Gerber 时，文件只在当前浏览器内处理。

---

## 已知限制

- 默认是空仓库，需要自己添加元件或导入 BOM 才能看到库存数据。
- 数据只保存在当前浏览器，不跨设备、不跨浏览器同步。
- 3D 模型是程序生成的展示模型，没有毫米级尺寸标定，不能用于加工。
- BOM 中同一行包含多个阻值/容值时，系统会拆分并匹配，但不会猜测每种值的实际数量；数量需要人工确认后才会扣库存。
- 立创搜索需要自建代理才能使用。
- 本仓库定位为本地演示 / 二次开发模板，不建议直接用于生产库存管理。

---

## 第三方组件

本仓库使用了 Lucide、SheetJS、JSZip、pcb-stackup、jsQR、three.js、esbuild 等第三方组件，许可证和来源见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 和 `licenses/` 目录。

---

## 许可证

本项目以 [MIT License](LICENSE) 开源。第三方组件仍遵循各自的许可证。
