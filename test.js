class logger {
  static consoleRaw = console
  static log(message) {
    message = `[ LOG ] ${message}`
    this.consoleRaw.log(message)
  }

  static error(message) {
    message = `[ ERROR ] ${message}`
    this.consoleRaw.log(message)
  }
}

let args = getArgs();

(async () => {
  let info = await getDataInfo(args.url);
  if (!info) $done();
  let resetDayLeft = getRmainingDays(parseInt(args["reset_day"]));

  let used = info.download + info.upload;
  let total = info.total;
  let expire = args.expire || info.expire;
  let content = [`用量：${bytesToSize(used)} ♾️ ${bytesToSize(total)}`];

  if (resetDayLeft) {
    content.push(`重置：剩余${resetDayLeft}天`);
  }
  if (expire && expire !== "false") {
    if (/^[\d.]+$/.test(expire)) expire *= 1000;
    content.push(`到期：${formatTime(expire)}`);
  }

  let now = new Date();
  let hour = now.getHours();
  let minutes = now.getMinutes();
  hour = hour > 9 ? hour : "0" + hour;
  minutes = minutes > 9 ? minutes : "0" + minutes;

  $done({
    title: `${args.title} | ${hour}:${minutes}`,
    content: content.join("\n"),
  });

  logger.log("脚本执行完毕，生成的结果是：\n" + content.join("\n"));
})();

// 省略了其他函数的定义

