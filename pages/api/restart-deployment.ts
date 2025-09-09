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
    // Step 1: Get the latest deployment for the service using the recommended approach
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

    // Validate that we have a valid deployment ID
    if (!deploymentId) {
      return res.status(400).json({
        error: 'No valid deployment ID found',
        serviceName: service.name,
        serviceId: serviceId
      });
    }

    // Check if deployment is in a restartable state
    const restartableStatuses = ['SUCCESS', 'ACTIVE', 'COMPLETED', 'CRASHED'];
    if (!restartableStatuses.includes(latestDeployment.status)) {
      return res.status(400).json({
        error: `Deployment is not in a restartable state. Current status: ${latestDeployment.status}`,
        serviceName: service.name,
        serviceId: serviceId,
        deploymentId: deploymentId,
        currentStatus: latestDeployment.status,
        restartableStatuses: restartableStatuses
      });
    }

    // Step 2: Try to restart the deployment using multiple methods
    console.log('Attempting to restart deployment:', deploymentId);
    
    // Method 1: Try deploymentRestart (official restart)
    let restartSuccess = false;
    let restartResult = null;
    let usedMethod = null;
    
    try {
      console.log('Trying deploymentRestart...');
      const restartResponse = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `mutation RestartDeployment($deploymentId: String!) {
            deploymentRestart(id: $deploymentId) {
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
      
      if (!restartData.errors) {
        restartSuccess = true;
        restartResult = restartData.data?.deploymentRestart;
        usedMethod = 'deploymentRestart';
        console.log('deploymentRestart succeeded:', restartResult);
      } else {
        console.log('deploymentRestart failed:', restartData.errors[0]?.message);
        // Check if it's a permission or availability issue
        const errorMessage = restartData.errors[0]?.message || '';
        if (errorMessage.includes('Problem processing request') || 
            errorMessage.includes('permission') || 
            errorMessage.includes('not available')) {
          console.log('deploymentRestart not available or permission denied, trying alternatives...');
        }
      }
    } catch (e) {
      console.log('deploymentRestart error:', e.message);
    }

    // Method 2: Try serviceInstanceRedeploy if deploymentRestart fails
    if (!restartSuccess) {
      try {
        console.log('Trying serviceInstanceRedeploy...');
        const serviceRedeployResponse = await fetch('https://backboard.railway.com/graphql/v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${railwayToken}`,
          },
          body: JSON.stringify({
            query: `mutation ServiceInstanceRedeploy($serviceId: String!, $environmentId: String!) {
              serviceInstanceRedeploy(serviceId: $serviceId, environmentId: $environmentId) {
                id
                status
              }
            }`,
            variables: {
              serviceId: serviceId,
              environmentId: 'production' // Default environment
            }
          }),
        });

        const serviceRedeployData = await serviceRedeployResponse.json();
        
        if (!serviceRedeployData.errors) {
          restartSuccess = true;
          restartResult = serviceRedeployData.data?.serviceInstanceRedeploy;
          usedMethod = 'serviceInstanceRedeploy';
          console.log('serviceInstanceRedeploy succeeded:', restartResult);
        } else {
          console.log('serviceInstanceRedeploy failed:', serviceRedeployData.errors[0]?.message);
        }
      } catch (e) {
        console.log('serviceInstanceRedeploy error:', e.message);
      }
    }

    if (!restartSuccess) {
      console.log('All restart methods failed, falling back to redeploy...');
      const redeployResponse = await fetch('https://backboard.railway.com/graphql/v2', {
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

      const redeployData = await redeployResponse.json();

      if (redeployData.errors) {
        console.error('Error redeploying deployment:', redeployData.errors);
        return res.status(400).json({
          error: `Failed to restart/redeploy deployment: ${redeployData.errors[0].message}`,
          details: redeployData.errors,
          deploymentId: deploymentId,
          serviceId: serviceId
        });
      }

      const newDeployment = redeployData.data?.deploymentRedeploy;
      if (!newDeployment) {
        return res.status(400).json({
          error: 'Failed to restart/redeploy deployment',
          details: redeployData,
          deploymentId: deploymentId,
          serviceId: serviceId
        });
      }

      res.status(200).json({
        success: true,
        message: 'Deployment restarted via redeploy (deploymentRestart not available for this deployment type)',
        serviceName: service.name,
        serviceId: serviceId,
        newDeploymentId: newDeployment.id,
        status: newDeployment.status,
        previousDeploymentId: deploymentId,
        method: 'redeploy',
        note: 'Railway\'s deploymentRestart mutation may not be available for all deployment types or may require specific permissions. Redeploy achieves the same result by creating a new deployment.',
        details: redeployData
      });
    } else {
      // Success with one of the restart methods
      res.status(200).json({
        success: true,
        message: `Deployment restarted successfully using ${usedMethod}!`,
        serviceName: service.name,
        serviceId: serviceId,
        deploymentId: restartResult?.id || deploymentId,
        status: restartResult?.status || 'RESTARTED',
        method: usedMethod,
        details: restartResult
      });
    }

  } catch (error) {
    console.error('Error restarting deployment:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
