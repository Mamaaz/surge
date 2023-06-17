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
#!/usr/bin/env python3
# Sestea

import http.server
import socketserver
import json
import time
import psutil

# The port number of the local HTTP server, which can be modified
PORT = 8288

class RequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        # Limit the HTTP server to one request per second
        time.sleep(1)

        # Get the last statistics time
        last_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())

        # Find the process with maximum memory usage
        max_mem_process = None
        for proc in psutil.process_iter(['pid', 'name', 'memory_percent']):
            if max_mem_process is None or proc.info['memory_percent'] > max_mem_process.info['memory_percent']:
                max_mem_process = proc

        # Construct JSON dictionary
        response_dict = {
            "utc_timestamp": int(time.time()),
            "uptime": int(time.time() - psutil.boot_time()),
            "cpu_usage": psutil.cpu_percent(),
            "mem_usage": psutil.virtual_memory().percent,
            "bytes_sent": str(psutil.net_io_counters().bytes_sent),
            "bytes_recv": str(psutil.net_io_counters().bytes_recv),
            "bytes_total": str(psutil.net_io_counters().bytes_sent + psutil.net_io_counters().bytes_recv),
            "last_time": last_time,
            "max_mem_process_pid": max_mem_process.info['pid'],
            "max_mem_process_name": max_mem_process.info['name'],
            "max_mem_process_usage": max_mem_process.info['memory_percent']
        }

        # Convert JSON dictionary to JSON string
        response_json = json.dumps(response_dict).encode('utf-8')
        self.wfile.write(response_json)

with socketserver.ThreadingTCPServer(("", PORT), RequestHandler) as httpd:
    try:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("KeyboardInterrupt is captured, program exited")

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
