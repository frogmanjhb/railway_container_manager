import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const railwayToken = process.env.RAILWAY_API_TOKEN;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  try {
    // Try Railway's REST API instead of GraphQL
    const response = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `query { me { id } }`
      }),
    });

    const data = await response.json();

    res.status(200).json({
      success: true,
      status: response.status,
      data: data,
      tokenUsed: railwayToken.substring(0, 10) + '...'
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenUsed: railwayToken.substring(0, 10) + '...'
    });
  }
}
