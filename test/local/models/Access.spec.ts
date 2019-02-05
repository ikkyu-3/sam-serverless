/* tslint:disable no-console */
import * as AWS from "aws-sdk";
import Access, { IUser } from "../../../src/models/Access";
import {
  accessesTable,
  accessItemInput,
  createAccessesTableInput,
  date,
  endpoint,
  region,
} from "../../testData";

process.env.ACCESSES_TABLE = accessesTable;

const dynamo = new AWS.DynamoDB({ endpoint, region });
const access = new Access({ endpoint, region });

describe("Access.ts", () => {
  beforeAll(async () => {
    try {
      await dynamo.createTable(createAccessesTableInput).promise();
      await dynamo.putItem(accessItemInput).promise();
    } catch (e) {
      console.error("初期化に失敗しました。", e);
    }
  });

  afterAll(async () => {
    try {
      await dynamo.deleteTable({ TableName: accessesTable }).promise();
    } catch (e) {
      console.error("テーブル削除に失敗しました。", e);
    }
  });

  describe("getUserTody", () => {
    it("指定したユーザの項目があれば、取得できる", async () => {
      const response = await access.getUserToday("0000000001");
      expect(response.statusCode).toBe(200);

      const {
        userId,
        name,
        purpose,
        isEntry,
        entryTime,
        exitTime,
      } = JSON.parse(response.body) as IUser;
      expect(userId).toBe("0000000001");
      expect(name).toBe("name");
      expect(purpose).toBe("STUDY");
      expect(isEntry).toBeFalsy();
      expect(entryTime).toEqual(expect.any(String));
      expect(exitTime).toEqual(expect.any(String));
    });

    it("指定したユーザの項目がない場合、404を返す", async () => {
      const response = await access.getUserToday("0000000000");
      expect(response.statusCode).toBe(404);
    });
  });

  describe("executeEntryProcess", () => {
    it("入室処理が行われる", async () => {
      const response = await access.executeEntryProcess(
        "0000000002",
        "name2",
        "STUDY"
      );
      expect(response.statusCode).toBe(200);

      // 検証
      const { Item } = await dynamo
        .getItem({
          TableName: accessesTable,
          Key: {
            userId: {
              S: "0000000002",
            },
            date: {
              S: date,
            },
          },
        })
        .promise();

      expect(Item!.name.S).toBe("name2");
      expect(Item!.createdAt.S).toEqual(expect.any(String));
      expect(Item!.records.L![0].M!.entryTime.S).toEqual(expect.any(String));
      expect(Item!.records.L![0].M!.purpose.S).toBe("STUDY");
      expect(Item!.records.L![0].M!.exitTime).toBeUndefined();
      expect(Item!.version.N).toBe("0");
    });

    it("再入室処理が行われる", async () => {
      await dynamo
        .putItem({
          Item: {
            userId: { S: "0000000003" },
            date: { S: date },
            name: { S: "name3" },
            records: {
              L: [
                {
                  M: {
                    entryTime: { S: "YYYY-MM-DDTHH:mm:ss.sssZ" },
                    exitTime: { S: "YYYY-MM-DDTHH:mm:ss.sssZ" },
                    purpose: { S: "STUDY" },
                  },
                },
              ],
            },
            createdAt: { S: "YYYY-MM-DDTHH:mm:ss.sss" },
            version: { N: "0" },
          },
          ReturnConsumedCapacity: "TOTAL",
          TableName: accessesTable,
        })
        .promise();

      const response = await access.executeEntryProcess(
        "0000000003",
        "name3",
        "CIRCLE"
      );

      expect(response.statusCode).toBe(200);

      // 検証
      const { Item } = await dynamo
        .getItem({
          TableName: accessesTable,
          Key: {
            userId: {
              S: "0000000003",
            },
            date: {
              S: date,
            },
          },
        })
        .promise();

      expect(Item!.name.S).toBe("name3");
      expect(Item!.createdAt.S).toEqual(expect.any(String));
      expect(Item!.updatedAt.S).toEqual(expect.any(String));
      expect(Item!.records.L!).toHaveLength(2);
      expect(Item!.records.L![1].M!.entryTime.S).toEqual(expect.any(String));
      expect(Item!.records.L![1].M!.purpose.S).toBe("CIRCLE");
      expect(Item!.records.L![1].M!.exitTime).toBeUndefined();
      expect(Item!.version.N).toBe("1");
    });
  });

  describe("executeExitProcess", () => {
    it("退室処理が行われる", async () => {
      await dynamo
        .putItem({
          Item: {
            userId: { S: "0000000004" },
            date: { S: date },
            name: { S: "name4" },
            records: {
              L: [
                {
                  M: {
                    entryTime: { S: "YYYY-MM-DDTHH:mm:ss.sssZ" },
                    purpose: { S: "STUDY" },
                  },
                },
              ],
            },
            createdAt: { S: "YYYY-MM-DDTHH:mm:ss.sss" },
            version: { N: "0" },
          },
          ReturnConsumedCapacity: "TOTAL",
          TableName: accessesTable,
        })
        .promise();

      const response = await access.executeExitProcess("0000000004");
      expect(response.statusCode).toBe(200);

      // 検証
      const { Item } = await dynamo
        .getItem({
          TableName: accessesTable,
          Key: {
            userId: {
              S: "0000000004",
            },
            date: {
              S: date,
            },
          },
        })
        .promise();

      expect(Item!.updatedAt.S).toEqual(expect.any(String));
      expect(Item!.records.L![0].M!.entryTime.S).toEqual(expect.any(String));
      expect(Item!.records.L![0].M!.purpose.S).toBe("STUDY");
      expect(Item!.records.L![0].M!.exitTime.S).toEqual(expect.any(String));
      expect(Item!.version.N).toBe("1");
    });
  });

  describe("getUsersToday", () => {
    it("本日入室したユーザ一覧を取得できる", async () => {
      const response = await access.getUsersToday();
      const users = JSON.parse(response.body) as IUser[];

      expect(users).toEqual(
        expect.arrayContaining([
          {
            userId: "0000000001",
            name: "name",
            purpose: "STUDY",
            isEntry: false,
            entryTime: "YYYY-MM-DDTHH:mm:ss.sssZ",
            exitTime: "YYYY-MM-DDTHH:mm:ss.sssZ",
          },
        ])
      );
    });
  });
});
