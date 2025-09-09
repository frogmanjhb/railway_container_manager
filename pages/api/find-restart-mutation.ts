import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const railwayToken = process.env.RAILWAY_API_TOKEN;
  const deploymentId = '82197732-b376-49ba-8e7f-a14a7a89049c'; // From your test data

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  const results = [];

  try {
    // Test different possible restart mutation names
    const mutationsToTest = [
      'deploymentRestart',
      'deploymentRedeploy', 
      'deploymentRebuild',
      'deploymentRecreate',
      'deploymentUpdate',
      'deploymentTrigger',
      'deploymentStart',
      'deploymentResume',
      'deploymentRefresh',
      'deploymentReload'
    ];

    for (const mutationName of mutationsToTest) {
      console.log(`Testing ${mutationName}...`);
      try {
        const response = await fetch('https://backboard.railway.com/graphql/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${railwayToken}`,
          },
          body: JSON.stringify({
            query: `mutation { 
              ${mutationName}(id: "${deploymentId}") { 
                id 
                status 
              } 
            }`
          }),
        });

        const data = await response.json();
        results.push({ 
          mutation: mutationName, 
          success: !data.errors,
          result: data,
          hasErrors: !!data.errors,
          errorCount: data.errors?.length || 0,
          firstError: data.errors?.[0]?.message || null
        });
      } catch (e) {
        results.push({ 
          mutation: mutationName, 
          success: false,
          error: e.message 
        });
      }
    }

    // Also test with input object format
    console.log('Testing deploymentRestart with input object...');
    try {
      const response = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation { 
            deploymentRestart(input: { id: "${deploymentId}" }) { 
              id 
              status 
            } 
          }`
        }),
      });

      const data = await response.json();
      results.push({ 
        mutation: 'deploymentRestart(input)', 
        success: !data.errors,
        result: data,
        hasErrors: !!data.errors,
        errorCount: data.errors?.length || 0,
        firstError: data.errors?.[0]?.message || null
      });
    } catch (e) {
      results.push({ 
        mutation: 'deploymentRestart(input)', 
        success: false,
        error: e.message 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mutation discovery completed',
      deploymentId: deploymentId,
      totalTests: results.length,
      successfulMutations: results.filter(r => r.success).length,
      results: results
    });

  } catch (error) {
    console.error('Find restart mutation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: results
    });
  }
}
