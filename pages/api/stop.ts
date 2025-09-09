import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId, serviceId } = req.body;

  if (!projectId || !serviceId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: projectId and serviceId' 
    });
  }

  const railwayToken = process.env.RAILWAY_API_TOKEN;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  try {
    // Use Railway's official GraphQL API as documented
    const response = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `
          mutation StopDeployment($serviceId: String!) {
            deploymentStop(serviceId: $serviceId) {
              id
              status
            }
          }
        `,
        variables: {
          serviceId: serviceId
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Railway API Error:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      return res.status(400).json({
        error: `HTTP error! status: ${response.status}`,
        details: data,
        fullError: JSON.stringify(data, null, 2)
      });
    }

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      return res.status(400).json({
        error: `GraphQL error: ${data.errors[0].message}`,
        details: data.errors,
        fullError: JSON.stringify(data.errors, null, 2)
      });
    }

    const deployment = data.data?.deploymentStop;

    if (!deployment) {
      return res.status(400).json({
        error: 'Failed to stop deployment',
        details: data,
        fullError: JSON.stringify(data, null, 2)
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deployment stopped successfully',
      deploymentId: deployment.id,
      status: deployment.status,
      details: data
    });

  } catch (error) {
    console.error('Error stopping container:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}