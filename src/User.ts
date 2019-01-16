import * as AWS from "aws-sdk";
import BaseModel from "./BaseModel";
import LambdaResponse, { ILambdaResponse } from "./LambdaResponse";

export interface IUserBody {
  cardId: string;
  userId: string;
  name: string;
}

interface IUserItem {
  cardId: string;
  userId: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt?: string;
}

class User extends BaseModel {
  private readonly USERS_TABLE = process.env.USERS_TABLE || "";

  public async findByCardId(cardId: string): Promise<IUserItem | Error> {
    const response = await this.get({
      Key: { cardId },
      TableName: this.USERS_TABLE,
    });

    if (this.isError(response)) {
      return response;
    }

    if (!response.Item) {
      return new Error("not found");
    }

    return response.Item as IUserItem;
  }

  public async save({ cardId, userId, name }: IUserBody): Promise<ILambdaResponse> {
    const findResponse = await this.findByCardId(cardId);

    if (this.isError(findResponse)) {
      return LambdaResponse.notFound();
    }

    const now = new Date().toISOString();
    const putParams: AWS.DynamoDB.DocumentClient.PutItemInput = {
      Item: {
        cardId,
        createdAt: now,
        name,
        status: true,
        userId,
      },
      TableName: this.USERS_TABLE,
    };

    if (findResponse) {
      putParams.Item.createdAt = findResponse.createdAt;
      putParams.Item.updatedAt = now;
    }

    const putResponse = await this.put(putParams);
    if (this.isError(putResponse)) {
      return LambdaResponse.badRequest();
    }

    return LambdaResponse.created();
  }
}
export default User;
