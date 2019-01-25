import * as AWS from "aws-sdk";
import BaseModel from "./BaseModel";
import LambdaResponse, { ILambdaResponse } from "./LambdaResponse";

export interface IUserBody {
  cardId: string;
  userId: string;
  name: string;
}

export interface IUserItem {
  cardId: string;
  userId: string;
  name: string;
  status: boolean;
  createdAt: string;
  updatedAt?: string;
  version: number;
}

class User extends BaseModel {
  private readonly USERS_TABLE = process.env.USERS_TABLE || "";


  public async findByCardId(cardId: string): Promise<IUserItem | undefined | AWS.AWSError> {
    const response = await this.get({
      Key: { cardId },
      TableName: this.USERS_TABLE,
    });

    if (this.isAWSError(response)) {
      return response;
    }

    return response.Item as IUserItem;
  }

  public async save({ cardId, userId, name }: IUserBody): Promise<ILambdaResponse> {
    const findResponse = await this.findByCardId(cardId);
    if (this.isAWSError(findResponse)) {
      return LambdaResponse.awsError(findResponse);
    }

    const now = new Date().toISOString();
    if (typeof findResponse !== "undefined") {
      if (findResponse.userId === userId) {
        const updateResponse = await this.update({
          TableName: this.USERS_TABLE,
          Key: { cardId },
          UpdateExpression: "set #n = :n, #u = :u, #v = :newVersion",
          ConditionExpression: "#v = :v",
          ExpressionAttributeNames: {
            "#n": "name",
            "#u": "updatedAt",
            "#v": "version",
          },
          ExpressionAttributeValues: {
            ":n": name,
            ":u": now,
            ":v": findResponse.version,
            ":newVersion": findResponse.version + 1,
          }
        });

        if (this.isAWSError(updateResponse)) {
          return LambdaResponse.awsError(updateResponse);
        }

        return LambdaResponse.created();
      } else {
        return LambdaResponse.badRequest();
      }
    } else {
      const putResponse = await this.put({
        Item: {
          cardId,
          createdAt: now,
          name,
          status: true,
          userId,
          version: 0,
        },
        TableName: this.USERS_TABLE,
      });

      if (this.isAWSError(putResponse)) {
        return LambdaResponse.awsError(putResponse);
      }

      return LambdaResponse.created();
    }
  }

}
export default User;
