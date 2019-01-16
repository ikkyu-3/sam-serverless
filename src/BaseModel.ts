import * as AWS from "aws-sdk";

class BaseModel {
  protected documentClient: AWS.DynamoDB.DocumentClient;

  constructor() {
    this.documentClient = new AWS.DynamoDB.DocumentClient({region: process.env.REGION});
  }

  protected isError(obj: any): obj is Error {
    return obj instanceof Error;
  }

  protected async get(params: AWS.DynamoDB.DocumentClient.GetItemInput): Promise<AWS.DynamoDB.DocumentClient.GetItemOutput | Error> {
    try {
      const response = await this.documentClient.get(params).promise();
      return response;
    } catch (error) {
      return error as Error;
    }
  }

  protected async put(params: AWS.DynamoDB.DocumentClient.PutItemInput): Promise<AWS.DynamoDB.DocumentClient.PutItemOutput | Error> {
    try {
      const response = await this.documentClient.put(params).promise();
      return response;
    } catch (error) {
      return error as Error;
    }
  }
}
export default BaseModel;
