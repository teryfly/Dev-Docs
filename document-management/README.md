
## API 接口

后端 API 基础地址默认为 `http://localhost:8000`，可通过环境变量 `VITE_API_BASE_URL` 配置。

### 主要接口

- `GET /v1/projects` - 获取项目列表
- `GET /v1/plan/categories` - 获取分类列表
- `GET /v1/plan/documents/latest` - 获取最新版本列表
- `GET /v1/plan/documents/history` - 获取历史版本
- `POST /v1/plan/documents` - 创建文档
- `PUT /v1/plan/documents/{id}` - 更新文档（新版本/重命名）
- `DELETE /v1/plan/documents/{id}` - 删除单个版本
- `DELETE /v1/plan/documents` - 删除全部历史
- `POST /v1/plan/documents/migrate/all-history` - 迁移全部历史
- `POST /v1/plan/documents/migrate/from-current` - 从当前版本起迁移

## 核心功能说明

### 文档列表

- 支持按项目和分类筛选
- 标题搜索（filename LIKE）
- 多字段排序（文件名、创建时间、版本号）
- 分页展示

### 文档详情

- Monaco Editor 编辑器
- 保存为新版本（version + 1）
- 导出 Markdown 文件
- 快捷键 Ctrl/Cmd + S 保存

### 版本历史

- 查看所有历史版本
- 删除单个版本
- 回退到历史版本（基于历史内容创建新版本）
- 选择两个版本进行对比

### 版本对比

- Monaco DiffEditor 差异对比
- 交换左右视图
- 忽略空白选项
- 自动换行选项

### 分类变更（移动）

- 移动全部历史：迁移 + 删除源历史
- 从当前版本起移动：复制当前版本到目标分类
- 支持批量移动

### 重命名

- 从当前版本起使用新文件名
- 旧文件名历史保留

### 删除

- 删除单个版本：需二次确认
- 删除全部历史：需输入文件名确认

## 注意事项

1. **门禁规则**
   - 未选择项目：禁用分类选择和新建按钮
   - 未选择分类：禁用新建按钮

2. **版本管理**
   - 同名文档会自动生成新版本（version + 1）
   - 重命名不迁移旧历史

3. **分类变更**
   - 移动操作由"迁移 + 删除"组合实现
   - 非事务性操作，可能出现源目标并存

4. **对比限制**
   - 仅支持同一文件的不同版本对比
   - 必须选择两个不同的版本

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 许可证

MIT