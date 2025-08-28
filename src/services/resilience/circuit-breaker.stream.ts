/**
 * Circuit Breaker Stream Transform Wrapper
 * Based on architectural analysis lines 789-817
 * Wraps any Transform stream with circuit breaker resilience pattern
 */

import { Transform, TransformOptions, TransformCallback } from 'stream';
import { Logger } from '../../core/logger';
import { CircuitBreakerService, CircuitBreakerState } from './circuit-breaker.service';
import { SessionId, CorrelationId } from '../../types/branded.types';
import { MessageResponse, MessageError } from '../../types/message.types';

/**
 * Configuration for circuit breaker stream wrapper
 */
export interface CircuitBreakerStreamConfig extends TransformOptions {
  readonly serviceName: string;
  readonly sessionId?: SessionId;
  readonly failureThreshold?: number;       // Number of failures before opening circuit
  readonly timeoutMs?: number;              // Time to wait before attempting recovery
  readonly monitoringWindowMs?: number;     // Time window for failure counting
  readonly halfOpenMaxCalls?: number;       // Max calls allowed in HALF_OPEN state
  readonly restartOnRecovery?: boolean;     // Whether to restart underlying stream on recovery
}

/**
 * Stream error context for circuit breaker
 */
export interface StreamErrorContext extends Readonly<Record<string, unknown>> {
  readonly sessionId?: SessionId;
  readonly correlationId?: CorrelationId;
  readonly chunkSize?: number;
  readonly streamPosition?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Circuit breaker events emitted by the stream
 */
export interface CircuitBreakerStreamEvents {
  'circuit:open': { state: CircuitBreakerState; failureCount: number };
  'circuit:half-open': { state: CircuitBreakerState };
  'circuit:closed': { state: CircuitBreakerState };
  'circuit:failure': { error: Error; context: StreamErrorContext };
  'circuit:recovery': { attempts: number };
}

/**
 * Transform stream wrapper that adds circuit breaker resilience
 * Handles stream failures gracefully with automatic recovery attempts
 */
export class CircuitBreakerStream extends Transform {
  private readonly circuitBreaker: CircuitBreakerService;
  private readonly config: CircuitBreakerStreamConfig;
  private readonly sessionId?: SessionId;
  private streamPosition: number = 0;
  private recoveryAttempts: number = 0;
  private lastErrorTime: number = 0;
  private isRecovering: boolean = false;

  constructor(config: CircuitBreakerStreamConfig) {
    super(config);
    
    this.config = config;
    this.sessionId = config.sessionId;
    
    // Initialize circuit breaker with provided configuration
    this.circuitBreaker = new CircuitBreakerService(config.serviceName, {
      failureThreshold: config.failureThreshold ?? 5,
      timeoutMs: config.timeoutMs ?? 30000,
      monitoringWindowMs: config.monitoringWindowMs ?? 60000,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? 3
    });
    
    this.setupCircuitBreakerEvents();
    
    Logger.info(`Circuit breaker stream initialized: ${config.serviceName}`, {
      sessionId: this.sessionId,
      config: this.circuitBreaker.getStatus().config
    });
  }

  /**
   * Transform chunk through circuit breaker
   */
  _transform(chunk: Buffer | string | Uint8Array, encoding: BufferEncoding, callback: TransformCallback): void {
    const correlationId = this.extractCorrelationId(chunk);
    const context: StreamErrorContext = {
      sessionId: this.sessionId,
      correlationId,
      chunkSize: chunk.length || 0,
      streamPosition: this.streamPosition,
      metadata: { encoding }
    };

    // Check if circuit allows operations
    if (!this.circuitBreaker.isCallAllowed()) {
      const status = this.circuitBreaker.getStatus();
      
      Logger.warn(`Circuit breaker blocking stream operation: ${this.config.serviceName}`, {
        state: status.state,
        failureCount: status.failureCount,
        sessionId: this.sessionId,
        correlationId
      });

      // Create error response for blocked operation
      const errorResponse = this.createCircuitBreakerErrorResponse(
        'CIRCUIT_BREAKER_BLOCKED',
        `Stream operation blocked by circuit breaker in ${status.state} state`,
        context
      );

      callback(null, errorResponse);
      return;
    }

    // Execute transform operation through circuit breaker
    const operation = () => this.executeTransform(chunk, encoding);
    
    this.circuitBreaker.execute(operation, correlationId, context)
      .then(result => {
        if (result.success) {
          this.streamPosition += chunk?.length || 0;
          callback(null, result.data);
        } else {
          // Circuit breaker handled the error
          const errorResponse = this.createCircuitBreakerErrorResponse(
            result.error?.code || 'CIRCUIT_BREAKER_ERROR',
            result.error?.message || 'Unknown circuit breaker error',
            context,
            result.error
          );
          
          callback(null, errorResponse);
        }
      })
      .catch(error => {
        // Fallback error handling
        Logger.error(`Circuit breaker stream unexpected error: ${this.config.serviceName}`, {
          error,
          sessionId: this.sessionId,
          correlationId
        });
        
        callback(error);
      });
  }

  /**
   * Execute the actual transform operation
   * This is where the wrapped stream logic would go
   */
  public async executeTransform(chunk: Buffer | string | Uint8Array, encoding: BufferEncoding): Promise<Buffer | string | Uint8Array> {
    // This would be overridden by subclasses or configured with actual transform logic
    // For now, we pass through the chunk as-is
    return new Promise((resolve, reject) => {
      try {
        // Simulate potential processing failure scenarios
        if (this.shouldSimulateFailure(chunk)) {
          throw new Error('Simulated stream processing failure');
        }
        
        // Pass through the chunk
        resolve(chunk);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create circuit breaker wrapper for existing transform stream
   */
  static wrap<T extends Transform>(
    streamFactory: () => T,
    config: CircuitBreakerStreamConfig
  ): CircuitBreakerStream {
    const wrapper = new CircuitBreakerStream(config);
    
    // Override the transform method to use the wrapped stream
    const createWrappedStream = streamFactory;
    let wrappedStream: T | null = null;
    
    wrapper.executeTransform = async (chunk: Buffer | string | Uint8Array, encoding: BufferEncoding): Promise<Buffer | string | Uint8Array> => {
      return new Promise((resolve, reject) => {
        if (!wrappedStream || wrappedStream.destroyed) {
          wrappedStream = createWrappedStream();
        }
        
        // Set up one-time listeners for this chunk
        const onData = (data: any) => {
          wrappedStream!.removeListener('error', onError);
          resolve(data);
        };
        
        const onError = (error: Error) => {
          wrappedStream!.removeListener('data', onData);
          reject(error);
        };
        
        wrappedStream.once('data', onData);
        wrappedStream.once('error', onError);
        
        // Write chunk to wrapped stream
        wrappedStream.write(chunk, encoding);
      });
    };
    
    return wrapper;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitStatus() {
    return this.circuitBreaker.getStatus();
  }

  /**
   * Manually reset circuit breaker
   */
  resetCircuit(): void {
    Logger.info(`Manually resetting circuit breaker: ${this.config.serviceName}`, {
      sessionId: this.sessionId
    });
    
    this.circuitBreaker.reset();
    this.recoveryAttempts = 0;
    this.isRecovering = false;
    this.emit('circuit:closed', { state: 'CLOSED' });
  }

  /**
   * Attempt to recover from circuit breaker failures
   */
  async attemptRecovery(): Promise<boolean> {
    if (this.isRecovering) {
      return false;
    }
    
    this.isRecovering = true;
    this.recoveryAttempts++;
    
    Logger.info(`Attempting circuit breaker recovery: ${this.config.serviceName}`, {
      attempt: this.recoveryAttempts,
      sessionId: this.sessionId
    });
    
    try {
      // Simple recovery test - try to process a minimal chunk
      const testChunk = Buffer.from('test-recovery');
      await this.executeTransform(testChunk, 'utf8');
      
      Logger.info(`Circuit breaker recovery successful: ${this.config.serviceName}`, {
        attempt: this.recoveryAttempts,
        sessionId: this.sessionId
      });
      
      this.emit('circuit:recovery', { attempts: this.recoveryAttempts });
      this.isRecovering = false;
      return true;
      
    } catch (error) {
      Logger.warn(`Circuit breaker recovery failed: ${this.config.serviceName}`, {
        attempt: this.recoveryAttempts,
        error,
        sessionId: this.sessionId
      });
      
      this.isRecovering = false;
      return false;
    }
  }

  /**
   * Setup circuit breaker state change event handling
   */
  private setupCircuitBreakerEvents(): void {
    // Monitor circuit breaker state changes
    const checkStateChange = () => {
      const status = this.circuitBreaker.getStatus();
      const currentTime = Date.now();
      
      // Emit events for state transitions
      if (status.state === 'OPEN' && currentTime - this.lastErrorTime < 1000) {
        this.emit('circuit:open', {
          state: status.state,
          failureCount: status.failureCount
        });
      } else if (status.state === 'HALF_OPEN') {
        this.emit('circuit:half-open', { state: status.state });
      } else if (status.state === 'CLOSED' && this.recoveryAttempts > 0) {
        this.emit('circuit:closed', { state: status.state });
        this.recoveryAttempts = 0;
      }
    };
    
    // Check state changes periodically
    const stateCheckInterval = setInterval(checkStateChange, 1000);
    
    this.on('close', () => {
      clearInterval(stateCheckInterval);
    });
  }

  /**
   * Extract correlation ID from chunk data if available
   */
  private extractCorrelationId(chunk: Buffer | string | Uint8Array): CorrelationId | undefined {
    try {
      // Only try to extract from object-like chunks, not binary data
      if (chunk && typeof chunk === 'object' && !(chunk instanceof Buffer) && !(chunk instanceof Uint8Array)) {
        const chunkObj = chunk as Record<string, unknown>;
        
        // Check if it's a MessageResponse with correlationId
        if ('correlationId' in chunkObj && chunkObj.correlationId) {
          return chunkObj.correlationId as CorrelationId;
        }
        
        // Check if it has metadata with correlationId
        if ('metadata' in chunkObj && 
            chunkObj.metadata && 
            typeof chunkObj.metadata === 'object' &&
            'correlationId' in chunkObj.metadata) {
          const metadata = chunkObj.metadata as Record<string, unknown>;
          return metadata.correlationId as CorrelationId;
        }
      }
      
      return undefined;
    } catch (error) {
      // Ignore correlation ID extraction errors
      return undefined;
    }
  }

  /**
   * Create standardized circuit breaker error response
   */
  private createCircuitBreakerErrorResponse(
    code: string,
    message: string,
    context: StreamErrorContext,
    originalError?: MessageError
  ): MessageResponse<any> {
    const error: MessageError = {
      code,
      message,
      context: {
        serviceName: this.config.serviceName,
        streamPosition: this.streamPosition,
        recoveryAttempts: this.recoveryAttempts,
        circuitState: this.circuitBreaker.getStatus().state,
        ...context,
        ...(originalError?.context || {})
      },
      stack: originalError?.stack
    };

    return {
      requestId: context.correlationId || CorrelationId.create(),
      success: false,
      error,
      metadata: {
        sessionId: context.sessionId,
        timestamp: Date.now(),
        source: 'extension' as const,
        version: '1.0'
      }
    };
  }

  /**
   * Determine if we should simulate a failure for testing
   * This would be removed in production or made configurable
   */
  private shouldSimulateFailure(chunk: Buffer | string | Uint8Array): boolean {
    // Only simulate failures if explicitly configured for testing
    const testFailureRate = process.env.PTAH_TEST_FAILURE_RATE;
    if (testFailureRate && Math.random() < parseFloat(testFailureRate)) {
      return true;
    }
    
    return false;
  }
}