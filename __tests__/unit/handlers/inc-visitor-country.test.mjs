// Import incCountryHandler function from inc-visitor-country.mjs 
import { incCountryHandler } from '../../../src/handlers/inc-visitor-country.mjs';

import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from "aws-sdk-client-mock";

// This includes all tests for incCountryHandler() 
describe('Test incCountryHandler', function () { 
    const ddbMock = mockClient(DynamoDBDocumentClient);
 
    beforeEach(() => {
        ddbMock.reset();
      });
 
    // This test invokes incCountryHandler() and compares the result  
    it('increments the count for the corresponding country', async () => { 
        const returnedItem = { message: 'Updated country: PT' }; 
  
        ddbMock.on(UpdateCommand).resolves({
            returnedItem
        }); 
 
        const event = { 
            requestContext: {
                http: {
                    method: 'POST'
                }
            },
            headers: {
                'cloudfront-viewer-country': 'PT',
                'cloudfront-viewer-country-name': 'Portugal'
            }
        }; 
     
        // Invoke incCountryHandler() 
        const result = await incCountryHandler(event); 
        
        const expectedResult = { 
            statusCode: 200, 
            body: JSON.stringify(returnedItem) 
        }; 
 
        // Compare the result with the expected result 
        expect(result).toEqual(expectedResult); 
    }); 
}); 
 