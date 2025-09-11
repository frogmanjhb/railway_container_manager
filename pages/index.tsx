import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';

/**
 * Container Status Interface
 * Defines the structure for tracking Railway deployment status
 */
interface ContainerStatus {
  isRunning: boolean;
  deploymentId?: string;
  lastUpdated: string;
}

/**
 * Main Home Component - Railway Container Manager with Interactive Mini-Game
 * 
 * This component demonstrates:
 * - Modern React patterns (hooks, refs, state management)
 * - Railway GraphQL API integration
 * - HTML5 Canvas game development
 * - Real-time UI updates and animations
 * - Error handling and user feedback
 * 
 * Key Features:
 * - Deployment management (start, stop, restart)
 * - Interactive "Byte Wrangler" mini-game
 * - Dynamic difficulty progression
 * - Glass-morphism UI design
 */
export default function Home() {
  // ===== STATE MANAGEMENT =====
  // Core application state
  const [currentTime, setCurrentTime] = useState<string>('');
  const [status, setStatus] = useState<ContainerStatus>({
    isRunning: false,
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Game state management
  const [boredMode, setBoredMode] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [gameResult, setGameResult] = useState<'playing' | 'success' | 'failed'>('playing');
  const [timeLeft, setTimeLeft] = useState(15);
  const [isDeploying, setIsDeploying] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [bytesWrangled, setBytesWrangled] = useState(0);
  
  // Canvas and animation references for the mini-game
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Configuration - Replace these with your actual Railway project and service IDs
  const RAILWAY_PROJECT_ID = process.env.NEXT_PUBLIC_RAILWAY_PROJECT_ID || 'your-project-id';
  const RAILWAY_SERVICE_ID = process.env.NEXT_PUBLIC_RAILWAY_SERVICE_ID || 'your-service-id';

  useEffect(() => {
    // Set the time on the client side to avoid hydration mismatch
    setCurrentTime(new Date().toLocaleString());
  }, []);

  const handleRedeployContainer = async () => {
    if (boredMode) {
      // Start the mini-game
      setShowGame(true);
      setGameResult('playing');
      setTimeLeft(15);
    } else {
      // Direct deployment
      await performDeployment();
    }
  };

  /**
   * Perform Railway Deployment
   * 
   * Handles the core deployment logic with:
   * - Duplicate deployment prevention
   * - Loading state management
   * - Error handling and user feedback
   * - Success/failure message display
   * - Game result integration
   */
  const performDeployment = async () => {
    // Prevent multiple deployments
    if (isDeploying) {
      console.log('Deployment already in progress, skipping...');
      return;
    }

    setIsDeploying(true);
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
      const message = gameResult === 'success' 
        ? 'All 20 Bytes Secured! Service deployed successfully! 🚀' 
        : gameResult === 'failed'
        ? 'Try again! Deploying anyway... 👻'
        : data.message || 'Service redeployed successfully!';
      setSuccess(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeploy container');
    } finally {
      setIsLoading(false);
      setIsDeploying(false);
      // Reset game state
      setGameResult('playing');
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

  // ===== GAME LOGIC =====
  /**
   * Start Interactive Mini-Game
   * 
   * Initializes the "Byte Wrangler" game with:
   * - HTML5 Canvas setup and context
   * - Game state initialization (bytes, ghosts, controller)
   * - Mouse event handlers for interaction
   * - Game loop with requestAnimationFrame
   * - Dynamic difficulty progression
   * - Byte respawning system
   */
  const startGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('Canvas not found');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context not found');
      return;
    }

    console.log('Starting interactive game...');

    // Clear any existing intervals/animations
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Game state
    let bytes: Array<{
      x: number, y: number, vx: number, vy: number, size: number, color: string, 
      caught: boolean, grabbed: boolean, targetX: number, targetY: number
    }> = [];
    let ghosts: Array<{
      x: number, y: number, vx: number, vy: number, size: number, 
      color: string, phase: number
    }> = [];
    let controller = { x: canvas.width / 2, y: canvas.height / 2, size: 20 };
    let container = { x: 250, y: 200, width: 200, height: 100 };
    let caughtBytes = 0;
    let eatenBytes = 0;
    let isDraggingLocal = false;
    let lastByteSpawn = 0;
    const totalBytes = 20;
    const totalGhosts = 3;

    // Initialize bytes
    for (let i = 0; i < totalBytes; i++) {
      bytes.push({
        x: Math.random() * (canvas.width - 20),
        y: Math.random() * (canvas.height - 20),
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 8 + Math.random() * 4,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        caught: false,
        grabbed: false,
        targetX: 0,
        targetY: 0
      });
    }

    // Initialize ghosts
    for (let i = 0; i < totalGhosts; i++) {
      ghosts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: 15 + Math.random() * 5,
        color: `hsl(${200 + Math.random() * 40}, 50%, 50%)`,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Mouse event handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      controller.x = x;
      controller.y = y;
    };

    const handleMouseDown = (e: MouseEvent) => {
      console.log('Mouse down - starting drag');
      isDraggingLocal = true;
      setIsDragging(true);
    };

    const handleMouseUp = () => {
      console.log('Mouse up - stopping drag');
      isDraggingLocal = false;
      setIsDragging(false);
    };

    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Game loop
    const gameLoop = () => {
      // Check if game should continue
      if (!showGame || gameResult !== 'playing' || isDeploying) {
        console.log('Game stopped:', { showGame, gameResult, isDeploying });
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new bytes every 1 second
      const currentTime = Date.now();
      if (currentTime - lastByteSpawn > 1000) {
        // Find a byte that's caught and respawn it
        const caughtByte = bytes.find(byte => byte.caught);
        if (caughtByte) {
          caughtByte.x = Math.random() * (canvas.width - 20);
          caughtByte.y = Math.random() * (canvas.height - 20);
          caughtByte.vx = (Math.random() - 0.5) * 4;
          caughtByte.vy = (Math.random() - 0.5) * 4;
          caughtByte.caught = false;
          caughtByte.grabbed = false;
          caughtByte.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
          // Don't decrement the counter - bytes respawn but counter stays up
          console.log('Byte respawned!');
        }
        lastByteSpawn = currentTime;
      }

      // Dynamic ghost speed based on progress
      const ghostSpeedMultiplier = caughtBytes >= 10 ? 2.0 : 1.0;
      if (caughtBytes >= 10) {
        console.log('Ghosts are now faster!');
      }

      // Draw container
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.strokeRect(container.x, container.y, container.width, container.height);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fillRect(container.x, container.y, container.width, container.height);

      // Update and draw ghosts
      ghosts.forEach((ghost) => {
        // Update position with dynamic speed
        ghost.x += ghost.vx * ghostSpeedMultiplier;
        ghost.y += ghost.vy * ghostSpeedMultiplier;
        ghost.phase += 0.1;

        // Bounce off walls
        if (ghost.x <= 0 || ghost.x >= canvas.width - ghost.size) {
          ghost.vx *= -1;
          ghost.x = Math.max(0, Math.min(canvas.width - ghost.size, ghost.x));
        }
        if (ghost.y <= 0 || ghost.y >= canvas.height - ghost.size) {
          ghost.vy *= -1;
          ghost.y = Math.max(0, Math.min(canvas.height - ghost.size, ghost.y));
        }

        // Draw ghost with pulsing effect
        ctx.fillStyle = ghost.color;
        ctx.shadowColor = ghost.color;
        ctx.shadowBlur = 15 + Math.sin(ghost.phase) * 5;
        ctx.beginPath();
        ctx.arc(ghost.x + ghost.size/2, ghost.y + ghost.size/2, ghost.size/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Speed indicator when ghosts are faster
        if (ghostSpeedMultiplier > 1) {
          ctx.strokeStyle = '#ff6b6b';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(ghost.x + ghost.size/2, ghost.y + ghost.size/2, ghost.size/2 + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw ghost eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ghost.x + ghost.size/2 - 3, ghost.y + ghost.size/2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ghost.x + ghost.size/2 + 3, ghost.y + ghost.size/2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and draw bytes
      bytes.forEach((byte) => {
        if (!byte.caught && !byte.grabbed) {
          // Update position (faster movement)
          byte.x += byte.vx;
          byte.y += byte.vy;

          // Bounce off walls
          if (byte.x <= 0 || byte.x >= canvas.width - byte.size) {
            byte.vx *= -1;
            byte.x = Math.max(0, Math.min(canvas.width - byte.size, byte.x));
          }
          if (byte.y <= 0 || byte.y >= canvas.height - byte.size) {
            byte.vy *= -1;
            byte.y = Math.max(0, Math.min(canvas.height - byte.size, byte.y));
          }

          // Check if grabbed by controller
          const distance = Math.sqrt((byte.x - controller.x) ** 2 + (byte.y - controller.y) ** 2);
          if (distance < controller.size + byte.size && isDraggingLocal) {
            byte.grabbed = true;
            byte.targetX = controller.x;
            byte.targetY = controller.y;
            console.log('Byte grabbed!', { distance, controllerSize: controller.size, byteSize: byte.size });
          }

          // Check if eaten by ghost
          ghosts.forEach((ghost) => {
            const ghostDistance = Math.sqrt((byte.x - ghost.x) ** 2 + (byte.y - ghost.y) ** 2);
            if (ghostDistance < ghost.size + byte.size) {
              byte.caught = true;
              eatenBytes++;
              console.log(`Byte eaten by ghost! ${eatenBytes}/${totalBytes}`);
            }
          });
        }

        // If grabbed, follow controller slowly
        if (byte.grabbed && !byte.caught) {
          const dx = controller.x - byte.x;
          const dy = controller.y - byte.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 5) {
            byte.x += (dx / distance) * 3;
            byte.y += (dy / distance) * 3;
          }

          // Check if in container
          if (byte.x >= container.x && byte.x <= container.x + container.width &&
              byte.y >= container.y && byte.y <= container.y + container.height) {
            byte.caught = true;
            byte.grabbed = false;
            caughtBytes++;
            setBytesWrangled(caughtBytes);
            console.log(`Byte secured! ${caughtBytes}/${totalBytes}`);
          }
        }

        // Draw byte
        if (!byte.caught) {
          ctx.fillStyle = byte.grabbed ? '#f59e0b' : byte.color;
          ctx.shadowColor = byte.grabbed ? '#f59e0b' : byte.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(byte.x + byte.size/2, byte.y + byte.size/2, byte.size/2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Debug: Show byte state
          if (byte.grabbed) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText('GRABBED', byte.x - 10, byte.y - 10);
          }
        }
      });

      // Draw controller
      ctx.fillStyle = isDraggingLocal ? '#f59e0b' : '#6366f1';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(controller.x, controller.y, controller.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Debug: Draw controller grab radius
      if (isDraggingLocal) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(controller.x, controller.y, controller.size + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw controller crosshair
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(controller.x - 10, controller.y);
      ctx.lineTo(controller.x + 10, controller.y);
      ctx.moveTo(controller.x, controller.y - 10);
      ctx.lineTo(controller.x, controller.y + 10);
      ctx.stroke();

      // Check win/lose conditions
      if (caughtBytes >= totalBytes) {
        console.log('All bytes secured!');
        setGameResult('success');
        // Clear intervals but keep game window open
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        // Remove event listeners
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        return;
      }

      if (eatenBytes >= totalBytes) {
        console.log('All bytes eaten by ghosts!');
        setGameResult('failed');
        // Clear intervals but keep game window open
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        // Remove event listeners
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        return;
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    // Start game loop
    gameLoop();

    // Timer
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          console.log('Game time up!');
          setGameResult('failed');
          // Clear intervals but keep game window open
          if (gameIntervalRef.current) {
            clearInterval(gameIntervalRef.current);
          }
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
          // Remove event listeners
          canvas.removeEventListener('mousemove', handleMouseMove);
          canvas.removeEventListener('mousedown', handleMouseDown);
          canvas.removeEventListener('mouseup', handleMouseUp);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const closeGame = () => {
    setShowGame(false);
    setGameResult('playing');
    setIsDeploying(false);
    setBytesWrangled(0);
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const restartGame = () => {
    setShowGame(false);
    setGameResult('playing');
    setIsDeploying(false);
    setBytesWrangled(0);
    setTimeLeft(15);
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    // Restart the game immediately
    setTimeout(() => {
      setShowGame(true);
    }, 100);
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Start game when modal opens
  useEffect(() => {
    if (showGame && gameResult === 'playing') {
      const timer = setTimeout(() => {
        startGame();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showGame, gameResult]);

  // Cleanup game on unmount
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

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
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
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
                  
                  <button 
                    onClick={() => setBoredMode(!boredMode)}
                    style={{
                      background: boredMode ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255, 255, 255, 0.05)',
                      color: boredMode ? '#ffffff' : '#8b8b8b',
                      border: `1px solid ${boredMode ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: boredMode ? '600' : '400'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = boredMode ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'rgba(255, 255, 255, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = boredMode ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255, 255, 255, 0.05)'}
                  >
                    {boredMode ? '🎮 Bored-Mode ON' : '🎮 Bored-Mode OFF'}
                  </button>
                </div>

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

      {/* Game Modal */}
      {showGame && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            maxWidth: '600px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              color: '#ffffff', 
              margin: '0 0 1rem 0',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              Byte Wrangler! 🎮
            </h2>
            
            <p style={{ 
              color: '#8b8b8b', 
              margin: '0 0 1rem 0',
              fontSize: '0.875rem'
            }}>
              Drag the controller to grab bytes and guide them to the container. Avoid the ghosts!
            </p>

            {/* Timer and Byte Counter */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              margin: '0 0 1rem 0'
            }}>
              {/* Timer */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flex: 1
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f59e0b' : '#ef4444',
                  animation: timeLeft <= 5 ? 'pulse 1s infinite' : 'none'
                }}></div>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>
                  {timeLeft}s
                </span>
              </div>

              {/* Byte Counter */}
              <div style={{
                background: bytesWrangled >= 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                flex: 1,
                border: bytesWrangled >= 10 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: bytesWrangled >= 20 ? '#22c55e' : bytesWrangled >= 10 ? '#f59e0b' : '#6366f1',
                  animation: bytesWrangled >= 20 ? 'pulse 1s infinite' : 'none'
                }}></div>
                <span style={{ color: '#ffffff', fontWeight: '600' }}>
                  {bytesWrangled}/20 Bytes
                  {bytesWrangled >= 10 && <span style={{ color: '#ff6b6b', fontSize: '0.75rem' }}> (Ghosts Faster!)</span>}
                </span>
              </div>
            </div>

            {/* Game Canvas or Game Over Screen */}
            {gameResult === 'playing' ? (
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{
                  border: '2px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  margin: '0 0 1rem 0',
                  cursor: 'crosshair'
                }}
              />
            ) : (
              <div style={{
                width: '600px',
                height: '400px',
                border: '2px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                margin: '0 0 1rem 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  fontSize: '3rem',
                  color: gameResult === 'success' ? '#22c55e' : '#ef4444',
                  fontWeight: 'bold'
                }}>
                  {gameResult === 'success' ? '🎉' : '💀'}
                </div>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  {gameResult === 'success' ? 'Victory!' : 'Game Over!'}
                </h3>
                <p style={{
                  color: '#8b8b8b',
                  fontSize: '1rem',
                  margin: '0',
                  textAlign: 'center'
                }}>
                  {gameResult === 'success' 
                    ? 'All 20 bytes secured! Ready to deploy?' 
                    : 'Try again! You can do better!'
                  }
                </p>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#ffffff', margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
                    Final Score: {bytesWrangled}/20 Bytes
                  </p>
                  <p style={{ color: '#8b8b8b', margin: '0', fontSize: '0.875rem' }}>
                    {gameResult === 'success' ? 'Perfect!' : 'Keep trying!'}
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '1rem',
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              color: '#8b8b8b'
            }}>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <strong>How to play:</strong>
              </p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', textAlign: 'left' }}>
                <li>Move your mouse to control the blue crosshair</li>
                <li>Click and drag to grab nearby bytes (they turn orange)</li>
                <li>Guide grabbed bytes to the blue container to secure them</li>
                <li>Avoid the pulsing ghosts - they eat bytes!</li>
                <li>Secure all 20 bytes before 15 seconds runs out</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {gameResult === 'playing' ? (
                <>
                  <button
                    onClick={restartGame}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: 1,
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Restart Game
                  </button>

                  <button
                    onClick={closeGame}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease',
                      flex: 1
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    Skip Game & Deploy
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={restartGame}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: 1,
                      boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Play Again
                  </button>

                  <button
                    onClick={async () => {
                      setShowGame(false);
                      await performDeployment();
                    }}
                    style={{
                      background: gameResult === 'success' 
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                        : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flex: 1,
                      boxShadow: gameResult === 'success' 
                        ? '0 4px 16px rgba(34, 197, 94, 0.3)' 
                        : '0 4px 16px rgba(99, 102, 241, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {gameResult === 'success' ? 'Deploy Now!' : 'Deploy Anyway'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}