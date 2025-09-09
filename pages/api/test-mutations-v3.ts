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
    // Test 1: Try deploymentRestart with proper input object
    console.log('Testing deploymentRestart with input object...');
    try {
      const response1 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { 
            deploymentRestart(input: { serviceId: "${serviceId}" }) { 
              id 
              status 
            } 
          }`
        }),
      });
      const data1 = await response1.json();
      results.push({ mutation: 'deploymentRestart(input)', result: data1 });
    } catch (e) {
      results.push({ mutation: 'deploymentRestart(input)', error: e.message });
    }

    // Test 2: Try deploymentRestart with deploymentId instead of serviceId
    console.log('Testing deploymentRestart with deploymentId...');
    try {
      const response2 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { 
            deploymentRestart(input: { deploymentId: "${serviceId}" }) { 
              id 
              status 
            } 
          }`
        }),
      });
      const data2 = await response2.json();
      results.push({ mutation: 'deploymentRestart(deploymentId)', result: data2 });
    } catch (e) {
      results.push({ mutation: 'deploymentRestart(deploymentId)', error: e.message });
    }

    // Test 3: Try deploymentRestart with just id parameter
    console.log('Testing deploymentRestart with id parameter...');
    try {
      const response3 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { 
            deploymentRestart(id: "${serviceId}") { 
              id 
              status 
            } 
          }`
        }),
      });
      const data3 = await response3.json();
      results.push({ mutation: 'deploymentRestart(id)', result: data3 });
    } catch (e) {
      results.push({ mutation: 'deploymentRestart(id)', error: e.message });
    }

    // Test 4: Try serviceRestart with input object
    console.log('Testing serviceRestart with input object...');
    try {
      const response4 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { 
            serviceRestart(input: { id: "${serviceId}" }) { 
              id 
              status 
            } 
          }`
        }),
      });
      const data4 = await response4.json();
      results.push({ mutation: 'serviceRestart(input)', result: data4 });
    } catch (e) {
      results.push({ mutation: 'serviceRestart(input)', error: e.message });
    }

    // Test 5: Try serviceRestart with just id parameter
    console.log('Testing serviceRestart with id parameter...');
    try {
      const response5 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { 
            serviceRestart(id: "${serviceId}") { 
              id 
              status 
            } 
          }`
        }),
      });
      const data5 = await response5.json();
      results.push({ mutation: 'serviceRestart(id)', result: data5 });
    } catch (e) {
      results.push({ mutation: 'serviceRestart(id)', error: e.message });
    }

    // Test 6: Try to get current deployments to see the structure
    console.log('Testing get deployments structure...');
    try {
      const response6 = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `query { 
            service(id: "${serviceId}") { 
              id
              name
              deployments { 
                edges { 
                  node { 
                    id 
                    status 
                    createdAt
                  } 
                } 
              } 
            } 
          }`
        }),
      });
      const data6 = await response6.json();
      results.push({ mutation: 'getServiceWithDeployments', result: data6 });
    } catch (e) {
      results.push({ mutation: 'getServiceWithDeployments', error: e.message });
    }

    res.status(200).json({
      success: true,
      message: 'Mutation tests v3 completed',
      serviceId: serviceId,
      results: results
    });

  } catch (error) {
    console.error('Test mutations v3 error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: results
    });
  }
}
