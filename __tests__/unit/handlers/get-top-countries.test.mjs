// Import getTopCountriesHandler function from get-top-countries.mjs 
import { getTopCountriesHandler } from '../../../src/handlers/get-top-countries.mjs';

import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from "aws-sdk-client-mock";
 
// This includes all tests for getTopCountriesHandler() 
describe('Test getTopCountriesHandler', () => { 
    const ddbMock = mockClient(DynamoDBDocumentClient);
 
    beforeEach(() => {
        ddbMock.reset();
      });
 
    it('should return 3 countries', async () => { 
        const items = [
            { countryCode: 'PT', countryName: 'Portugal', count: 10 },
            { countryCode: 'DE', countryName: 'Germany', count: 8 },
            { countryCode: 'BR', countryName: 'Brazil', count: 5 }
        ]; 
 
        ddbMock.on(ScanCommand).resolves({
            Items: items,
        }); 
 
        const event = { 
            requestContext: {
                http: {
                    method: 'GET'
                }
            }
        };
 
        // Invoke getTopCountriesHandler() 
        const result = await getTopCountriesHandler(event); 
 
        const expectedResult = { 
            statusCode: 200,
            body: JSON.stringify({ topCountries: items }) 
        }; 
 
        // Compare the result with the expected result 
        expect(result).toEqual(expectedResult); 
    }); 
}); 
