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
    ExpressionAttributeNames: { '#c': 'count' },
    ExpressionAttributeValues: {
      ':zero': 0,
      ':inc': 1,
    },
  };

  if (countryCode === "Unknown") {
    // Abort and don't update table if countryCode is unknown
    console.log("Unknown country code - aborting operation");

    const response = {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update count, unknown country code' })
    };

    return response;
  } else if (countryName === "Unknown") {
    // Update count but don't set countryName if it is unknown
    params.UpdateExpression = 'SET #c = if_not_exists(#c, :zero) + :inc';
  } else {
    // Update both
    params.UpdateExpression = 'SET #c = if_not_exists(#c, :zero) + :inc, #n = :countryName';
    params.ExpressionAttributeNames['#n'] = 'countryName';
    params.ExpressionAttributeValues[':countryName'] = countryName;
  }

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
