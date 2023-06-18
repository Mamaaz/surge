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

        const inbound = `入站: ${bytesToGB(Data.bytes_recv)} GB`.padEnd(20);
        const outbound = `出站: ${bytesToGB(Data.bytes_sent)} GB`;
        const usage = `用量: ${bytesToGB(Data.bytes_total)} GB`.padEnd(20);
        const total = `总量: 200 GB`;
        const cpuUsage = `CPU: ${parseFloat(Data.cpu_usage).toFixed(2)}%`.padEnd(20);
        const memoryUsage = `内存: ${parseFloat(Data.mem_usage).toFixed(2)}%`;
        const sendRate = Data.send_rate ? `↑: ${parseFloat(Data.send_rate).toFixed(2)} Mbps`.padEnd(20) : '发送速率: 数据还未准备好';
        const recvRate = Data.recv_rate ? `↓: ${parseFloat(Data.recv_rate).toFixed(2)} Mbps` : '接收速率: 数据还未准备好';

        // Set title with sendRate and recvRate
        panel.title = arg?.title || `Wiki-KR   ${sendRate} | ${recvRate}`;

        panel.content = `运行时间：${secondsToDhms(Data.uptime)}\n` +
            `内存使用：${Data.max_mem_process_name}\n` +
            `${inbound}| ${outbound}\n` +
            `${usage}| ${total}\n` +
            `${cpuUsage}| ${memoryUsage}\n` +
            `服务到期时间：♾️`;

        $done(panel);
    }
});
