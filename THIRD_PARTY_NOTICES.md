# 第三方组件与许可说明

本仓库是「元件仓」的开源演示版，随包使用或构建时使用以下第三方组件。  
分发、修改或商用前，请同时遵守各组件自己的许可证。

## 随网页一起分发的浏览器端库

| 组件 | 版本 | 许可证 | 文件 | 来源 |
| --- | --- | --- | --- | --- |
| Lucide Icons | 0.468.0 | ISC | `public/lucide.min.js` | https://lucide.dev/ |
| SheetJS Community Edition（xlsx） | 0.18.5 | Apache-2.0 | `public/xlsx.full.min.js` | https://sheetjs.com/ |
| JSZip | 3.10.1 | MIT 或 GPLv3 | `public/jszip.min.js` | https://stuk.github.io/jszip/ |
| pcb-stackup（tracespace） | 4.2.8 | MIT | `public/pcb-stackup.min.js` | https://github.com/tracespace/tracespace |
| jsQR | 1.4.0 | Apache-2.0 | `public/jsQR.min.js` | https://github.com/cozmo/jsQR |

对应许可证文本：

- `licenses/LICENSE-JSZip.txt`
- `licenses/LICENSE-SheetJS.txt`
- `licenses/LICENSE-pcb-stackup.txt`
- `licenses/LICENSE-pcb-stackup-bundle.txt`
- `licenses/LICENSE-Apache-2.0.txt`（jsQR 使用的 Apache-2.0 文本）
- `licenses/LICENSE-lucide-ISC.txt`（Lucide 使用的 ISC 文本）

## 构建时依赖

| 组件 | 版本 | 许可证 | 用途 | 来源 |
| --- | --- | --- | --- | --- |
| three.js | 0.185.1 | MIT | 构建 `public/storage3d/bundle.js` | https://threejs.org/ |
| esbuild | 0.28.2 | MIT | 打包 3D 模块 | https://esbuild.github.io/ |

对应许可证文本：

- `licenses/LICENSE-three.txt`
- `licenses/LICENSE-esbuild.md`

## 参考与致谢

本项目的 `qr-decoder.js`、`bom-manager.js`、`pickplace-manager.js`、`gerber-session.js` 和 3D 收纳交互为独立实现。开发过程中参考过以下公开项目，但没有复制其源码：

- `xiaoxu798/lcsc`（GPL-3.0）：仅作为嘉立创标签字段与交互流程的研究参考。  
  https://github.com/xiaoxu798/lcsc
- `www_dssys_cn/shock-feather`（AGPL-3.0）：仅作为 Gerber 对料、BOM 点击定位和双面显示流程的研究参考。  
  https://gitee.com/www_dssys_cn/shock-feather

## 数据说明

本仓库不包含任何真实库存、账号、邮箱、密码、会话或云端数据。  
本仓库默认不包含任何库存数据；访问者自己添加的元件、流水、板卡和 3D 位置只保存在其浏览器 localStorage 中，不会上传到任何服务器。
