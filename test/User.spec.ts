import * as AWS from "aws-sdk";
import User, { IUserItem } from "../src/User";

const tableName = "User";
process.env.USERS_TABLE = "User";

const createTableInput: AWS.DynamoDB.CreateTableInput = {
  AttributeDefinitions: [
    {
      AttributeName: "cardId",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "cardId",
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
const dynamo = new AWS.DynamoDB({ endpoint, region });
const user = new User({ endpoint, region });

describe("BaseModel.ts", () => {
  beforeAll(async () => {
    try {
      await dynamo.createTable(createTableInput).promise();
      await dynamo.putItem({
        Item: {
          cardId: { S: "xxxxxxxxxxxxxxxx" },
          createdAt: { S: "YYYY-MM-DDTHH:mm:ss.sss" },
          name: { S: "name" },
          status: { BOOL: true },
          userId: { S: "0000000001" },
          version: { N: "0" },
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

  describe("findByCardId", () => {
    it("cardIdに該当する項目を取得できる", async () => {
      const response = await user.findByCardId("xxxxxxxxxxxxxxxx") as IUserItem;
      expect(response.userId).toBe("0000000001");
      expect(response.name).toBe("name");
      expect(response.status).toBe(true);
      expect(response.createdAt).toBe("YYYY-MM-DDTHH:mm:ss.sss");
      expect(response.version).toBe(0);
    });

    it("cardIdに該当しない場合はundefinedを返す", async () => {
      const response = await user.findByCardId("yyyyyyyyyyyyyyyy");
      expect(response).toBeUndefined();
    });
  });

  describe("save", () => {
    it("新規に項目ができる", async () => {
      const response = await user.save({
        cardId: "zzzzzzzzzzzzzzzz",
        name: "name2",
        userId: "0000000002",
      });
      expect(response.statusCode).toBe(201);

      // 検証
      const newUser = await dynamo.getItem({
        Key: { cardId: { S: "zzzzzzzzzzzzzzzz" } },
        TableName: tableName,
      }).promise() as AWS.DynamoDB.GetItemOutput;
      expect(newUser.Item!.userId.S).toBe("0000000002");
      expect(newUser.Item!.name.S).toBe("name2");
      expect(newUser.Item!.status.BOOL).toBe(true);
      expect(newUser.Item!.createdAt.S).toEqual(expect.any(String));
      expect(newUser.Item!.updatedAt).toBeUndefined();
      expect(newUser.Item!.version.N).toBe("0");
    });

    it("既に登録されている場合は、nameが更新される", async () => {
      const response = await user.save({
        cardId: "zzzzzzzzzzzzzzzz",
        name: "名前2",
        userId: "0000000002",
      });
      expect(response.statusCode).toBe(201);

      // 検証
      const newUser = await dynamo.getItem({
        Key: { cardId: { S: "zzzzzzzzzzzzzzzz" } },
        TableName: tableName,
      }).promise() as AWS.DynamoDB.GetItemOutput;
      expect(newUser.Item!.name.S).toBe("名前2");
      expect(newUser.Item!.updatedAt.S).toEqual(expect.any(String));
      expect(newUser.Item!.version.N).toBe("1");
    });

    it("userIdが違う場合は、400を返す", async () => {
      const response = await user.save({
        cardId: "zzzzzzzzzzzzzzzz",
        name: "名前2",
        userId: "9999999999",
      });
      expect(response.statusCode).toBe(400);
    });
  });
});
