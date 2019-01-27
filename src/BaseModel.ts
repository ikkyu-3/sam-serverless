import * as AWS from "aws-sdk";

class BaseModel {
  protected documentClient: AWS.DynamoDB.DocumentClient;

  constructor(
    options?: AWS.DynamoDB.DocumentClient.DocumentClientOptions &
      AWS.DynamoDB.Types.ClientConfiguration
  ) {
    this.documentClient = new AWS.DynamoDB.DocumentClient(options);
  }

  protected isAWSError(response: any): response is AWS.AWSError {
    if (typeof response !== "object" || response == null) {
      return false;
    }
    if (typeof response.statusCode !== "number") {
      return false;
    }
    if (typeof response.message !== "string") {
      return false;
    }
    return true;
  }

  protected async get(
    params: AWS.DynamoDB.DocumentClient.GetItemInput
  ): Promise<AWS.DynamoDB.DocumentClient.GetItemOutput | AWS.AWSError> {
    try {
      const response = await this.documentClient.get(params).promise();
      return response;
    } catch (error) {
      return error as AWS.AWSError;
    }
  }

  protected async put(
    params: AWS.DynamoDB.DocumentClient.PutItemInput
  ): Promise<AWS.DynamoDB.DocumentClient.PutItemOutput | AWS.AWSError> {
    try {
      const response = await this.documentClient.put(params).promise();
      return response;
    } catch (error) {
      return error as AWS.AWSError;
    }
  }

  protected async update(
    params: AWS.DynamoDB.DocumentClient.UpdateItemInput
  ): Promise<AWS.DynamoDB.DocumentClient.UpdateItemOutput | AWS.AWSError> {
    try {
      const response = await this.documentClient.update(params).promise();
      return response;
    } catch (error) {
      return error as AWS.AWSError;
    }
  }

  protected async query(
    params: AWS.DynamoDB.DocumentClient.QueryInput
  ): Promise<AWS.DynamoDB.DocumentClient.QueryOutput | AWS.AWSError> {
    try {
      const response = await this.documentClient.query(params).promise();
      return response;
    } catch (error) {
      return error as AWS.AWSError;
    }
  }
}
export default BaseModel;
