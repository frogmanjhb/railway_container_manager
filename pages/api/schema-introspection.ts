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
    // Get the GraphQL schema introspection
    console.log('Getting GraphQL schema...');
    const response = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `query IntrospectionQuery {
          __schema {
            mutationType {
              name
              fields {
                name
                description
                args {
                  name
                  type {
                    name
                    kind
                    ofType {
                      name
                      kind
                    }
                  }
                }
              }
            }
          }
        }`
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Schema introspection errors:', data.errors);
      return res.status(400).json({
        error: 'Schema introspection failed',
        details: data.errors
      });
    }

    // Filter for deployment and service related mutations
    const mutations = data.data?.__schema?.mutationType?.fields || [];
    const deploymentMutations = mutations.filter((mutation: any) => 
      mutation.name.toLowerCase().includes('deployment') || 
      mutation.name.toLowerCase().includes('service')
    );

    res.status(200).json({
      success: true,
      message: 'Schema introspection completed',
      totalMutations: mutations.length,
      deploymentMutations: deploymentMutations.map((m: any) => ({
        name: m.name,
        description: m.description,
        args: m.args.map((a: any) => ({
          name: a.name,
          type: a.type.name || a.type.ofType?.name || 'Unknown'
        }))
      }))
    });

  } catch (error) {
    console.error('Schema introspection error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
