import * as AWS from "aws-sdk";
import LambdaResponse, { ILambdaResponse } from "../lib/LambdaResponse";
import SamModel from "./SamModel";

export interface IAccessBody {
  purpose: string;
}

interface IRecord {
  entryTime: string;
  exitTime?: string;
  purpose: string;
}

interface IAccessItem {
  userId: string;
  date: string;
  name: string;
  records: IRecord[];
  createdAt: string;
  updatedAt?: string;
  version: number;
}

export interface IUser {
  userId: string;
  name: string;
  purpose: string;
  isEntry: boolean;
  entryTime: string;
  exitTime?: string;
}

class Access extends SamModel {
  private readonly ACCESSES_TABLE = process.env.ACCESSES_TABLE || "";

  public async getUserToday(userId: string): Promise<ILambdaResponse> {
    // GET
    const response = await this.findByUserId(userId);
    if (this.isAWSError(response)) {
      return LambdaResponse.awsError(response);
    }

    if (!response) {
      return LambdaResponse.notFound({ message: "Not Found", exists: true });
    }

    const record = response.records[response.records.length - 1];
    const user: IUser = {
      userId: response.userId,
      name: response.name,
      purpose: record.purpose,
      isEntry: !record.exitTime,
      entryTime: record.entryTime,
      exitTime: record.exitTime,
    };

    return LambdaResponse.ok(user);
  }

  public async executeEntryProcess(
    userId: string,
    name: string,
    purpose: string
  ): Promise<ILambdaResponse> {
    // GET
    const accessItem = await this.findByUserId(userId);
    if (this.isAWSError(accessItem)) {
      return LambdaResponse.awsError(accessItem);
    }

    const date = new Date();

    if (typeof accessItem === "undefined") {
      // 新規追加 createItem
      const item: IAccessItem = {
        userId,
        date: date.toLocaleDateString(),
        name,
        records: [
          {
            entryTime: date.toLocaleString(),
            purpose,
          },
        ],
        createdAt: date.toLocaleString(),
        version: 0,
      };

      const response = await this.put({
        TableName: this.ACCESSES_TABLE,
        Item: item,
      });

      if (this.isAWSError(response)) {
        return LambdaResponse.awsError(response);
      }

      return LambdaResponse.ok();
    } else {
      // 更新 updateItem
      const record = { entryTime: date.toLocaleString(), purpose };
      const response = await this.update({
        TableName: this.ACCESSES_TABLE,
        Key: { userId, date: date.toLocaleDateString() },
        UpdateExpression:
          "set #r = list_append(:r, :i), #u = :u, #v = :newVersion",
        ConditionExpression: "#v = :v",
        ExpressionAttributeNames: {
          "#r": "records",
          "#u": "updatedAt",
          "#v": "version",
        },
        ExpressionAttributeValues: {
          ":r": accessItem.records,
          ":i": [record],
          ":u": date.toLocaleString(),
          ":v": accessItem.version,
          ":newVersion": accessItem.version + 1,
        },
      });

      if (this.isAWSError(response)) {
        return LambdaResponse.awsError(response);
      }

      return LambdaResponse.ok();
    }
  }

  public async executeExitProcess(userId: string): Promise<ILambdaResponse> {
    const accessItem = await this.findByUserId(userId);
    if (this.isAWSError(accessItem)) {
      return LambdaResponse.awsError(accessItem);
    }

    if (typeof accessItem === "undefined") {
      return LambdaResponse.badRequest();
    }

    const date = new Date();

    const currentRcord = accessItem.records[accessItem.records.length - 1];
    currentRcord.exitTime = date.toLocaleString();

    const response = await this.update({
      TableName: this.ACCESSES_TABLE,
      Key: { userId, date: date.toLocaleDateString() },
      UpdateExpression: "set #r = :r, #u = :u, #v = :newVersion",
      ConditionExpression: "#v = :v",
      ExpressionAttributeNames: {
        "#r": "records",
        "#u": "updatedAt",
        "#v": "version",
      },
      ExpressionAttributeValues: {
        ":r": accessItem.records,
        ":u": date.toLocaleString(),
        ":v": accessItem.version,
        ":newVersion": accessItem.version + 1,
      },
    });

    if (this.isAWSError(response)) {
      return LambdaResponse.awsError(response);
    }

    return LambdaResponse.ok();
  }

  public async getUsersToday(): Promise<ILambdaResponse> {
    const response = await this.query({
      TableName: this.ACCESSES_TABLE,
      IndexName: "date-index",
      KeyConditionExpression: "#d = :d",
      ExpressionAttributeNames: { "#d": "date" },
      ExpressionAttributeValues: { ":d": new Date().toLocaleDateString() },
    });

    if (this.isAWSError(response)) {
      return LambdaResponse.awsError(response);
    }

    // レスポンスデータを作成
    const users: IUser[] = [];
    (response.Items! as IAccessItem[]).forEach(({ userId, name, records }) => {
      const record = records[records.length - 1];
      const user: IUser = {
        userId,
        name,
        purpose: record.purpose,
        isEntry: !record.exitTime,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
      };
      users.push(user);
    });

    return LambdaResponse.ok(users);
  }

  private async findByUserId(
    userId: string
  ): Promise<IAccessItem | undefined | AWS.AWSError> {
    const date = new Date();

    const response = await this.get({
      Key: { userId, date: date.toLocaleDateString() },
      TableName: this.ACCESSES_TABLE,
    });

    if (this.isAWSError(response)) {
      return response;
    }

    return response.Item as IAccessItem;
  }
}
export default Access;
