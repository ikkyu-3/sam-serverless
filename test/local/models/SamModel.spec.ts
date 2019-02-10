/* tslint:disable no-console */
import * as AWS from "aws-sdk";
import SamModel from "../../../src/models/SamModel";
import {
  createTestTableInput,
  endpoint,
  region,
  testItemInput,
  testTable,
} from "../../testData";

class TestModel extends SamModel {
  constructor(
    options: AWS.DynamoDB.DocumentClient.DocumentClientOptions &
      AWS.DynamoDB.Types.ClientConfiguration
  ) {
    super(options);
  }
  public isAWSError(response: any): response is AWS.AWSError {
    return super.isAWSError(response);
  }

  public async get(
    params: AWS.DynamoDB.DocumentClient.GetItemInput
  ): Promise<AWS.DynamoDB.DocumentClient.GetItemOutput | AWS.AWSError> {
    return super.get(params);
  }

  public async put(
    params: AWS.DynamoDB.DocumentClient.PutItemInput
  ): Promise<AWS.DynamoDB.DocumentClient.PutItemOutput | AWS.AWSError> {
    return super.put(params);
  }

  public async update(
    params: AWS.DynamoDB.DocumentClient.UpdateItemInput
  ): Promise<AWS.DynamoDB.DocumentClient.UpdateItemOutput | AWS.AWSError> {
    return super.update(params);
  }

  public async query(
    params: AWS.DynamoDB.DocumentClient.QueryInput
  ): Promise<AWS.DynamoDB.DocumentClient.QueryOutput | AWS.AWSError> {
    return super.query(params);
  }
}

describe("SamModel.ts", () => {
  const dynamo = new AWS.DynamoDB({ endpoint, region });
  const testModel = new TestModel({ endpoint, region });

  beforeAll(async () => {
    try {
      await dynamo.createTable(createTestTableInput).promise();
      await dynamo.putItem(testItemInput).promise();
    } catch (e) {
      console.error("初期化に失敗しました。", e);
    }
  });

  afterAll(async () => {
    try {
      await dynamo.deleteTable({ TableName: testTable }).promise();
    } catch (e) {
      console.error("テーブル削除に失敗しました。", e);
    }
  });

  describe("isAWSError", () => {
    it("statusCode, messageプロパティを持つオブジェクトを渡すとtrueを返す", () => {
      expect(
        testModel.isAWSError({
          message: "test",
          statusCode: 200,
        })
      ).toBeTruthy();
    });

    it("nullを渡すとfalseを返す", () => {
      expect(testModel.isAWSError(null)).toBeFalsy();
    });
  });

  describe("get", () => {
    it("指定した項目が取得できる", async () => {
      const response = (await testModel.get({
        Key: { Id: "0000000001" },
        TableName: testTable,
      })) as AWS.DynamoDB.DocumentClient.GetItemOutput;
      expect(response).toEqual({
        Item: { Id: "0000000001", Name: "名前" },
      });
    });

    it("該当がない場合は、空のオブジェクトが取得できる", async () => {
      const response = (await testModel.get({
        Key: { Id: "0000000002" },
        TableName: testTable,
      })) as AWS.DynamoDB.DocumentClient.GetItemOutput;
      expect(response).toEqual({});
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = (await testModel.get({
        Key: {},
        TableName: testTable,
      })) as AWS.AWSError;
      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });

  describe("put", () => {
    it("項目を追加できる", async () => {
      await testModel.put({
        Item: { Id: "0000000002", Name: "name" },
        TableName: testTable,
      });

      // 検証
      const response = (await dynamo
        .getItem({
          Key: {
            Id: {
              S: "0000000002",
            },
          },
          TableName: testTable,
        })
        .promise()) as AWS.DynamoDB.GetItemOutput;
      expect(response.Item!.Id.S).toBe("0000000002");
      expect(response.Item!.Name.S).toBe("name");
    });

    it("項目を変更できる", async () => {
      await testModel.put({
        Item: { Id: "0000000002", Name: "name2", Age: 31 },
        TableName: testTable,
      });

      // 検証
      const response = (await dynamo
        .getItem({
          Key: {
            Id: { S: "0000000002" },
          },
          TableName: testTable,
        })
        .promise()) as AWS.DynamoDB.GetItemOutput;
      expect(response.Item!.Id.S).toBe("0000000002");
      expect(response.Item!.Name.S).toBe("name2");
      expect(response.Item!.Age.N).toBe("31");
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = (await testModel.put({
        Item: {},
        TableName: testTable,
      })) as AWS.AWSError;
      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });

  describe("update", () => {
    it("指定した項目を更新できる", async () => {
      await dynamo
        .putItem({
          Item: {
            Id: { S: "0000000003" },
            Name: { S: "名前3" },
          },
          ReturnConsumedCapacity: "TOTAL",
          TableName: testTable,
        })
        .promise();

      await testModel.update({
        ExpressionAttributeNames: { "#n": "Name" },
        ExpressionAttributeValues: { ":n": "name3" },
        Key: { Id: "0000000003" },
        TableName: testTable,
        UpdateExpression: "SET #n = :n",
      });

      const result = (await dynamo
        .getItem({
          Key: {
            Id: { S: "0000000003" },
          },
          TableName: testTable,
        })
        .promise()) as AWS.DynamoDB.GetItemOutput;

      expect(result.Item!.Name.S).toBe("name3");
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = (await testModel.update({
        ConditionExpression: "SET #n = :n",
        ExpressionAttributeNames: { "#n": "Name" },
        ExpressionAttributeValues: { ":n": "name3" },
        Key: { Id: "0000000003" },
        TableName: testTable,
      })) as AWS.AWSError;

      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });

  describe("query", () => {
    it("項目を取得できる", async () => {
      const response = (await testModel.query({
        ExpressionAttributeNames: { "#key": "Id" },
        ExpressionAttributeValues: { ":value": "0000000001" },
        KeyConditionExpression: "#key = :value",
        TableName: testTable,
      })) as AWS.DynamoDB.DocumentClient.QueryOutput;
      expect(response.Items).toEqual([{ Id: "0000000001", Name: "名前" }]);
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = (await testModel.query({
        ExpressionAttributeNames: { "#key": "Id" },
        ExpressionAttributeValues: { ":value": "001" },
        KeyConditionExpression: "",
        TableName: testTable,
      })) as AWS.AWSError;
      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });
});
