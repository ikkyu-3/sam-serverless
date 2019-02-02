import * as AWS from "aws-sdk";

export interface ILambdaResponse {
  statusCode: number;
  headers: object;
  body: string;
}

class LambdaResponse {
  public static awsError(e: AWS.AWSError): ILambdaResponse {
    return LambdaResponse.createResponse(e.statusCode, { message: e.message });
  }

  public static ok(body: object = { message: "OK" }): ILambdaResponse {
    return LambdaResponse.createResponse(200, body);
  }

  public static created(
    body: object = { message: "Created" }
  ): ILambdaResponse {
    return LambdaResponse.createResponse(201, body);
  }

  public static badRequest(
    body: object = { message: "Bad Request" }
  ): ILambdaResponse {
    return LambdaResponse.createResponse(400, body);
  }

  public static notFound(
    body: object = { message: "Not Found" }
  ): ILambdaResponse {
    return LambdaResponse.createResponse(404, body);
  }

  public static internalServerError(
    body: object = { message: "Internal Server Error" }
  ): ILambdaResponse {
    return LambdaResponse.createResponse(500, body);
  }

  private static createResponse(
    statusCode: number,
    body: object
  ): ILambdaResponse {
    return {
      body: JSON.stringify(body),
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
      },
      statusCode,
    };
  }
}

export default LambdaResponse;
