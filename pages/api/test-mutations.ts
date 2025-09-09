import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const railwayToken = process.env.RAILWAY_API_TOKEN;
  const serviceId = process.env.NEXT_PUBLIC_RAILWAY_SERVICE_ID;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  if (!serviceId) {
    return res.status(500).json({ 
      error: 'Service ID not configured' 
    });
  }

  const results = [];

  try {
    // Test 1: Try deploymentRestart
    console.log('Testing deploymentRestart...');
    try {
      const response1 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { deploymentRestart(serviceId: "${serviceId}") { id status } }`
        }),
      });
      const data1 = await response1.json();
      results.push({ mutation: 'deploymentRestart', result: data1 });
    } catch (e) {
      results.push({ mutation: 'deploymentRestart', error: e.message });
    }

    // Test 2: Try serviceRestart
    console.log('Testing serviceRestart...');
    try {
      const response2 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { serviceRestart(serviceId: "${serviceId}") { id status } }`
        }),
      });
      const data2 = await response2.json();
      results.push({ mutation: 'serviceRestart', result: data2 });
    } catch (e) {
      results.push({ mutation: 'serviceRestart', error: e.message });
    }

    // Test 3: Try deploymentCreate
    console.log('Testing deploymentCreate...');
    try {
      const response3 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { deploymentCreate(input: { serviceId: "${serviceId}" }) { id status } }`
        }),
      });
      const data3 = await response3.json();
      results.push({ mutation: 'deploymentCreate', result: data3 });
    } catch (e) {
      results.push({ mutation: 'deploymentCreate', error: e.message });
    }

    // Test 4: Try serviceStart
    console.log('Testing serviceStart...');
    try {
      const response4 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { serviceStart(serviceId: "${serviceId}") { id status } }`
        }),
      });
      const data4 = await response4.json();
      results.push({ mutation: 'serviceStart', result: data4 });
    } catch (e) {
      results.push({ mutation: 'serviceStart', error: e.message });
    }

    res.status(200).json({
      success: true,
      message: 'Mutation tests completed',
      serviceId: serviceId,
      results: results
    });

  } catch (error) {
    console.error('Test mutations error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: results
    });
  }
}
