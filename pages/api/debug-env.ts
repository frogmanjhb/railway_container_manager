import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const railwayToken = process.env.RAILWAY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_RAILWAY_PROJECT_ID;
  const serviceId = process.env.NEXT_PUBLIC_RAILWAY_SERVICE_ID;

  res.status(200).json({
    hasToken: !!railwayToken,
    tokenLength: railwayToken ? railwayToken.length : 0,
    tokenStart: railwayToken ? railwayToken.substring(0, 10) + '...' : 'none',
    projectId: projectId,
    serviceId: serviceId,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('RAILWAY'))
  });
}
