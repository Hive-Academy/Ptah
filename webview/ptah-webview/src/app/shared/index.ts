import { EgyptianButtonComponent } from './components/egyptian-button.component';
import { EgyptianCardComponent } from './components/egyptian-card.component';
import { EgyptianInputComponent } from './components/egyptian-input.component';
import { LoadingSpinnerComponent } from './components/loading-spinner.component';

// Shared Components
export { EgyptianButtonComponent } from './components/egyptian-button.component';
export { EgyptianCardComponent } from './components/egyptian-card.component';
export { EgyptianInputComponent } from './components/egyptian-input.component';
export { LoadingSpinnerComponent } from './components/loading-spinner.component';

// Shared component array for easy imports
export const SHARED_COMPONENTS = [
  EgyptianButtonComponent,
  EgyptianCardComponent,
  EgyptianInputComponent,
  LoadingSpinnerComponent
] as const;

// Export shared types
export interface EgyptianTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface SharedComponentConfig {
  theme: EgyptianTheme;
  size: 'sm' | 'md' | 'lg';
  variant: 'primary' | 'secondary' | 'tertiary';
}
