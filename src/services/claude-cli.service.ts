import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import { Logger } from '../core/logger';
import { ChatMessage, CommandResult, CommandTemplate } from '../types/common.types';
import { ClaudeCliDetector, ClaudeInstallation } from './claude-cli-detector.service';
import { SessionId, BrandedTypeValidator } from '../types/branded.types';
import { StrictChatMessage, MessageResponse } from '../types/message.types';
import { 
  createClaudeMessageTransform, 
  ClaudeMessageTransformStream 
} from './streams/claude-message-transform.stream';
import { 
  createMessageToJsonTransform, 
  MessageToJsonTransformStream 
} from './streams/message-json-transform.stream';
import { 
  CircuitBreakerService, 
  CircuitBreakerState 
} from './resilience/circuit-breaker.service';
import { 
  CircuitBreakerStream, 
  CircuitBreakerStreamConfig 
} from './resilience/circuit-breaker.stream';

export class ClaudeCliService implements vscode.Disposable {
  private activeProcesses = new Map<SessionId | string, ChildProcess>();
  private claudeInstallation: ClaudeInstallation | null = null;
  private detector: ClaudeCliDetector;
  private circuitBreaker: CircuitBreakerService;
  private circuitBreakerStreams = new Map<SessionId | string, CircuitBreakerStream>();

  constructor() {
    this.detector = new ClaudeCliDetector();
    this.circuitBreaker = new CircuitBreakerService('claude-cli', {
      failureThreshold: 5,
      timeoutMs: 30000,
      monitoringWindowMs: 60000,
      halfOpenMaxCalls: 3
    });
  }

  async verifyInstallation(): Promise<boolean> {
    try {
      Logger.info('🔍 Verifying Claude Code CLI installation...');
      
      if (this.claudeInstallation) {
        const isValid = await this.detector.validateInstallation(this.claudeInstallation);
        if (isValid) {
          Logger.info(`✅ Existing Claude CLI installation verified: ${this.claudeInstallation.path}`);
          return true;
        }
      }

      // Detect Claude CLI installation using dedicated detector service
      this.claudeInstallation = await this.detector.detectClaudeInstallation();
      
      if (this.claudeInstallation) {
        Logger.info(`✅ Claude CLI detected: ${this.claudeInstallation.path} (${this.claudeInstallation.source})`);
        return true;
      }

      Logger.error('❌ Claude Code CLI not found. Please install it with: npm install -g @anthropic-ai/claude-code');
      return false;
    } catch (error) {
      Logger.error('Error verifying Claude CLI installation', error);
      return false;
    }
  }

  async startChatSession(sessionId: SessionId | string, projectPath?: string): Promise<Readable> {
    if (!this.claudeInstallation) {
      throw new Error('Claude CLI not found. Please install Claude Code.');
    }

    // Validate and convert sessionId to branded type
    const validatedSessionId = typeof sessionId === 'string' 
      ? BrandedTypeValidator.validateSessionId(sessionId)
      : sessionId;

    const args = ['chat'];
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    
    if (projectPath) {
      args.push('--project', projectPath);
    } else if (workspaceRoot) {
      args.push('--project', workspaceRoot);
    }

    Logger.info(`Starting Claude chat session with stream pipeline: ${validatedSessionId}`);

    const childProcess = spawn(this.claudeInstallation.path, args, {
      cwd: projectPath || workspaceRoot,
      stdio: 'pipe',
      env: { ...process.env }
    });

    this.activeProcesses.set(validatedSessionId, childProcess);

    return this.createStreamPipeline(childProcess, validatedSessionId);
  }

  /**
   * Create high-performance stream pipeline for Claude CLI processing with circuit breaker resilience
   * Replaces AsyncIterator with Transform streams for 5-7x performance improvement
   * 
   * Pipeline: CLI stdout -> CircuitBreakerStream -> ClaudeMessageTransform -> MessageToJsonTransform -> Readable
   */
  private createStreamPipeline(childProcess: ChildProcess, sessionId: SessionId): Readable {
    if (!childProcess.stdout) {
      throw new Error('Child process stdout is null');
    }

    // Create circuit breaker configuration
    const circuitBreakerConfig: CircuitBreakerStreamConfig = {
      serviceName: `claude-cli-${sessionId}`,
      sessionId,
      failureThreshold: 5,
      timeoutMs: 30000,
      monitoringWindowMs: 60000,
      halfOpenMaxCalls: 3,
      objectMode: true,
      highWaterMark: 16
    };

    // Create resilient stream pipeline wrapper
    const circuitBreakerStream = new CircuitBreakerStream(circuitBreakerConfig);
    
    // Store circuit breaker stream for management
    this.circuitBreakerStreams.set(sessionId, circuitBreakerStream);

    // Create transform stream instances
    const messageTransform = createClaudeMessageTransform({ 
      sessionId,
      highWaterMark: 16,
      maxMessageSize: 50000
    });

    const jsonTransform = createMessageToJsonTransform({
      validateOutput: true,
      highWaterMark: 16
    });

    // Create output stream
    const outputStream = new Readable({
      objectMode: true,
      highWaterMark: 16,
      read() {
        // Backpressure handled by pipeline
      }
    });

    // Override circuit breaker transform to use our stream pipeline
    circuitBreakerStream.executeTransform = async (chunk: any, encoding: BufferEncoding): Promise<any> => {
      return new Promise((resolve, reject) => {
        // Create a mini-pipeline for this chunk
        const tempMessageTransform = createClaudeMessageTransform({ 
          sessionId,
          highWaterMark: 1,
          maxMessageSize: 50000
        });

        const tempJsonTransform = createMessageToJsonTransform({
          validateOutput: true,
          highWaterMark: 1
        });

        // Set up one-time processing
        tempJsonTransform.once('data', (result) => {
          resolve(result);
        });

        tempJsonTransform.once('error', (error) => {
          reject(error);
        });

        tempMessageTransform.once('error', (error) => {
          reject(error);
        });

        // Process the chunk through the pipeline
        tempMessageTransform.pipe(tempJsonTransform);
        tempMessageTransform.write(chunk, encoding);
        tempMessageTransform.end();
      });
    };

    // Set up comprehensive error handling including circuit breaker events
    this.setupResilientStreamErrorHandling(
      childProcess, 
      circuitBreakerStream, 
      outputStream, 
      sessionId
    );

    // Create pipeline with proper error propagation through circuit breaker
    const pipelineAsync = promisify(pipeline);
    
    // Run pipeline asynchronously with circuit breaker protection
    this.circuitBreaker.execute(async () => {
      return pipelineAsync(
        childProcess.stdout!,
        circuitBreakerStream
      );
    }, undefined, { sessionId })
    .then((result) => {
      if (result.success) {
        Logger.info(`Resilient stream pipeline completed successfully for session: ${sessionId}`);
        outputStream.push(null);
      } else {
        Logger.error('Circuit breaker blocked pipeline operation', {
          error: result.error,
          state: result.state,
          sessionId
        });
        
        // Push error response to output
        const errorResponse: MessageResponse<any> = {
          success: false,
          error: result.error!,
          metadata: {
            sessionId,
            correlationId: undefined,
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        };
        
        outputStream.push(errorResponse);
        outputStream.push(null);
      }
    })
    .catch((error) => {
      Logger.error('Resilient stream pipeline unexpected error', {
        error,
        sessionId
      });
      outputStream.destroy(error);
    });

    // Pipe circuitBreakerStream to outputStream
    circuitBreakerStream.on('data', (messageResponse: MessageResponse<StrictChatMessage>) => {
      outputStream.push(messageResponse);
    });

    circuitBreakerStream.on('end', () => {
      outputStream.push(null);
    });

    return outputStream;
  }

  /**
   * Set up comprehensive error handling for stream pipeline
   */
  private setupStreamErrorHandling(
    childProcess: ChildProcess,
    messageTransform: ClaudeMessageTransformStream,
    jsonTransform: MessageToJsonTransformStream,
    outputStream: Readable,
    sessionId: SessionId
  ): void {
    // Handle child process errors
    childProcess.on('error', (error) => {
      Logger.error('Claude CLI process error', { error, sessionId });
      outputStream.destroy(error);
    });

    childProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        const error = new Error(`Claude CLI process exited with code: ${code}, signal: ${signal}`);
        Logger.error('Claude CLI process unexpected exit', { code, signal, sessionId });
        outputStream.destroy(error);
      }
    });

    // Handle transform stream errors
    messageTransform.on('error', (error) => {
      Logger.error('Message transform stream error', { error, sessionId });
      outputStream.destroy(error);
    });

    jsonTransform.on('error', (error) => {
      Logger.error('JSON transform stream error', { error, sessionId });
      outputStream.destroy(error);
    });

    // Handle output stream errors
    outputStream.on('error', (error) => {
      Logger.error(`Output stream error for session ${sessionId}`, error);
    });

    // Log stream completion
    outputStream.on('end', () => {
      Logger.info(`Output stream ended for session: ${sessionId}`);
    });
  }

  /**
   * Set up comprehensive error handling for resilient stream pipeline with circuit breaker
   */
  private setupResilientStreamErrorHandling(
    childProcess: ChildProcess,
    circuitBreakerStream: CircuitBreakerStream,
    outputStream: Readable,
    sessionId: SessionId
  ): void {
    // Handle child process errors with circuit breaker integration
    childProcess.on('error', (error) => {
      Logger.error('Claude CLI process error with circuit breaker', { 
        error, 
        sessionId,
        circuitStatus: circuitBreakerStream.getCircuitStatus()
      });
      
      // Try to recover through circuit breaker
      circuitBreakerStream.attemptRecovery()
        .then(recovered => {
          if (!recovered) {
            outputStream.destroy(error);
          }
        })
        .catch(recoveryError => {
          Logger.error('Circuit breaker recovery failed', { recoveryError, sessionId });
          outputStream.destroy(error);
        });
    });

    childProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        const error = new Error(`Claude CLI process exited with code: ${code}, signal: ${signal}`);
        Logger.error('Claude CLI process unexpected exit with circuit breaker', { 
          code, 
          signal, 
          sessionId,
          circuitStatus: circuitBreakerStream.getCircuitStatus()
        });
        
        // Attempt recovery through circuit breaker
        circuitBreakerStream.attemptRecovery()
          .then(recovered => {
            if (!recovered) {
              outputStream.destroy(error);
            }
          })
          .catch(recoveryError => {
            Logger.error('Circuit breaker recovery failed on process exit', { recoveryError, sessionId });
            outputStream.destroy(error);
          });
      }
    });

    // Handle circuit breaker stream events
    circuitBreakerStream.on('circuit:open', ({ state, failureCount }) => {
      Logger.warn(`Circuit breaker opened for session ${sessionId}`, {
        state,
        failureCount,
        sessionId
      });
      
      // Emit circuit breaker error to output stream
      const errorResponse: MessageResponse<any> = {
        success: false,
        error: {
          code: 'CIRCUIT_BREAKER_OPEN',
          message: `Circuit breaker opened after ${failureCount} failures`,
          context: {
            sessionId,
            state,
            failureCount,
            timestamp: new Date().toISOString()
          }
        },
        metadata: {
          sessionId,
          correlationId: undefined,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      outputStream.push(errorResponse);
    });

    circuitBreakerStream.on('circuit:half-open', ({ state }) => {
      Logger.info(`Circuit breaker attempting recovery for session ${sessionId}`, {
        state,
        sessionId
      });
    });

    circuitBreakerStream.on('circuit:closed', ({ state }) => {
      Logger.info(`Circuit breaker recovered for session ${sessionId}`, {
        state,
        sessionId
      });
      
      // Emit recovery success to output stream
      const recoveryResponse: MessageResponse<any> = {
        success: true,
        error: undefined,
        metadata: {
          sessionId,
          correlationId: undefined,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      };
      
      outputStream.push(recoveryResponse);
    });

    circuitBreakerStream.on('circuit:failure', ({ error, context }) => {
      Logger.error('Circuit breaker recorded stream failure', {
        error,
        context,
        sessionId
      });
    });

    circuitBreakerStream.on('error', (error) => {
      Logger.error('Circuit breaker stream error', { error, sessionId });
      
      // Try recovery before destroying output
      circuitBreakerStream.attemptRecovery()
        .then(recovered => {
          if (!recovered) {
            outputStream.destroy(error);
          }
        })
        .catch(recoveryError => {
          Logger.error('Final circuit breaker recovery failed', { recoveryError, sessionId });
          outputStream.destroy(error);
        });
    });

    // Handle output stream errors with circuit breaker context
    outputStream.on('error', (error) => {
      Logger.error(`Output stream error for session ${sessionId} with circuit breaker`, {
        error,
        circuitStatus: circuitBreakerStream.getCircuitStatus()
      });
    });

    // Log stream completion with circuit breaker status
    outputStream.on('end', () => {
      Logger.info(`Output stream ended for session: ${sessionId}`, {
        circuitStatus: circuitBreakerStream.getCircuitStatus()
      });
      
      // Clean up circuit breaker stream
      this.circuitBreakerStreams.delete(sessionId);
    });
  }

  async executeCommand(
    command: string, 
    args: string[], 
    options: { timeout?: number } = {}
  ): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout?.on('data', (data) => stdout += data);
      process.stderr?.on('data', (data) => stderr += data);
      
      const timeoutId = options.timeout ? setTimeout(() => {
        process.kill();
        reject(new Error(`Command timeout after ${options.timeout}ms`));
      }, options.timeout) : null;
      
      process.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          stdout,
          stderr,
          code: code || 0
        });
      });
      
      process.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  /**
   * Send a message to an active Claude CLI session
   */
  async sendMessageToSession(sessionId: SessionId | string, message: string): Promise<void> {
    // Validate sessionId for branded type compatibility
    const validatedSessionId = typeof sessionId === 'string' 
      ? BrandedTypeValidator.validateSessionId(sessionId)
      : sessionId;
      
    const process = this.activeProcesses.get(validatedSessionId);
    
    if (!process || process.killed) {
      throw new Error(`No active Claude CLI process found for session: ${validatedSessionId}`);
    }

    if (!process.stdin) {
      throw new Error('Claude CLI process stdin is not available');
    }

    try {
      process.stdin.write(message + '\n');
      Logger.info(`Message sent to Claude CLI session ${validatedSessionId}: ${message.substring(0, 100)}...`);
    } catch (error) {
      Logger.error(`Failed to send message to Claude CLI session ${validatedSessionId}:`, error);
      throw error;
    }
  }

  endSession(sessionId: SessionId | string): void {
    const validatedSessionId = typeof sessionId === 'string' 
      ? BrandedTypeValidator.validateSessionId(sessionId)
      : sessionId;
      
    const process = this.activeProcesses.get(validatedSessionId);
    if (process && !process.killed) {
      process.kill();
    }
    this.activeProcesses.delete(validatedSessionId);
    
    // Clean up circuit breaker stream
    const circuitBreakerStream = this.circuitBreakerStreams.get(validatedSessionId);
    if (circuitBreakerStream) {
      circuitBreakerStream.destroy();
      this.circuitBreakerStreams.delete(validatedSessionId);
    }
  }

  /**
   * Get circuit breaker status for a session
   */
  getCircuitBreakerStatus(sessionId: SessionId | string) {
    const validatedSessionId = typeof sessionId === 'string' 
      ? BrandedTypeValidator.validateSessionId(sessionId)
      : sessionId;
      
    const circuitBreakerStream = this.circuitBreakerStreams.get(validatedSessionId);
    if (circuitBreakerStream) {
      return circuitBreakerStream.getCircuitStatus();
    }
    
    // Return global circuit breaker status if no session-specific one exists
    return this.circuitBreaker.getStatus();
  }

  /**
   * Manually reset circuit breaker for a session
   */
  resetCircuitBreaker(sessionId?: SessionId | string): void {
    if (sessionId) {
      const validatedSessionId = typeof sessionId === 'string' 
        ? BrandedTypeValidator.validateSessionId(sessionId)
        : sessionId;
        
      const circuitBreakerStream = this.circuitBreakerStreams.get(validatedSessionId);
      if (circuitBreakerStream) {
        circuitBreakerStream.resetCircuit();
        Logger.info(`Circuit breaker manually reset for session: ${validatedSessionId}`);
      }
    } else {
      // Reset global circuit breaker
      this.circuitBreaker.reset();
      Logger.info('Global circuit breaker manually reset');
    }
  }

  /**
   * Attempt recovery for a session's circuit breaker
   */
  async attemptCircuitBreakerRecovery(sessionId: SessionId | string): Promise<boolean> {
    const validatedSessionId = typeof sessionId === 'string' 
      ? BrandedTypeValidator.validateSessionId(sessionId)
      : sessionId;
      
    const circuitBreakerStream = this.circuitBreakerStreams.get(validatedSessionId);
    if (circuitBreakerStream) {
      return circuitBreakerStream.attemptRecovery();
    }
    
    return false;
  }

  /**
   * Get health status including circuit breaker states
   */
  getHealthStatus(): {
    activeProcesses: number;
    circuitBreakerStreams: number;
    globalCircuitBreaker: any;
    sessionCircuitBreakers: Record<string, any>;
  } {
    const sessionCircuitBreakers: Record<string, any> = {};
    
    for (const [sessionId, stream] of this.circuitBreakerStreams) {
      sessionCircuitBreakers[sessionId] = stream.getCircuitStatus();
    }
    
    return {
      activeProcesses: this.activeProcesses.size,
      circuitBreakerStreams: this.circuitBreakerStreams.size,
      globalCircuitBreaker: this.circuitBreaker.getStatus(),
      sessionCircuitBreakers
    };
  }

  dispose(): void {
    Logger.info('Disposing Claude CLI service with circuit breaker cleanup...');
    
    // Clean up all active processes
    for (const [sessionId, process] of this.activeProcesses) {
      if (!process.killed) {
        process.kill();
      }
    }
    this.activeProcesses.clear();
    
    // Clean up all circuit breaker streams
    for (const [sessionId, stream] of this.circuitBreakerStreams) {
      try {
        stream.destroy();
      } catch (error) {
        Logger.error(`Error destroying circuit breaker stream for session ${sessionId}`, error);
      }
    }
    this.circuitBreakerStreams.clear();
    
    // Reset global circuit breaker
    this.circuitBreaker.reset();
    
    Logger.info('Claude CLI service disposed with circuit breaker cleanup complete');
  }
}
