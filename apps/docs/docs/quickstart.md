---
id: quickstart
title: 快速开始
---

# 快速开始

本页目标是让你在本机看到控制台页面，并知道后端什么时候真正连上了。

## 前置环境

- Node.js 18 或更高版本
- Python 3.10 或更高版本

Node.js 用来启动前端页面、官网和文档站。Python 用来启动 FastAPI 后端。

## 安装控制台依赖

```powershell
cd apps/console
npm install
cd ../..
```

## 启动后端 API

```powershell
npm run api
```

默认地址：

```text
http://127.0.0.1:8012
```

## 启动控制台

打开第二个终端：

```powershell
npm run console:dev
```

默认地址：

```text
http://127.0.0.1:5178
```

## 启动官网和文档站

```powershell
npm run www:dev
npm run docs:dev
```

默认地址：

| 站点 | 地址 |
| --- | --- |
| 官网 | `http://127.0.0.1:4321` |
| 文档站 | `http://127.0.0.1:3000` |

## 后端没启动时会怎样

控制台会使用内置样本数据兜底展示。页面能打开不代表后端已经在线。要写入真实实验日志，需要同时启动后端 API。
