/**
 * Standardized API response helpers
 */

function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function error(res, message, statusCode = 500, detail = null) {
  const body = { success: false, error: message };
  if (detail !== null && detail !== undefined) {
    body.detail = detail;
  }
  return res.status(statusCode).json(body);
}

module.exports = { success, error };
