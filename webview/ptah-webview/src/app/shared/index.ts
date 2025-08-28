// Import necessary modules
import { MATERIAL_IMPORTS } from './material.module';
import { EGYPTIAN_DIRECTIVES } from './directives/egyptian-accents.directive';

// Legacy Egyptian Components (being phased out)
import { EgyptianButtonComponent } from './components/egyptian-button.component';
import { EgyptianCardComponent } from './components/egyptian-card.component';
import { EgyptianInputComponent } from './components/egyptian-input.component';
import { LoadingSpinnerComponent } from './components/loading-spinner.component';

// New Egyptian Accent Directives (Material-based)
export { 
  EgyptianButtonDirective,
  EgyptianInputDirective,
  EgyptianCardDirective,
  EgyptianIconDirective,
  EgyptianSpinnerDirective,
  EGYPTIAN_DIRECTIVES
} from './directives/egyptian-accents.directive';

// Material Module
export { MaterialModule, MATERIAL_IMPORTS } from './material.module';

// Legacy Components (kept for backward compatibility during migration)
export { EgyptianButtonComponent } from './components/egyptian-button.component';
export { EgyptianCardComponent } from './components/egyptian-card.component';
export { EgyptianInputComponent } from './components/egyptian-input.component';
export { LoadingSpinnerComponent } from './components/loading-spinner.component';

// Legacy component array (being phased out)
export const SHARED_COMPONENTS = [
  EgyptianButtonComponent,
  EgyptianCardComponent,
  EgyptianInputComponent,
  LoadingSpinnerComponent
] as const;

// New Material-based component imports (preferred)
export const MATERIAL_EGYPTIAN_IMPORTS = [
  ...MATERIAL_IMPORTS,
  ...EGYPTIAN_DIRECTIVES
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
