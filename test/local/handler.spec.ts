/* tslint:disable no-console */
import * as AWS from "aws-sdk";
import { ILambdaResponse } from "../../src/lib/LambdaResponse";
import { IUserSaveBody } from "../../src/lib/Validation";
import { IAccessBody, IUser } from "../../src/models/Access";
import {
  accessesTable,
  accessItemInput,
  accessItemInput2,
  apiGatewayEvent,
  createAccessesTableInput,
  createUsersTableInput,
  date,
  endpoint,
  region,
  userItemInput,
  userItemInput2,
  userItemInput3,
  userItemInput4,
  usersTable,
} from "../testData";

process.env.ACCESSES_TABLE = accessesTable;
process.env.USERS_TABLE = usersTable;
process.env.REGION = region;
process.env.END_POINT = endpoint;

import {
  getUsers,
  getUserStatus,
  putUser,
  putUserEntry,
  putUserExit,
} from "../../src/handler";

const dynamo = new AWS.DynamoDB({ endpoint, region });

describe("handler.ts", () => {
  beforeAll(async () => {
    try {
      await dynamo.createTable(createUsersTableInput).promise();
      await dynamo.createTable(createAccessesTableInput).promise();
      await dynamo.putItem(userItemInput).promise();
      await dynamo.putItem(userItemInput2).promise();
      await dynamo.putItem(userItemInput3).promise();
      await dynamo.putItem(userItemInput4).promise();
      await dynamo.putItem(accessItemInput).promise();
      await dynamo.putItem(accessItemInput2).promise();
    } catch (e) {
      console.error("初期化に失敗しました。", e);
    }
  });

  afterAll(async () => {
    try {
      await dynamo.deleteTable({ TableName: usersTable }).promise();
      await dynamo.deleteTable({ TableName: accessesTable }).promise();
    } catch (e) {
      console.error("テーブル削除に失敗しました。", e);
    }
  });

  describe("putUser", () => {
    it("リクエストボディが不正の場合は、400を返す", async () => {
      const saveBody: IUserSaveBody = {
        userId: "",
        name: "name5",
        cardId: "VVVVVVVVVVVVVVVV",
      };
      const event = { ...apiGatewayEvent, body: JSON.stringify(saveBody) };
      const response = await putUser(event);
      expect(response.statusCode).toBe(400);
    });

    it("ユーザが作成できる", async () => {
      const saveBody: IUserSaveBody = {
        userId: "0000000005",
        name: "name5",
        cardId: "VVVVVVVVVVVVVVVV",
      };
      const event = { ...apiGatewayEvent, body: JSON.stringify(saveBody) };
      const response = await putUser(event);
      expect(response.statusCode).toBe(201);

      // 検証
      const { Item } = await dynamo
        .getItem({
          TableName: usersTable,
          Key: {
            cardId: {
              S: "VVVVVVVVVVVVVVVV",
            },
          },
        })
        .promise();

      expect(Item!.userId.S).toBe("0000000005");
      expect(Item!.name.S).toBe("name5");
      expect(Item!.status.BOOL).toBe(true);
      expect(Item!.createdAt.S).toEqual(expect.any(String));
      expect(Item!.updatedAt).toBeUndefined();
      expect(Item!.version.N).toBe("0");
    });
  });

  describe("getUserStatus", async () => {
    it("指定したユーザの本日の入退室情報を取得できる", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "WWWWWWWWWWWWWWWW",
        },
      };

      const response = (await getUserStatus(event)) as ILambdaResponse;
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
      expect(entryTime).toBe("YYYY-MM-DDTHH:mm:ss.sssZ");
      expect(exitTime).toBe("YYYY-MM-DDTHH:mm:ss.sssZ");
    });

    it("指定したユーザの本日の入退室情報がない場合、404を返す", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "XXXXXXXXXXXXXXXX",
        },
      };

      const response = (await getUserStatus(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.exists).toBeTruthy();
    });

    it("cardIdが不正の場合、400を返す", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "",
        },
      };

      const response = await getUserStatus(event);
      expect(response.statusCode).toBe(400);
    });

    it("cardIdに紐づくユーザが存在しない場合、404を返す", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "AAAAAAAAAAAAAAAA",
        },
      };

      const response = await getUserStatus(event);
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.exists).toBeFalsy();
    });
  });

  describe("putUserEntry", () => {
    it("パスパラメータが不正の場合、400を返す", async () => {
      const accessBody: IAccessBody = { purpose: "MEET_UP" };
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "",
        },
        body: JSON.stringify(accessBody),
      };
      const response = (await putUserEntry(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(400);
    });

    it("リクエストボディが不正の場合、400を返す", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "YYYYYYYYYYYYYYYY",
        },
        body: JSON.stringify({}),
      };
      const response = (await putUserEntry(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(400);
    });

    it("指定したcardIdに紐づくユーザが存在しない場合、404を返す", async () => {
      const accessBody: IAccessBody = { purpose: "MEET_UP" };
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "AAAAAAAAAAAAAAAA",
        },
        body: JSON.stringify(accessBody),
      };
      const response = (await putUserEntry(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.exists).toBeFalsy();
    });

    it("入室処理が行われる", async () => {
      const accessBody: IAccessBody = { purpose: "MEET_UP" };
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "YYYYYYYYYYYYYYYY",
        },
        body: JSON.stringify(accessBody),
      };
      const response = (await putUserEntry(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(200);

      // 検証
      const getItem = await dynamo
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

      const { name, createdAt, records, version } = getItem.Item!;
      expect(name.S).toBe("name3");
      expect(createdAt.S).toEqual(expect.any(String));
      expect(records.L![0].M!.purpose.S).toBe("MEET_UP");
      expect(records.L![0].M!.entryTime.S).toEqual(expect.any(String));
      expect(records.L![0].M!.exitTime).toBeUndefined();
      expect(version.N).toBe("0");
    });
  });

  describe("putUserExit", () => {
    it("パスパラメータが不正の場合、400を返す", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "",
        },
      };
      const response = (await putUserExit(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(400);
    });

    it("指定したcardIdに紐づくユーザが存在しない場合、404を返す", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "AAAAAAAAAAAAAAAA",
        },
      };
      const response = (await putUserExit(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.exists).toBeFalsy();
    });

    it("退室処理が行われる", async () => {
      const event = {
        ...apiGatewayEvent,
        pathParameters: {
          cardId: "ZZZZZZZZZZZZZZZZ",
        },
      };
      const response = (await putUserExit(event)) as ILambdaResponse;
      expect(response.statusCode).toBe(200);

      // 検証
      const getItem = await dynamo
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

      const { name, createdAt, records, version } = getItem.Item!;
      expect(name.S).toBe("name4");
      expect(createdAt.S).toEqual(expect.any(String));
      expect(records.L![0].M!.purpose.S).toBe("MEET_UP");
      expect(records.L![0].M!.entryTime.S).toEqual(expect.any(String));
      expect(records.L![0].M!.exitTime.S).toEqual(expect.any(String));
      expect(version.N).toBe("1");
    });
  });

  describe("getUsers", () => {
    it("本日の入退室情報を取得できる", async () => {
      const response = (await getUsers()) as ILambdaResponse;
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual(
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
