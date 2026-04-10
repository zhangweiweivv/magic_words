/**
 * 日期工具函数 - 统一使用北京时间 (Asia/Shanghai)
 * 避免 toISOString() 返回 UTC 日期导致跨日不准
 */

const TIMEZONE = 'Asia/Shanghai';

/**
 * 获取北京时间的今日日期 (YYYY-MM-DD)
 */
function getTodayDateCST() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
}

/**
 * 获取北京时间的当前时间 (HH:MM)
 */
function getNowTimeCST() {
  return new Date().toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
}

/**
 * 获取北京时间的 N 天后日期 (YYYY-MM-DD)
 */
function getDateAfterDaysCST(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
}

/**
 * 获取北京时间的 N 天前日期 (YYYY-MM-DD)
 */
function getDateBeforeDaysCST(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
}

/**
 * 将 Date 对象转为北京时间日期字符串 (YYYY-MM-DD)
 */
function toDateStrCST(date) {
  return date.toLocaleDateString('sv-SE', { timeZone: TIMEZONE });
}

module.exports = {
  getTodayDateCST,
  getNowTimeCST,
  getDateAfterDaysCST,
  getDateBeforeDaysCST,
  toDateStrCST
};
