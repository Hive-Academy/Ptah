import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling, withNavigationErrorHandler } from '@angular/router';

import { routes } from './app.routes';

// Custom error handler for webview-specific issues
class WebviewErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Check if it's a router/history API error in webview context
    if (error && error.name === 'SecurityError' && error.message && error.message.includes('pushState')) {
      console.warn('WebView Router: History API error suppressed (normal in VS Code webview)', error.message);
      return;
    }

    // Log other errors normally
    console.error('Angular Error:', error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // Custom error handler for webview compatibility
    { provide: ErrorHandler, useClass: WebviewErrorHandler },
    // Use hash location strategy for webview compatibility
    // This prevents VS Code from intercepting navigation
    provideRouter(routes,
      withHashLocation(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      // Handle navigation errors gracefully
      withNavigationErrorHandler((error) => {
        console.warn('Navigation error in webview (suppressed):', error);
        return true; // Continue navigation despite error
      })
    )
  ]
};
