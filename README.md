## Surge serverinfo
### 感谢原作者@Sestea @clydetime  VPS端部分 @Sestea @整点猫咪
### 在原作基础上增加了最大内存占用进程显示，以及把内存和cpu显示改为百分比显示

# 安装步骤(Debian)

##### 更新升级包管理
`apt update && apt upgrade -y`
##### 安装python
`apt install python python3-pip`
##### 安装psutil库
`pip3 install psutil`
##### 编写程序
`vim /root/servertraffic.py`
```
// Convert seconds to days, hours, minutes
function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    
    var dDisplay = d > 0 ? d + "天" : "";
    var hDisplay = h > 0 ? h + "小时" : "";
    var mDisplay = m > 0 ? m + "分钟" : "";
    
    return dDisplay + hDisplay + mDisplay; 
}

// Convert bytes to GB
function bytesToGB(bytes) {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
}

let your_url = " ";
let arg;
if (typeof $argument != 'undefined') {
    arg = Object.fromEntries($argument.split('&').map(item => item.split('=')));
};

const URL = arg?.url || your_url;

// 面板
let panel = {};
panel.title = arg?.title || 'WIKI-KR';  // Change the default title to 'DMIT-JP'
panel.icon = arg?.icon;

// 发送请求获取信息
const request = {
    url: URL,
    timeout: 3000
};

$httpClient.get(request, function(error, response, data) {
    if (error) {
        console.log('error: '+error);
        $done({title:'啊呃～', content:'完蛋了，出错了！看看是不是端口没打开？'+error});
    } else  {
        const Data = JSON.parse(data);
        
        console.log(Data);

        panel.content = `运行时间：${secondsToDhms(Data.uptime)}\n` +
            `内存使用：${Data.max_mem_process_name}\n` +
            `入站: ${bytesToGB(Data.bytes_recv)} GB` + '    |    ' + 
            `出站: ${bytesToGB(Data.bytes_sent)} GB\n` +
            `用量: ${bytesToGB(Data.bytes_total)} GB` + '     |    ' + 
            `总量: 200 GB\n` +
            `CPU: ${parseFloat(Data.cpu_usage).toFixed(2)}%` + '           |    ' + 
            `内存: ${parseFloat(Data.mem_usage).toFixed(2)}%\n` +
            `服务到期时间：♾️`;

        $done(panel);
    }
});
```

##### 编写守护进程
`vim /etc/systemd/system/servertraffic.service`
```
[Unit]
Description=Server Traffic Monitor

[Service]
Type=simple
WorkingDirectory=/root/
User=root
ExecStart=/usr/bin/python3 /root/servertraffic.py
Restart=always

[Install]
WantedBy=multi-user.target
```
##### 启动服务
`systemctl start servertraffic.service`
`systemctl enable servertraffic.service`
##### 查看运行状态
`systemctl status servertraffic.service`
#### Surge模块
```
#!name=CatVPS
#!desc=监控VPS流量信息和处理器、内存占用情况
#!author= 面板和脚本部分@Sestea @clydetime  VPS端部分 @Sestea 由 @整点猫咪 进行整理,biu更改时间为23.06.17
#!howto=将模块内容复制到本地后根据自己VPS IP地址及端口修改 http://127.0.0.1:7122



[Panel]
Serverinfo = script-name= Serverinfo,update-interval=3600

[Script]
Serverinfo = type=generic,script-path=https://raw.githubusercontent.com/getsomecat/GetSomeCats/Surge/script/serverinfo.js, argument = url=http://127.0.0.1:7122&name=Server Info
```
##### 注意这里的url最好提前用域名做好解析，以及Surge中需要让此域名直连。
