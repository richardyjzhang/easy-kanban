# API 文档

## 登录登出相关

### 系统登录

方法及路径 `POST /login`

请求体

```json
{
  "username": "泽连斯基",
  "password": "ZeSheng.N.B"
}
```

响应体，登录成功时没有`message`字段

```json
{
  "success": false,
  "message": "市场费不足，不允许登录"
}
```

### 系统登出

方法及路径 `POST /logout`

不设置请求体和响应体

## 后台管理相关

### 获取所有人员

方法及路径 `GET /employees`

不设置请求体

响应体

```json
[
  {
    "id": "9a649b1af0b5494b9a6e344d14effcc8",
    "name": "特朗普·川建国"
  },
  {
    "id": "37c566d790784a48872cc747c2a16df5",
    "name": "拜登·拜振华"
  }
]
```

### 创建一个人员

方法及路径 `POST /empolyees`

请求体

```json
{
  "name": "特朗普·川建国"
}
```

响应体

```json
{
  "id": "9a649b1af0b5494b9a6e344d14effcc8",
  "name": "特朗普·川建国"
}
```

### 修改一个人员

方法及路径 `PUT /employees/{id}`

```json
{
  "name": "特朗普·川建国"
}
```

响应体

```json
{
  "id": "9a649b1af0b5494b9a6e344d14effcc8",
  "name": "特朗普·川建国"
}
```

### 删除一个人员

方法及路径 `DELETE /employees/{id}`

不设置请求体和响应体

### 获取所有项目状态类型

方法及路径 `GET /project-status`

不设置请求体

响应体

```json
[
  {
    "id": "9a649b1af0b5494b9a6e344d14effcc8",
    "name": "商K阶段"
  },
  {
    "id": "37c566d790784a48872cc747c2a16df5",
    "name": "回款阶段"
  }
]
```

### 创建一个项目状态类型

方法及路径 `POST /project-status`

请求体

```json
{
  "name": "商K阶段"
}
```

响应体

```json
{
  "id": "9a649b1af0b5494b9a6e344d14effcc8",
  "name": "商K阶段"
}
```

### 修改一个项目状态类型

方法及路径 `PUT /project-status/{id}`

```json
{
  "name": "回款阶段"
}
```

响应体

```json
{
  "id": "9a649b1af0b5494b9a6e344d14effcc8",
  "name": "回款阶段"
}
```

### 删除一个项目状态类型

方法及路径 `DELETE /project-status/{id}`

不设置请求体和响应体
