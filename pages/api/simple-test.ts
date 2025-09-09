import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const railwayToken = process.env.RAILWAY_API_TOKEN;

  if (!railwayToken) {
    return res.status(500).json({ 
      error: 'Railway API token not configured' 
    });
  }

  try {
    // Test with the simplest possible query
    const response = await fetch('https://backboard.railway.app/graphql/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${railwayToken}`,
      },
      body: JSON.stringify({
        query: `query { __schema { types { name } } }`
      }),
    });

    const data = await response.json();

    res.status(200).json({
      success: true,
      status: response.status,
      hasData: !!data.data,
      hasErrors: !!data.errors,
      errorCount: data.errors ? data.errors.length : 0,
      firstError: data.errors ? data.errors[0] : null,
      tokenLength: railwayToken.length,
      tokenStart: railwayToken.substring(0, 10)
    });

  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenLength: railwayToken.length,
      tokenStart: railwayToken.substring(0, 10)
    });
  }
}
