module.exports = {
  preset: "jest-puppeteer",
  testRegex: "(/__tests__/.*|\\.(test|spec))\\.(tsx?|jsx?)$",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "json",
    "jsx"
  ],
};