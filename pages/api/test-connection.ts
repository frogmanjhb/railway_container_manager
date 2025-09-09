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
    // Use Railway's official GraphQL API as documented
    const response = await fetch('https://backboard.railway.com/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `
          query GetMe {
            me {
              id
              name
              email
            }
          }
        `
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

    const user = data.data?.me;

    if (!user) {
      return res.status(400).json({
        error: 'Failed to get user information',
        details: data,
        fullError: JSON.stringify(data, null, 2)
      });
    }

    res.status(200).json({
      success: true,
      message: 'Railway API connection successful',
      user: user,
      tokenLength: railwayToken.length,
      tokenStart: railwayToken.substring(0, 10) + '...',
      details: data
    });

  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}