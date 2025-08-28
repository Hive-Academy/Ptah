import { NgModule } from '@angular/core';

// Essential Material components only
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Minimal Material module for VS Code extension
 *
 * Only includes essential Material components for overlays and interactions.
 * Most UI uses custom VS Code-themed components.
 */
const MATERIAL_MODULES = [
  // Essential overlays only
  MatTooltipModule, // For icon button tooltips
  MatProgressSpinnerModule, // For loading states
];

@NgModule({
  imports: MATERIAL_MODULES,
  exports: MATERIAL_MODULES,
})
export class MaterialModule {}

/**
 * Standalone component imports for Angular Material
 * Use this for standalone components instead of the NgModule
 */
export const MATERIAL_IMPORTS = MATERIAL_MODULES;
