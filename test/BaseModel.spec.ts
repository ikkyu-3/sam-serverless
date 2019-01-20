import * as AWS from "aws-sdk"
import BaseModel from "../src/BaseModel";



class TestModel extends BaseModel {
  constructor(options: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration) {
    super(options);
  }
  public isAWSError(response: any):response is AWS.AWSError {
    return super.isAWSError(response);
  }

  public async get(params: AWS.DynamoDB.DocumentClient.GetItemInput): Promise<AWS.DynamoDB.DocumentClient.GetItemOutput | AWS.AWSError> {
    return super.get(params);
  }

  public async put(params: AWS.DynamoDB.DocumentClient.PutItemInput): Promise<AWS.DynamoDB.DocumentClient.PutItemOutput | AWS.AWSError> {
    return super.put(params);
  }

  public async query(params: AWS.DynamoDB.DocumentClient.QueryInput): Promise<AWS.DynamoDB.DocumentClient.QueryOutput | AWS.AWSError> {
    return super.query(params);
  }
}

const tableName = "Test";

const createTableInput: AWS.DynamoDB.CreateTableInput = {
  AttributeDefinitions: [
    {
      AttributeName: "Id",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "Id",
      KeyType: "HASH",
    }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  },
  TableName: tableName,
};

const endpoint = "http://localhost:8000";
const region = "ap-northeast-1";

describe("BaseModel.ts", () => {
  const dynamo = new AWS.DynamoDB({ endpoint, region });
  const testModel = new TestModel({ endpoint, region });

  beforeAll(async () => {
    try {
      await dynamo.createTable(createTableInput).promise();
      await dynamo.putItem({
        Item: {
          "Id": {
            S: "001",
          },
          "Name": {
            S: "名前",
          }
        },
        ReturnConsumedCapacity: "TOTAL",
        TableName: tableName,
      }).promise();
    } catch(e) {
      console.error("初期化に失敗しました。", e);
    }
  });

  afterAll(async () => {
    try {
      await dynamo.deleteTable({ TableName: tableName }).promise();
    } catch (e) {
      console.error("テーブル削除に失敗しました。", e);
    }
  });

  describe("isAWSError", () => {
    it("statusCode, messageプロパティを持つオブジェクトを渡すとtrueを返す", () => {
      expect(testModel.isAWSError({
        message: "test",
        statusCode: 200,
      })).toBeTruthy();
    });

    it("nullを渡すとfalseを返す", () => {
      expect(testModel.isAWSError(null)).toBeFalsy();
    });
  });

  describe("get", () => {
    it("指定した項目が取得できる", async () => {
      const response = await testModel.get({
        Key: { Id: "001" },
        TableName: tableName,
      }) as AWS.DynamoDB.DocumentClient.GetItemOutput;
      expect(response).toEqual({
        Item: { Id: "001", Name: "名前" },
      });
    });

    it("該当がない場合は、空のオブジェクトが取得できる", async () => {
      const response = await testModel.get({
        Key: { Id: "002"},
        TableName: tableName,
      }) as AWS.DynamoDB.DocumentClient.GetItemOutput;
      expect(response).toEqual({});
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = await testModel.get({
        Key: {},
        TableName: tableName,
      }) as AWS.AWSError;
      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });

  describe("put", () => {
    it("項目を追加できる", async () => {
      await testModel.put({
        Item: { Id: "002", Name: "name" },
        TableName: tableName,
      });
      const response = await testModel.get({
        Key: { Id: "002" },
        TableName: tableName,
      }) as AWS.DynamoDB.DocumentClient.GetItemOutput;
      expect(response).toEqual({
        Item: { Id: "002", Name: "name" },
      });
    });

    it("項目を変更できる", async () => {
      await testModel.put({
        Item: { Id: "002", Name: "name2", Age: 31 },
        TableName: tableName,
      });
      const response = await testModel.get({
        Key: { Id: "002" },
        TableName: tableName,
      }) as AWS.DynamoDB.DocumentClient.GetItemOutput;
      expect(response).toEqual({
        Item: { Id: "002", Name: "name2", Age: 31 },
      });
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = await testModel.put({
        Item: {},
        TableName: tableName,
      }) as AWS.AWSError;
      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });

  describe("query", () => {
    it("項目を取得できる", async () => {
      const response = await testModel.query({
        ExpressionAttributeNames: { "#key": "Id" },
        ExpressionAttributeValues: { ":value": "001" },
        KeyConditionExpression: "#key = :value",
        TableName: tableName,
      }) as AWS.DynamoDB.DocumentClient.QueryOutput;
      expect(response.Items).toEqual([{ Id: "001", Name: "名前" }]);
    });

    it("例外が発生した場合は、AWSErrorを返す", async () => {
      const response = await testModel.query({
        ExpressionAttributeNames: { "#key": "Id" },
        ExpressionAttributeValues: { ":value": "001" },
        KeyConditionExpression: "",
        TableName: tableName,
      }) as AWS.AWSError;
      expect(response.statusCode).toEqual(expect.any(Number));
      expect(response.message).toEqual(expect.any(String));
    });
  });
});
