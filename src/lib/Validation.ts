import { isString } from "lodash";

export interface IUserSaveBody {
  cardId: string;
  userId: string;
  name: string;
}

export interface IUserEnterBody {
  purpose: string;
}

class Validation {
  public static validateRequestBodyForSaving(
    body: string | null
  ): body is string {
    if (!isString(body)) {
      return false;
    }

    if (!Validation.canParseBody(body)) {
      return false;
    }

    const { cardId, userId, name } = JSON.parse(body);

    if (!Validation.cardIdRegExp.test(cardId)) {
      return false;
    }

    if (!Validation.userIdRegExp.test(userId)) {
      return false;
    }

    if (!isString(name)) {
      return false;
    }

    return true;
  }

  public static validateRequestBodyForEntering(
    body: string | null
  ): body is string {
    if (!isString(body)) {
      return false;
    }

    if (!Validation.canParseBody(body)) {
      return false;
    }

    const { purpose } = JSON.parse(body) as IUserEnterBody;

    if (!["MEET_UP", "STUDY", "WORK", "CIRCLE"].includes(purpose)) {
      return false;
    }

    return true;
  }

  public static validateCardId(
    pathParameters: { [name: string]: string } | null
  ): pathParameters is { [name: string]: string } {
    if (!pathParameters) {
      return false;
    }

    if (!Validation.cardIdRegExp.test(pathParameters.cardId)) {
      return false;
    }

    return true;
  }

  private static cardIdRegExp = /[0-9a-z]{16}/;
  private static userIdRegExp = /[0-9]{10}/;

  private static canParseBody(body: any): boolean {
    if (!body) {
      return false;
    }

    try {
      JSON.parse(body);
      return true;
    } catch (_) {
      return false;
    }
  }
}
export default Validation;
