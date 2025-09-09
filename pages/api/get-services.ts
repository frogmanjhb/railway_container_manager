import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { projectId } = req.query;

  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ 
      error: 'Missing required parameter: projectId' 
    });
  }

  const railwayToken = process.env.RAILWAY_API_TOKEN;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  try {
    // Railway GraphQL API endpoint
    const response = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `
          query GetProjectServices($projectId: String!) {
            project(id: $projectId) {
              id
              name
              services {
                id
                name
                status
                createdAt
              }
            }
          }
        `,
        variables: {
          projectId: projectId
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
      throw new Error(`HTTP error! status: ${response.status} - ${data.message || response.statusText}`);
    }

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      throw new Error(`GraphQL error: ${data.errors[0].message}`);
    }

    const project = data.data?.project;

    if (!project) {
      return res.status(404).json({
        error: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
      },
      services: project.services.map((service: any) => ({
        id: service.id,
        name: service.name,
        status: service.status,
        createdAt: service.createdAt,
      })),
    });

  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
