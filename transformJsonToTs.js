import * as fs from "fs";
import * as path from "path";
import { dashToCamelCase, flattenObject } from "./src/transformTokenForFE.js";

// 명령줄 인자로 JSON 파일 경로를 받기
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error("No JSON file path provided.");
  process.exit(1);
}

// JSON 파일 경로를 절대 경로로 변환
const absolutePath = path.resolve(jsonFilePath);

// JSON 파일 읽기
fs.readFile(absolutePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading JSON file:", err);
    process.exit(1);
  }

  const outputFileName = `${
    jsonFilePath.split("/").pop().split(".")[0]
  }DesignToken.ts`;

  // JSON 문자열을 파싱하여 객체로 변환
  let jsonData;
  try {
    jsonData = JSON.parse(data);
  } catch (parseErr) {
    console.error("Invalid JSON data:", parseErr);
    process.exit(1);
  }

  const tokenStrings = [];
  const tokenVariableNames = [];
  const aliasToken = {};

  for (let tokenName in jsonData) {
    const tokenVariableName = dashToCamelCase(tokenName);
    const flattedTokenJson = flattenObject(jsonData[tokenName], "_");
    const jsonString = JSON.stringify(flattedTokenJson, null, 2);

    if (/"__(.*?)__"/.test(jsonString)) {
      aliasToken[tokenVariableName] = {};
      for (let aliasTokenName in jsonData[tokenName]) {
        const flattedAliasTokenJson = flattenObject(
          jsonData[tokenName][aliasTokenName],
          "_"
        );
        aliasToken[tokenVariableName][aliasTokenName] = flattedAliasTokenJson;
      }
    } else {
      tokenVariableNames.push(tokenVariableName);
      tokenStrings.push(
        `export const ${tokenVariableName} = ${jsonString} as const;

`
      );
    }
  }

  const aliasTokenKeys = Object.keys(aliasToken);
  const pattern = `"__(${aliasTokenKeys.join("|")})\.(.*?)__"`;
  const regex = new RegExp(pattern, "g");
  for (let aliasName in aliasToken) {
    for (let aliasTokenName in aliasToken[aliasName]) {
      const string = JSON.stringify(
        aliasToken[aliasName][aliasTokenName],
        null,
        2
      );

      tokenVariableNames.push(aliasTokenName);
      tokenStrings.push(
        `export const ${aliasTokenName} = ${string.replace(
          regex,
          (match, p1, p2) => `"__${p2.replace("_", ".")}__"`
        )} as const;

`
      );
    }
  }

  const filePath = path.join("./fe", outputFileName);

  // TypeScript 파일에 쓰기
  fs.writeFile(
    filePath,
    `// !이 파일은 자동 생성된 파일이니까 수기로 수정하지 마세요! 임의로 수정 노노!

${tokenStrings.join("").replace(/"__(.*?)__"/g, "$1")}`,
    (writeErr) => {
      if (writeErr) {
        console.error("Error writing TypeScript file:", writeErr);
        process.exit(1);
      }
      console.log(`JSON data has been saved to ${outputFileName}`);
    }
  );
});
