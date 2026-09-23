import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }),
  { marshallOptions: { removeUndefinedValues: true } },
);

export function usageTableName() {
  return process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
}

export function usageTenantId() {
  return process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
}

export function adminDocumentClient() {
  return client;
}
