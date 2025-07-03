import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.VISITOR_COUNTRY_TABLE;

/**
 * Receives an HTTP POST request and increments the visitor's country on DynamoDB
 */
export const incCountryHandler = async (event) => {
  if (event.requestContext.http.method !== 'POST') {
    throw new Error(`incCountryHandler only accepts POST method, you tried: ${event.requestContext.http.method} method.`);
  }

  const headers = event.headers || {};
  const countryCode = headers["cloudfront-viewer-country"] || headers["CloudFront-Viewer-Country"] || 'Unknown';
  const countryName = headers["cloudfront-viewer-country-name"] || headers["CloudFront-Viewer-Country-Name"] || 'Unknown';

  console.log("Received headers:", headers);
  console.log("Resolved countryCode:", countryCode);
  console.log("Resolved countryName:", countryName);

  var params = {
    TableName: tableName,
    Key: { countryCode },
    UpdateExpression: 'SET #c = if_not_exists(#c, :zero) + :inc, #n = :countryName',
    ExpressionAttributeNames: {
      '#c': 'count',
      '#n': 'countryName'
    },
    ExpressionAttributeValues: {
      ':zero': 0,
      ':inc': 1,
      ':countryName': countryName
    }
  };

  try {
    const data = await ddbDocClient.send(new UpdateCommand(params));
    console.log("Success - item added or updated", data);

    const response = {
      statusCode: 200,
      body: JSON.stringify({ message: `Updated country: ${countryCode}` })
    };

    return response;
  } catch (err) {
    console.error("Error", err.stack);

    const response = {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update count' })
    };

    return response;
  }
};
