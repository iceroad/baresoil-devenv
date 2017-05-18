module.exports = function jsonSummary(val, maxChars) {
  const len = maxChars || 140;
  let jsonStr = JSON.stringify(val) || '(undefined)';
  if (jsonStr.length > len) {
    jsonStr = `${jsonStr.substr(0, len)}… (${Math.ceil(jsonStr.length / 1024)} kb)`;
  }
  return jsonStr;
};
