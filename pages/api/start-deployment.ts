import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Start Deployment API Endpoint
 * 
 * Handles Railway service redeployment using GraphQL API v2
 * 
 * Features:
 * - Validates required parameters (projectId, serviceId)
 * - Authenticates with Railway API token
 * - Fetches latest deployment information
 * - Triggers new deployment from existing source
 * - Comprehensive error handling
 * - Returns deployment status and metadata
 * 
 * @param req - Next.js API request object
 * @param res - Next.js API response object
 */
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

    // Step 2: Redeploy using the latest deployment ID
    console.log('Redeploying deployment:', deploymentId);
    const restartResponse = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `mutation RedeployDeployment($deploymentId: String!) {
          deploymentRedeploy(id: $deploymentId) {
            id
            status
          }
        }`,
        variables: {
          deploymentId: deploymentId
        }
      }),
    });

    const restartData = await restartResponse.json();

    if (restartData.errors) {
      console.error('Error redeploying deployment:', restartData.errors);
      return res.status(400).json({
        error: `Failed to redeploy deployment: ${restartData.errors[0].message}`,
        details: restartData.errors,
        deploymentId: deploymentId,
        serviceId: serviceId
      });
    }

    const newDeployment = restartData.data?.deploymentRedeploy;
    if (!newDeployment) {
      return res.status(400).json({
        error: 'Failed to redeploy deployment',
        details: restartData,
        deploymentId: deploymentId,
        serviceId: serviceId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deployment redeployed successfully! New deployment created.',
      serviceName: service.name,
      serviceId: serviceId,
      newDeploymentId: newDeployment.id,
      status: newDeployment.status,
      previousDeploymentId: deploymentId,
      details: restartData
    });

  } catch (error) {
    console.error('Error starting deployment:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
