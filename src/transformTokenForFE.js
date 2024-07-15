function dashToCamelCase(str) {
  return str.replace(/-([a-z0-9])/g, function (g) {
    return g[1].toUpperCase();
  });
}

const convertToVanillaExtractValue = (key, value) => {
  if (typeof value === "object") {
    const newValue = {};
    for (let k in value) {
      newValue[k] = convertToVanillaExtractValue(k, value[k]);
    }
    return newValue;
  } else if (typeof value === "number") {
    return key.endsWith("fontWeight") ? `${value}` : `${value}px`;
  }
  return value;
};

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
        result[prop] = convertToVanillaExtractValue(prop, value);
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

function getShadowStyles(obj) {
  const flattedJson = flattenObject(obj, "_");
  const shadowEffect = {};
  const others = {};

  Object.keys(flattedJson).forEach((key) => {
    if (flattedJson[key].hasOwnProperty("shadowType")) {
      const [tokenKey, index] = key.split("_");
      if (!shadowEffect[tokenKey]) {
        shadowEffect[tokenKey] = [];
      }
      shadowEffect[tokenKey][
        index
      ] = `${flattedJson[key].offsetX} ${flattedJson[key].offsetY} ${flattedJson[key].radius} ${flattedJson[key].spread} ${flattedJson[key].color}`;
    } else {
      others[key] = flattedJson[key];
    }
  });

  const shadow = {};
  Object.keys(shadowEffect).map((shadowKey) => {
    shadow[shadowKey] = shadowEffect[shadowKey].join(", ");
  });

  const result = [
    `export const shadow = ${JSON.stringify(shadow, null, 2)} as const;

`,
  ];

  if (Object.keys(others).length > 0) {
    result.push(
      `export const effect = ${JSON.stringify(others, null, 2)} as const;

`
    );
  }

  return result;
}

export { dashToCamelCase, flattenObject, getShadowStyles };
