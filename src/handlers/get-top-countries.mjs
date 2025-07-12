import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.VISITOR_COUNTRY_TABLE;

/**
 * Receives an HTTP GET request and returns the top 3 countries by visits to the website
 */
export const getTopCountriesHandler = async (event) => {
  if (event.requestContext.http.method !== 'GET') {
    throw new Error(`getTopCountriesHandler only accept GET method, you tried: ${event.requestContext.http.method}`);
  }

  var params = {
    TableName : tableName
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));

    var topCountries = data.Items
      .filter(item => item.countryName !== 'Unknown') // can remove when database is more full
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, 3); // Top 3

    const response =  {
      statusCode: 200,
      body: JSON.stringify({ topCountries })
    };

    return response;
  } catch (err) {
    console.log("Error", err);

    const response = {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data' })
    };

    return response;
  }
};
