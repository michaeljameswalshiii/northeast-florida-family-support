import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { AiResult } from "@/lib/bedrock";

const TABLE = process.env.DYNAMODB_BEDROCK_USAGE_TABLE || "turnkey-bedrock-usage";
const TENANT = process.env.AI_USAGE_TENANT_ID || "site-nefl-support";
const RESERVATION_MICROUSD = 10_000;

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" }), {
  marshallOptions: { removeUndefinedValues: true },
});

function monthKey() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function key() {
  return { PK: `TENANT#${TENANT}`, SK: `BUDGET#MONTH#${monthKey()}` };
}

function limitMicrousd() {
  const dollars = Number(process.env.AI_MONTHLY_BUDGET_USD || "5");
  return Math.round((Number.isFinite(dollars) && dollars > 0 ? dollars : 5) * 1_000_000);
}

export async function reserveRequest() {
  const limit = limitMicrousd();
  await client.send(new UpdateCommand({
    TableName: TABLE,
    Key: key(),
    UpdateExpression: "SET committedMicrousd = if_not_exists(committedMicrousd, :zero) + :reserve, reservedMicrousd = if_not_exists(reservedMicrousd, :zero) + :reserve, updatedAt = :now, tenantId = :tenant",
    ConditionExpression: "attribute_not_exists(committedMicrousd) OR committedMicrousd <= :remaining",
    ExpressionAttributeValues: { ":zero": 0, ":reserve": RESERVATION_MICROUSD, ":remaining": limit - RESERVATION_MICROUSD, ":now": new Date().toISOString(), ":tenant": TENANT },
  }));
  return RESERVATION_MICROUSD;
}

function actualCost(result: AiResult) {
  const grok = result.modelId.toLowerCase().includes("grok");
  const inputRate = grok ? 1.25 : 0.06;
  const outputRate = grok ? 2.5 : 0.24;
  return Math.max(1, Math.ceil(((result.inputTokens * inputRate + result.outputTokens * outputRate) / 1_000_000) * 1_000_000));
}

export async function settleRequest(reserved: number, result?: AiResult) {
  const actual = result ? actualCost(result) : 0;
  await client.send(new UpdateCommand({
    TableName: TABLE,
    Key: key(),
    UpdateExpression: "SET updatedAt = :now, lastModelId = :model ADD committedMicrousd :delta, reservedMicrousd :release, spentMicrousd :actual, requests :requests, inputTokens :input, outputTokens :output",
    ExpressionAttributeValues: {
      ":now": new Date().toISOString(), ":model": result?.modelId || "none", ":delta": actual - reserved, ":release": -reserved,
      ":actual": actual, ":requests": result ? 1 : 0, ":input": result?.inputTokens || 0, ":output": result?.outputTokens || 0,
    },
  }));
}
