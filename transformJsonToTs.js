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
  for (let tokenName in jsonData) {
    const tokenVariableName = dashToCamelCase(tokenName);
    const flattedTokenJson = flattenObject(jsonData[tokenName], "_");

    tokenStrings.push(
      `const ${tokenVariableName} = ${JSON.stringify(
        flattedTokenJson,
        null,
        2
      )} as const;
  
`
    );
  }

  tokenStrings.sort((a, b) => {
    const regex = /"__(.*?)__"/;

    if (regex.test(a)) {
      return 1;
    } else if (regex.test(b)) {
      return -1;
    }
    return 0;
  });

  const filePath = path.join("./fe", outputFileName);

  // TypeScript 파일에 쓰기
  fs.writeFile(
    filePath,
    tokenStrings.join("").replace(/"__(.*?)__"/g, "$1"),
    (writeErr) => {
      if (writeErr) {
        console.error("Error writing TypeScript file:", writeErr);
        process.exit(1);
      }
      console.log(`JSON data has been saved to ${outputFileName}`);
    }
  );
});
