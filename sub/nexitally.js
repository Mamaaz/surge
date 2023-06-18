const getArgs = (url) => {
  return Object.fromEntries(
    url
      .slice(url.indexOf("?") + 1)
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
};

const getUserInfo = (url) => {
  let request = { headers: { "User-Agent": "Quantumult%20X" }, url };
  return new Promise((resolve, reject) =>
    $httpClient.head(request, (err, resp) => {
      if (err != null) {
        reject(err);
        return;
      }
      if (resp.status !== 200) {
        reject("Not Available");
        return;
      }
      let header = Object.keys(resp.headers).find(
        (key) => key.toLowerCase() === "subscription-userinfo"
      );
      if (header) {
        resolve(resp.headers[header]);
        return;
      }
      reject("链接响应头不带有流量信息");
    })
  );
};

const getDataInfo = async (url) => {
  try {
    const data = await getUserInfo(url);
    return Object.fromEntries(
      data
        .match(/\w+=\d+/g)
        .map((item) => item.split("="))
        .map(([k, v]) => [k, parseInt(v)])
    );
  } catch (err) {
    console.log(err);
  }
};

const getRemainingDays = (today, resetDay, year, month) => {
  if (!resetDay) return 0;
  let daysInMonth = new Date(year, month + 1, 0).getDate();
  if (resetDay > today) daysInMonth = 0;

  return daysInMonth - today + resetDay;
};

const bytesToSize = (bytes) => {
  if (bytes === 0) return "0B";
  let k = 1024;
  sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
};

const formatTime = (time) => {
  let dateObj = new Date(time);
  let year = dateObj.getFullYear();
  let month = dateObj.getMonth() + 1;
  let day = dateObj.getDate();
  return year + "/" + month + "/" + day + "";
};

const postNotification = (title, subtitle, body) => {
  $notification.post(title, subtitle, body);
};

const is_enhanced_mode = () => {
  return new Promise((resolve) =>
    $httpAPI("GET", "v1/features/enhanced_mode", null, (data) => {
      resolve(data.enabled);
    })
  );
};

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
};

const get_time = () => {
  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;
  return hour + ":" + minutes;
};

(async () => {
  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();
  let args = getArgs($request.url);
  let resetDay = parseInt(args["due_day"] || args["reset_day"]);
  let resetDayLeft = getRemainingDays(today, resetDay, year, month);

  let is_enhanced = await is_enhanced_mode();
  if (is_enhanced) await sleep(2000)
  let usage = await getDataInfo(args.url);
  if (!usage) {
    $done({})
    return;
  }
  let used = usage.download + usage.upload;
  let total = usage.total;
  let expire = usage.expire || args.expire;
  let localProxy = '=http, localhost, 6152'
  let infoList = [`${bytesToSize(used)} | ${bytesToSize(total-used)}`];

  if (resetDayLeft) {
    infoList.push(`重置: 剩余${resetDayLeft}天`);
  }
  if (expire) {
    if (/^[\d.]+$/.test(expire)) expire *= 1000;
    infoList.push(`到期: ${formatTime(expire)}`);
  }

  // Replace sendNotification with postNotification
  postNotification(used / total, expire, infoList);
  infoList.push(`更新: ${get_time()}`)
  let body = infoList.map(item => item+localProxy).join("\n");
  $done({ response: { body} });
})();
