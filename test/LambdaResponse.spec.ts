import LambdaResponse from "../src/LambdaResponse";

const baseResponse = {
  headers: {
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Origin": "*",
  },
}
const obj = { test: "test" };
const objStr = JSON.stringify(obj);


describe("LamdbaResponse.ts", () => {
  describe("awsError", () => {
    it("AWSErrorオブジェクトを引数に渡すと、レスポンスが作成できる", () => {
      const awsError = { message: "message", statusCode: 400 } as any;
      const result = LambdaResponse.awsError(awsError as AWS.AWSError);
      expect(result).toEqual({
        ...baseResponse,
        body: JSON.stringify({ message: awsError.message }),
        statusCode: awsError.statusCode,
      })
    });
  });

  describe("ok", () => {
    it("Status Code: 200のレスポンスが作成できる", () => {
      const result = LambdaResponse.ok();
      expect(result).toEqual({
        ...baseResponse,
        body: JSON.stringify({ message: "OK"}),
        statusCode: 200,
      });
    });

    it("引数に文字列を渡すと、bodyプロパティに値がセットされる", () => {
      const result = LambdaResponse.ok(obj);
      expect(result.body).toBe(objStr);
    });
  });

  describe("created", () => {
    it("Status Code: 201のレスポンスが作成できる", () => {
      const result = LambdaResponse.created();
      expect(result).toEqual({
        ...baseResponse,
        body: JSON.stringify({ message: "Created"}),
        statusCode: 201,
      });
    });

    it("引数に文字列を渡すと、bodyプロパティに値がセットされる", () => {
      const result = LambdaResponse.created(obj);
      expect(result.body).toBe(objStr);
    });
  });

  describe("badRequest", () => {
    it("Status Code: 400のレスポンスが作成できる", () => {
      const result = LambdaResponse.badRequest();
      expect(result).toEqual({
        ...baseResponse,
        body: JSON.stringify({ message: "Bad Request" }),
        statusCode: 400,
      });
    });

    it("引数に文字列を渡すと、bodyプロパティに値がセットされる", () => {
      const result = LambdaResponse.badRequest(obj);
      expect(result.body).toBe(objStr);
    });
  });

  describe("notFound", () => {
    it("Status Code: 404のレスポンスが作成できる", () => {
      const result = LambdaResponse.notFound();
      expect(result).toEqual({
        ...baseResponse,
        body: JSON.stringify({ message: "Not Found" }),
        statusCode: 404,
      });
    });

    it("引数に文字列を渡すと、bodyプロパティに値がセットされる", () => {
      const result = LambdaResponse.notFound(obj);
      expect(result.body).toBe(objStr);
    });
  });

  describe("internalServerError", () => {
    it("Status Code: 500のレスポンスが作成できる", () => {
      const result = LambdaResponse.internalServerError();
      expect(result).toEqual({
        ...baseResponse,
        body: JSON.stringify({ message: "Internal Server Error" }),
        statusCode: 500,
      });
    });

    it("引数に文字列を渡すと、bodyプロパティに値がセットされる", () => {
      const result = LambdaResponse.internalServerError(obj);
      expect(result.body).toBe(objStr);
    });
  });
});