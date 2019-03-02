import { APIGatewayProxyEvent } from "aws-lambda";
import { readFile } from "fs";
import { google } from "googleapis";
import { promisify } from "util";
import LambdaResponse from "./lib/LambdaResponse";
import Validation, { IUserEnterBody, IUserSaveBody } from "./lib/Validation";
import Access from "./models/Access";
import User from "./models/User";

const readFilePromise = promisify(readFile);

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

/**
 * Step Functions: メール送信
 */
export async function sendMail(body: string) {
  const credentials = JSON.parse(
    await readFilePromise(`${__dirname}/json/credentials.json`, "utf8")
  );
  const token = JSON.parse(
    await readFilePromise(`${__dirname}/json/token.json`, "utf8")
  );

  const fromMailAddress = process.env.FROM_MAIL_ADDRESS!;
  const toMailAddress = process.env.TO_MAIL_ADDRESS!;

  const { client_id, client_secret, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  oAuth2Client.credentials = token;

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const date = new Date();
  const subject = `土曜開放入退室結果💪(${date.getFullYear()}年${date.getMonth() +
    1}月${date.getDate()}日)`;
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const messageParts = [
    `From: ${fromMailAddress}`,
    `To: ${toMailAddress}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: 7bit",
    "MIME-Version: 1.0",
    `Subject: ${utf8Subject}`,
    "",
    body,
  ];
  const message = messageParts.join("\n");

  // The body needs to be base64url encoded.
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  return res.status;
}
