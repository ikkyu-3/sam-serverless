import { APIGatewayProxyEvent } from "aws-lambda";

export async function hello(event: APIGatewayProxyEvent) {
  console.log(event);
}
