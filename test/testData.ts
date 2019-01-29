import { APIGatewayProxyEvent } from "aws-lambda";
import * as AWS from "aws-sdk";

export const endpoint = "http://localhost:8000";
export const region = "ap-northeast-1";
export const date = `${new Date().getFullYear()}${new Date().getMonth() +
  1}${new Date().getDate()}`;

export const apiGatewayEvent: APIGatewayProxyEvent = {
  body: null, // string | null;
  headers: {}, // { [name: string]: string };
  multiValueHeaders: {}, // { [name: string]: string[] };
  httpMethod: "", // string;
  isBase64Encoded: false, // boolean;
  path: "", // string;
  pathParameters: null, // { [name: string]: string } | null;
  queryStringParameters: null, // { [name: string]: string } | null;
  multiValueQueryStringParameters: null, // { [name: string]: string[] } | null;
  stageVariables: null, // { [name: string]: string } | null;
  requestContext: {
    accountId: "", // string;
    apiId: "", // string;
    authorizer: null, // AuthResponseContext | null;
    httpMethod: "", // string;
    identity: {
      accessKey: null, // string | null;
      accountId: null, // string | null;
      apiKey: null, // string | null;
      apiKeyId: null, // string | null;
      caller: null, // string | null;
      cognitoAuthenticationProvider: null, // string | null;
      cognitoAuthenticationType: null, // string | null;
      cognitoIdentityId: null, // string | null;
      cognitoIdentityPoolId: null, // string | null;
      sourceIp: "", // string;
      user: null, // string | null;
      userAgent: null, // string | null;
      userArn: null, // string | null;
    },
    path: "", // string;
    stage: "", // string;
    requestId: "", // string;
    requestTimeEpoch: 0, // number;
    resourceId: "", // string;
    resourcePath: "", // string;
  }, // APIGatewayEventRequestContext;
  resource: "", // string;
};

// SamModel
export const testTable = "Test";

export const createTestTableInput: AWS.DynamoDB.CreateTableInput = {
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
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5,
  },
  TableName: testTable,
};

export const testItemInput: AWS.DynamoDB.PutItemInput = {
  Item: {
    Id: { S: "001" },
    Name: { S: "名前" },
  },
  ReturnConsumedCapacity: "TOTAL",
  TableName: testTable,
};

// Users Table
export const usersTable = "Users";

export const createUsersTableInput: AWS.DynamoDB.CreateTableInput = {
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
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
  TableName: usersTable,
};

export const userItemInput: AWS.DynamoDB.PutItemInput = {
  Item: {
    cardId: { S: "XXXXXXXXXXXXXXXX" },
    createdAt: { S: "YYYY-MM-DDTHH:mm:ss.sss" },
    name: { S: "name" },
    status: { BOOL: true },
    userId: { S: "0000000001" },
    version: { N: "0" },
  },
  ReturnConsumedCapacity: "TOTAL",
  TableName: usersTable,
};

export const userItemInput2: AWS.DynamoDB.PutItemInput = {
  Item: {
    cardId: { S: "YYYYYYYYYYYYYYYY" },
    createdAt: { S: "YYYY-MM-DDTHH:mm:ss.sss" },
    name: { S: "name2" },
    status: { BOOL: true },
    userId: { S: "0000000002" },
    version: { N: "0" },
  },
  ReturnConsumedCapacity: "TOTAL",
  TableName: usersTable,
};

// Accesses Table
export const accessesTable = "Accesses";

export const createAccessesTableInput: AWS.DynamoDB.CreateTableInput = {
  AttributeDefinitions: [
    {
      AttributeName: "userId",
      AttributeType: "S",
    },
    {
      AttributeName: "date",
      AttributeType: "S",
    },
  ],
  KeySchema: [
    {
      AttributeName: "userId",
      KeyType: "HASH",
    },
    {
      AttributeName: "date",
      KeyType: "RANGE",
    },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "date-index" /* required */,
      KeySchema: [
        /* required */
        {
          AttributeName: "date" /* required */,
          KeyType: "HASH" /* required */,
        },
        /* more items */
      ],
      Projection: {
        /* required */
        ProjectionType: "ALL",
      },
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1,
      },
    },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
  TableName: accessesTable,
};

export const accessItemInput: AWS.DynamoDB.PutItemInput = {
  Item: {
    userId: { S: "0000000001" },
    date: { S: date },
    name: { S: "name" },
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
};
