import { NextApiRequest, NextApiResponse } from 'next';
import { apolloClient } from '../../lib/apollo-client';
import { GET_SERVICE_STATUS } from '../../lib/graphql';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== 'string') {
    return res.status(400).json({ 
      error: 'Missing required parameter: serviceId' 
    });
  }

  const railwayToken = process.env.RAILWAY_API_TOKEN;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  try {
    // Get the current service status
    const result = await apolloClient.query({
      query: GET_SERVICE_STATUS,
      variables: {
        serviceId: serviceId,
      },
      context: {
        headers: {
          'Authorization': `Bearer ${railwayToken}`,
        },
      },
      fetchPolicy: 'no-cache', // Always fetch fresh data
    });

    const service = result.data?.service;

    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
      });
    }

    // Get the latest deployment
    const latestDeployment = service.deployments?.[0];
    const isRunning = latestDeployment?.status === 'DEPLOYED';

    res.status(200).json({
      success: true,
      isRunning,
      service: {
        id: service.id,
        name: service.name,
        status: service.status,
      },
      deployment: latestDeployment ? {
        id: latestDeployment.id,
        status: latestDeployment.status,
        createdAt: latestDeployment.createdAt,
      } : null,
    });

  } catch (error) {
    console.error('Error getting service status:', error);
    
    // Handle GraphQL errors
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const graphQLError = error.graphQLErrors[0];
      return res.status(400).json({
        error: `GraphQL Error: ${graphQLError.message}`,
        details: graphQLError.extensions,
      });
    }

    // Handle network errors
    if (error.networkError) {
      return res.status(503).json({
        error: 'Network error connecting to Railway API',
        details: error.networkError.message,
      });
    }

    // Handle other errors
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
