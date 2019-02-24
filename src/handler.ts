import { APIGatewayProxyEvent } from "aws-lambda";
import LambdaResponse from "./lib/LambdaResponse";
import Validation, { IUserEnterBody, IUserSaveBody } from "./lib/Validation";
import Access from "./models/Access";
import User from "./models/User";

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
  const response = await new Access(options).getParticipants();
  return response;
}

/**
 * Step Functions: 退出処理
 */
export async function executeExitProcessAll() {
  return await new Access(options).executeExitProcessAll();
}

/**
 * Step Functions: 本日の入退室情報を取得
 */
export async function getAccessesOfTody() {
  return await new Access(options).createMailMessage();
}
