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
    // Step 1: Get the latest deployment for the service
    console.log('Getting latest deployment for service:', serviceId);
    const deploymentsResponse = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `query GetLatestDeployment($serviceId: String!) {
          service(id: $serviceId) {
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
        }`,
        variables: {
          serviceId: serviceId
        }
      }),
    });

    const deploymentsData = await deploymentsResponse.json();

    if (deploymentsData.errors) {
      console.error('Error getting deployments:', deploymentsData.errors);
      return res.status(400).json({
        error: `Failed to get deployments: ${deploymentsData.errors[0].message}`,
        details: deploymentsData.errors
      });
    }

    const service = deploymentsData.data?.service;
    if (!service) {
      return res.status(400).json({
        error: 'Service not found',
        details: deploymentsData
      });
    }

    const deployments = service.deployments?.edges || [];
    if (deployments.length === 0) {
      return res.status(400).json({
        error: 'No deployments found for this service',
        serviceName: service.name
      });
    }

    // Get the latest deployment (first in the list)
    const latestDeployment = deployments[0].node;
    const deploymentId = latestDeployment.id;

    console.log('Latest deployment:', {
      id: deploymentId,
      status: latestDeployment.status,
      createdAt: latestDeployment.createdAt
    });

    // Note: Railway deployments cannot be "stopped" - they are immutable
    // Instead, we'll show the current deployment status
    console.log('Getting current deployment status:', deploymentId);
    
    res.status(200).json({
      success: true,
      message: 'Deployment status retrieved (deployments cannot be stopped)',
      serviceName: service.name,
      serviceId: serviceId,
      currentDeploymentId: deploymentId,
      status: latestDeployment.status,
      createdAt: latestDeployment.createdAt,
      note: 'Railway deployments are immutable and cannot be stopped. To "stop" a service, you would need to delete the service or redeploy with a different configuration.'
    });

  } catch (error) {
    console.error('Error stopping deployment:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
