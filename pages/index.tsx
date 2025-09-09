import Head from 'next/head';
import { useState, useEffect } from 'react';

interface ContainerStatus {
  isRunning: boolean;
  deploymentId?: string;
  lastUpdated: string;
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [status, setStatus] = useState<ContainerStatus>({
    isRunning: false,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Configuration - Replace these with your actual Railway project and service IDs
  const RAILWAY_PROJECT_ID = process.env.NEXT_PUBLIC_RAILWAY_PROJECT_ID || 'your-project-id';
  const RAILWAY_SERVICE_ID = process.env.NEXT_PUBLIC_RAILWAY_SERVICE_ID || 'your-service-id';

  useEffect(() => {
    // Set the time on the client side to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString());
  }, []);

  const handleRedeployContainer = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/start-deployment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: RAILWAY_PROJECT_ID,
          serviceId: RAILWAY_SERVICE_ID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeploy container');
      }

      setStatus({
        isRunning: true,
        deploymentId: data.newDeploymentId || data.deploymentId,
        lastUpdated: new Date().toISOString(),
      });
      setSuccess(data.message || 'Service redeployed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeploy container');
    } finally {
      setIsLoading(false);
    }
  };


  const handleStopContainer = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/stop-deployment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: RAILWAY_PROJECT_ID,
          serviceId: RAILWAY_SERVICE_ID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop container');
      }

      setStatus({
        isRunning: false,
        lastUpdated: new Date().toISOString(),
      });
      setSuccess(data.message || 'Deployment status retrieved!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop container');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const testConnection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test connection');
      }

      setSuccess(`Connection successful! Logged in as: ${data.user?.name || data.user?.email || 'Unknown'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test connection');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <Head>
        <title>Railway Deployment Manager</title>
        <meta name="description" content="Deploy and manage your Railway services" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            background: #0f0f23;
            color: #ffffff;
          }
        `}</style>
      </Head>

      <main style={{ 
        background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
        minHeight: '100vh',
        padding: '2rem 1rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Railway Deployment Manager
            </h1>
            <p style={{ color: '#8b8b8b', fontSize: '1.125rem', fontWeight: '400' }}>
              Deploy and manage your Railway services
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2rem',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                marginBottom: '1.5rem', 
                color: '#ffffff',
                margin: '0 0 1.5rem 0'
              }}>
                Service Status
              </h2>

              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  {status.isRunning ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: '#22c55e'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#22c55e',
                        animation: 'pulse 2s infinite'
                      }}></div>
                      Active
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(107, 114, 128, 0.1)',
                      border: '1px solid rgba(107, 114, 128, 0.3)',
                      borderRadius: '8px',
                      padding: '0.5rem 1rem',
                      color: '#6b7280'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#6b7280'
                      }}></div>
                      Inactive
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.875rem', color: '#8b8b8b', margin: '0.5rem 0' }}>
                  Last updated: {currentTime || 'Loading...'}
                </p>
                {status.deploymentId && (
                  <p style={{ fontSize: '0.75rem', color: '#6b6b6b', margin: '0.25rem 0' }}>
                    Deployment ID: {status.deploymentId}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleRedeployContainer}
                  disabled={isLoading}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseOut={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  {isLoading ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid white', 
                        borderTop: '2px solid transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }}></div>
                      Redeploying...
                    </>
                  ) : (
                    'Redeploy Service'
                  )}
                </button>

                <button 
                  onClick={handleStopContainer}
                  disabled={isLoading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '0.75rem 2rem',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
                  onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                >
                  {isLoading ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid white', 
                        borderTop: '2px solid transparent', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }}></div>
                      Loading...
                    </>
                  ) : (
                    'Check Status'
                  )}
                </button>
              </div>

              {error && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  color: '#ef4444', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>!</div>
                  <span style={{ fontWeight: '500' }}>Error:</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div style={{ 
                  background: 'rgba(34, 197, 94, 0.1)', 
                  border: '1px solid rgba(34, 197, 94, 0.3)', 
                  color: '#22c55e', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>✓</div>
                  <span>{success}</span>
                </div>
              )}

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button 
                  onClick={() => setShowConfig(!showConfig)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#8b8b8b',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  {showConfig ? 'Hide Configuration' : 'Show Configuration'}
                </button>

                {showConfig && (
                  <div style={{ 
                    marginTop: '1rem', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '12px', 
                    padding: '1.5rem', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    textAlign: 'left'
                  }}>
                    <h3 style={{ color: '#ffffff', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>Configuration</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#8b8b8b', margin: '0.5rem 0', fontSize: '0.875rem' }}>
                        <strong>Project ID:</strong> {RAILWAY_PROJECT_ID}
                      </p>
                      <p style={{ color: '#8b8b8b', margin: '0.5rem 0', fontSize: '0.875rem' }}>
                        <strong>Service ID:</strong> {RAILWAY_SERVICE_ID}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        onClick={testConnection}
                        disabled={isLoading}
                        style={{ 
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                          color: 'white', 
                          border: 'none', 
                          padding: '0.5rem 1rem', 
                          borderRadius: '8px', 
                          fontSize: '0.875rem',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          opacity: isLoading ? 0.6 : 1,
                          fontWeight: '500'
                        }}
                      >
                        {isLoading ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                    
                    <p style={{ fontSize: '0.75rem', color: '#6b6b6b', marginTop: '1rem', margin: '1rem 0 0 0' }}>
                      {RAILWAY_PROJECT_ID === 'your-project-id' ? 
                        'Create .env.local file with your Railway credentials' : 
                        'Configuration loaded from environment variables'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}