export interface ILambdaResponse {
  statusCode: number;
  headers: object;
  body: string;
}


class LambdaResponse {
  public static ok(message: string = "OK"): ILambdaResponse {
    return LambdaResponse.createResponse(200, message);
  }

  public static created(message: string = "Created"): ILambdaResponse {
    return LambdaResponse.createResponse(201, message);
  }

  public static badRequest(message: string = "Bad Request"): ILambdaResponse {
    return LambdaResponse.createResponse(400, message);
  }

  public static notFound(message: string = "Not Found"): ILambdaResponse {
    return LambdaResponse.createResponse(404, message);
  }

  public static internalServerError(message: string = "Internal Server Error"): ILambdaResponse {
    return LambdaResponse.createResponse(500, message);
  }

  private static createResponse(statusCode: number, body: string): ILambdaResponse {
    return {
      body,
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
      },
      statusCode,
    }
  }
}

export default LambdaResponse;
