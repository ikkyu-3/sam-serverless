/* tslint:disable:no-console */
import * as AWS from "aws-sdk";
import { AxiosStatic } from "axios";
import { config } from "dotenv";

declare const axios: AxiosStatic;

config();

const testServerUrl = process.env.E2E_TEST_SERVER!;
const samApiUrl = process.env.SAM_API_URL!;
const documentClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION!,
});

const userId = "0000000000";
const name = "Test Name";
const cardId = "XXXXXXXXXXXXXXXX";
const date = new Date().toLocaleDateString();

describe("e2eテスト", () => {
  beforeAll(async () => {
    await page.goto(testServerUrl);
  });

  afterAll(async () => {
    try {
      await documentClient
        .transactWrite({
          TransactItems: [
            {
              Delete: {
                TableName: "Users",
                Key: { cardId },
              },
            },
            {
              Delete: {
                TableName: "Accesses",
                Key: { userId, date },
              },
            },
          ],
        })
        .promise();
    } catch (e) {
      console.error(JSON.stringify(e, null, 4));
    }
  });

  it("登録していないカードで入退室処理を行った場合は、未登録フラグを持つレスポンスを返す", async () => {
    const result = await page.evaluate(async url => {
      try {
        return await axios.get(url);
      } catch (e) {
        return e.response;
      }
    }, `${samApiUrl}/user/AAAAAAAAAAAAAAAA`);
    expect(result.status).toBe(404);
    expect(result.data.exists).toBeFalsy();
  });

  it("ユーザを登録できる", async () => {
    const result = await page.evaluate(
      async ({ url, data }) => {
        try {
          return await axios.put(url, data);
        } catch (e) {
          return e;
        }
      },
      {
        url: `${samApiUrl}/user`,
        data: { userId, name, cardId },
      }
    );
    expect(result.status).toBe(201);
  });

  it("入退室データがない場合、登録フラグを持つレスポンスを返す", async () => {
    const result = await page.evaluate(async url => {
      try {
        return await axios.get(url);
      } catch (e) {
        return e.response;
      }
    }, `${samApiUrl}/user/XXXXXXXXXXXXXXXX`);
    expect(result.status).toBe(404);
    expect(result.data.exists).toBeTruthy();
  });

  it("入室できる", async () => {
    const result = await page.evaluate(
      async ({ url, data }) => {
        try {
          return await axios.put(url, data);
        } catch (e) {
          return e;
        }
      },
      {
        url: `${samApiUrl}/user/XXXXXXXXXXXXXXXX/entry`,
        data: { purpose: "MEET_UP" },
      }
    );
    expect(result.status).toBe(200);
  });

  it("入退室データを取得できる", async () => {
    const result = await page.evaluate(async url => {
      try {
        return await axios.get(url);
      } catch (e) {
        return e.response;
      }
    }, `${samApiUrl}/user/XXXXXXXXXXXXXXXX`);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({
      userId,
      name,
      purpose: "MEET_UP",
      isEntry: true,
      entryTime: expect.any(String),
    });
  });

  it("退室できる", async () => {
    const result = await page.evaluate(
      async ({ url }) => {
        try {
          return await axios.put(url);
        } catch (e) {
          return e;
        }
      },
      {
        url: `${samApiUrl}/user/XXXXXXXXXXXXXXXX/exit`,
      }
    );
    expect(result.status).toBe(200);
  });

  it("本日の利用者一覧を取得できる", async () => {
    const result = await page.evaluate(
      async ({ url }) => {
        try {
          return await axios.get(url);
        } catch (e) {
          return e;
        }
      },
      {
        url: `${samApiUrl}/users`,
      }
    );
    expect(result.status).toBe(200);
    expect(result.data).toEqual(
      expect.arrayContaining([
        {
          userId,
          name,
          purpose: "MEET_UP",
          isEntry: false,
          entryTime: expect.any(String),
          exitTime: expect.any(String),
        },
      ])
    );
  });
});
