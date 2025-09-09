import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const railwayToken = process.env.RAILWAY_API_TOKEN;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  try {
    // Test 1: Simple me query
    console.log('Testing me query...');
    const meResponse = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `query { me { id name email } }`
      }),
    });

    const meData = await meResponse.json();
    console.log('Me query result:', meData);

    // Test 2: Try to get projects using the correct schema from Railway docs
    console.log('Testing projects query...');
    const projectResponse = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `query me {
          me {
            projects {
              edges {
                node {
                  id
                  name
                  services {
                    edges {
                      node {
                        id
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }`
      }),
    });

    const projectData = await projectResponse.json();
    console.log('Projects query result:', projectData);

    // Test 3: Try to get a specific project by ID
    const projectId = process.env.NEXT_PUBLIC_RAILWAY_PROJECT_ID;
    if (projectId) {
      console.log('Testing specific project query...');
      const specificProjectResponse = await fetch('https://backboard.railway.com/graphql/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${railwayToken}`,
        },
        body: JSON.stringify({
          query: `query {
            project(id: "${projectId}") {
              id
              name
              services {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          }`
        }),
      });

      const specificProjectData = await specificProjectResponse.json();
      console.log('Specific project query result:', specificProjectData);
    }

    res.status(200).json({
      success: true,
      message: 'Debug completed - check server logs for details',
      meQuery: meData,
      projectQuery: projectData,
      servicesQuery: projectId ? 'Check logs' : 'No project ID configured'
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
