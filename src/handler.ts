import { APIGatewayProxyEvent } from "aws-lambda";
import Access from "./Access";
import LambdaResponse from "./LambdaResponse";
import User from "./User";
import Validation, { IUserEnterBody, IUserSaveBody } from "./Validation";

// Setting Time Zone
process.env.TZ = "Asia/Tokyo";
const options = {
  region: process.env.REGION,
  endpoint: process.env.END_POINT,
};

/**
 * PUT /user
 */
export async function putUser(event: APIGatewayProxyEvent) {
  const { body } = event;

  if (!Validation.validateRequestBodyForSaving(body)) {
    return LambdaResponse.badRequest();
  }

  const obj = JSON.parse(body) as IUserSaveBody;
  const response = await new User(options).save(obj);

  return response;
}

/**
 * GET /user/{cardId}
 */
export async function getUserStatus(event: APIGatewayProxyEvent) {
  const { pathParameters } = event;

  if (!Validation.validateCardId(pathParameters)) {
    return LambdaResponse.badRequest();
  }

  const user = new User(options);
  const findResponse = await user.findByCardId(pathParameters.cardId);

  if (user.isAWSError(findResponse)) {
    return LambdaResponse.badRequest({ message: findResponse.message });
  }

  if (typeof findResponse === "undefined") {
    return LambdaResponse.notFound({ message: "Not Found", exists: false });
  }

  const response = await new Access(options).getUserToday(findResponse.userId);
  return response;
}

/**
 * PUT /user/{cardId}/entry
 */
export async function putUserEntry(event: APIGatewayProxyEvent) {
  const { body, pathParameters } = event;
  if (!Validation.validateCardId(pathParameters)) {
    return LambdaResponse.badRequest();
  }
  if (!Validation.validateRequestBodyForEntering(body)) {
    return LambdaResponse.badRequest();
  }

  const user = new User(options);
  const findResponse = await user.findByCardId(pathParameters.cardId);
  if (user.isAWSError(findResponse)) {
    return LambdaResponse.badRequest({ message: findResponse.message });
  }
  if (typeof findResponse === "undefined") {
    return LambdaResponse.notFound({ message: "Not Found", exists: false });
  }

  const { userId, name } = findResponse;
  const { purpose } = JSON.parse(body) as IUserEnterBody;

  const response = await new Access(options).executeEntryProcess(
    userId,
    name,
    purpose
  );

  return response;
}

/**
 * PUT /user/{cardId}/exit
 */
export async function putUserExit(event: APIGatewayProxyEvent) {
  const { pathParameters } = event;
  if (!Validation.validateCardId(pathParameters)) {
    return LambdaResponse.badRequest();
  }

  const user = new User(options);
  const findResponse = await user.findByCardId(pathParameters.cardId);

  if (user.isAWSError(findResponse)) {
    return LambdaResponse.badRequest({ message: findResponse.message });
  }
  if (typeof findResponse === "undefined") {
    return LambdaResponse.notFound({ message: "Not Found", exists: false });
  }

  const { userId } = findResponse;
  const response = await new Access(options).executeExitProcess(userId);

  return response;
}

/**
 * GET /users
 */
export async function getUsers() {
  const response = await new Access(options).getUsersToday();
  return response;
}
