<img src="https://user-images.githubusercontent.com/12215982/139462759-e6d8ebc6-180d-4d18-8c3c-68234f0ff1c0.png" width="150" />

# 码表助手 web 版 

> 可添加、删除、批量导入外部词条、批量生成指定版本的五笔编码。

> 有其它问题，欢迎加群讨论: [878750538](https://jq.qq.com/?_wv=1027&k=st8cY2sI)


## 加载速度

最多可处理 60万 条数据的码表
<img width="674" alt="Screen Shot 2021-12-03 at 23 27 08" src="https://user-images.githubusercontent.com/12215982/144628323-1fe72bb4-602a-4d50-a904-7df9d7685b16.png">
<img width="1463" alt="Screen Shot 2021-12-03 at 23 26 27" src="https://user-images.githubusercontent.com/12215982/144628297-be39d46f-e802-4204-a389-e3a935f61b81.png">


## 用到的技术
- `nodejs`
- `javascript` `scss` `html`
- `vue 2` [`electron`](https://github.com/electron/electron)


## 解决的难题
1. 查重并提取出所有重复的内容
2. 词条根据词条编码判断插入位置
3. 计算 unicode 字符串长度 .length 的问题
