# epub-preview

一个零依赖前端预览项目，用于浏览 `/command_line/.tmp_clr_epub` 下的 EPUB 解包网页内容。

## 运行

```bash
cd /command_line/epub-preview
npm run dev
```

默认地址：`http://localhost:5173`

## 功能

1. 左侧目录树浏览 `.tmp_clr_epub` 全部文件
2. 右侧 iframe 预览 HTML/CSS/图片/字体等资源
3. 顶部快速跳转 `ch01` 到 `ch14` 和 `toc01.html`
4. 可在新标签页打开当前文件
