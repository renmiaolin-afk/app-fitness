# 云函数

## recommendPlans

根据建档档案对三条训练计划打分排序，返回匹配标签与推荐理由。

### 部署

1. 微信开发者工具打开仓库根目录
2. 云开发控制台确认环境 `cloud1-d5g1vbk2ibf89c107`
3. 右键 `recommendPlans` → **上传并部署：云端安装依赖**

### 调用

小程序：`wx.cloud.callFunction({ name: 'recommendPlans', data: { profile } })`
