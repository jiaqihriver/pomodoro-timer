# 🍅 番茄钟桌面应用

一个简洁优雅的番茄工作法桌面应用，帮助你专注于工作，提高效率。

## ✨ 功能特性

- ⏱️ **标准番茄钟**：25分钟工作时间 + 5分钟休息时间
- 🔔 **声音提醒**：时间结束时自动播放提示音
- 📊 **任务统计**：记录完成的番茄钟数量
- 🎨 **简洁界面**：清爽的用户界面，无干扰设计
- 🖥️ **跨平台支持**：支持 macOS 和 Windows 系统

## 📦 安装下载

### 最新版本

访问 [Releases 页面](https://github.com/jiaqihriver/pomodoro-timer/releases) 下载最新版本。

#### macOS
- 下载 `.dmg` 文件
- 双击打开，将应用拖到应用程序文件夹
- 如果提示"无法打开"，请在"系统偏好设置 > 安全性与隐私"中允许

#### Windows
- 下载 `.exe` 或 `.msi` 安装文件
- 双击运行安装程序
- 按照提示完成安装

## 🚀 使用方法

1. **开始番茄钟**：点击"开始"按钮开始25分钟的工作计时
2. **专注工作**：期间保持专注，不要中断
3. **短暂休息**：25分钟结束后，休息5分钟
4. **重复循环**：每完成4个番茄钟后，休息15-30分钟

## 🛠️ 开发构建

### 环境要求

- [Node.js](https://nodejs.org/) 20 或更高版本
- [Rust](https://www.rust-lang.org/) 稳定版
- macOS 需要安装：[create-dmg](https://github.com/sindresorhus/create-dmg)
  ```bash
  brew install create-dmg
  ```

### 构建步骤

```bash
# 克隆仓库
git clone https://github.com/jiaqihriver/pomodoro-timer.git
cd pomodoro-timer

# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建生产版本
npm run tauri build
```

构建完成后，可执行文件位于：
- macOS: `src-tauri/target/release/bundle/dmg/`
- Windows: `src-tauri/target/release/bundle/msi/`

## 📖 番茄工作法

番茄工作法是由弗朗西斯科·西里洛于1992年创立的一种时间管理方法：

1. 选择一个待完成的任务
2. 设置25分钟定时器
3. 专注于任务直到定时器响起
4. 短暂休息5分钟
5. 每完成4个番茄钟，休息15-30分钟

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 开源协议

本项目采用 MIT 协议开源。

## 📧 联系方式

如有问题或建议，欢迎通过以下方式联系：

- 提交 [GitHub Issue](https://github.com/jiaqihriver/pomodoro-timer/issues)
- GitHub: [@jiaqihriver](https://github.com/jiaqihriver)

---

⭐ 如果这个项目对你有帮助，欢迎给个 Star！
