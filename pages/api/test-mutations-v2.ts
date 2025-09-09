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
    // Test 1: Try deploymentRestart with id parameter
    console.log('Testing deploymentRestart with id...');
    try {
      const response1 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { deploymentRestart(id: "${serviceId}") { id status } }`
        }),
      });
      const data1 = await response1.json();
      results.push({ mutation: 'deploymentRestart(id)', result: data1 });
    } catch (e) {
      results.push({ mutation: 'deploymentRestart(id)', error: e.message });
    }

    // Test 2: Try deploymentRestart with input parameter
    console.log('Testing deploymentRestart with input...');
    try {
      const response2 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { deploymentRestart(input: { serviceId: "${serviceId}" }) { id status } }`
        }),
      });
      const data2 = await response2.json();
      results.push({ mutation: 'deploymentRestart(input)', result: data2 });
    } catch (e) {
      results.push({ mutation: 'deploymentRestart(input)', error: e.message });
    }

    // Test 3: Try serviceRestart with id parameter
    console.log('Testing serviceRestart with id...');
    try {
      const response3 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { serviceRestart(id: "${serviceId}") { id status } }`
        }),
      });
      const data3 = await response3.json();
      results.push({ mutation: 'serviceRestart(id)', result: data3 });
    } catch (e) {
      results.push({ mutation: 'serviceRestart(id)', error: e.message });
    }

    // Test 4: Try deploymentCreate with different input format
    console.log('Testing deploymentCreate with serviceId...');
    try {
      const response4 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { deploymentCreate(serviceId: "${serviceId}") { id status } }`
        }),
      });
      const data4 = await response4.json();
      results.push({ mutation: 'deploymentCreate(serviceId)', result: data4 });
    } catch (e) {
      results.push({ mutation: 'deploymentCreate(serviceId)', error: e.message });
    }

    // Test 5: Try to get current deployments first
    console.log('Testing get deployments...');
    try {
      const response5 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `query { service(id: "${serviceId}") { deployments { edges { node { id status } } } } }`
        }),
      });
      const data5 = await response5.json();
      results.push({ mutation: 'getDeployments', result: data5 });
    } catch (e) {
      results.push({ mutation: 'getDeployments', error: e.message });
    }

    res.status(200).json({
      success: true,
      message: 'Mutation tests v2 completed',
      serviceId: serviceId,
      results: results
    });

  } catch (error) {
    console.error('Test mutations v2 error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: results
    });
  }
}
