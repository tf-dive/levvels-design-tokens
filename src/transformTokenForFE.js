function dashToCamelCase(str) {
  return str.replace(/-([a-z0-9])/g, function (g) {
    return g[1].toUpperCase();
  });
}

function flattenObject(obj, chainKey = ".") {
  const result = {};

  function recurse(cur, prop) {
    if (cur && typeof cur === "object" && !Array.isArray(cur)) {
      if ("value" in cur) {
        let value = cur.value;
        if (typeof cur.value === "string" && /^\{.*?\}$/.test(cur.value)) {
          const keys = cur.value.replace(/\{|\}/g, "").split(".");
          const tokenName = keys.shift();
          value = `__${dashToCamelCase(tokenName)}.${keys
            .map(dashToCamelCase)
            .join("_")}__`;
        }
        result[prop] = value;
      } else {
        for (let p in cur) {
          const camelCaseProp = dashToCamelCase(p);
          recurse(
            cur[p],
            prop ? prop + chainKey + camelCaseProp : camelCaseProp
          );
        }
      }
    }
  }

  recurse(obj, "");

  return result;
}

export { dashToCamelCase, flattenObject };
