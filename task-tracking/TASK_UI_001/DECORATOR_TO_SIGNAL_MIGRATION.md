# 🎯 Decorator to Signal Migration Guide

## 📋 Overview

Based on your codebase analysis, you have **52+ decorator-based properties** that should be migrated to **signal-based APIs**. This guide shows exactly how to modernize each pattern.

## 🔍 **Current Decorators Found in Your Codebase**

### **Components with @Input/@Output:**

- `EgyptianButtonComponent` - 7 @Input, 1 @Output
- `EgyptianInputComponent` - 10 @Input, 3 @Output
- `EgyptianCardComponent` - 4 @Input
- `LoadingSpinnerComponent` - 4 @Input
- `StatusBarComponent` - 3 @Input
- `NavigationComponent` - 5 @Input, 1 @Output

### **Directives with @Input:**

- `EgyptianButtonDirective` - 2 @Input
- `EgyptianInputDirective` - 2 @Input
- `EgyptianCardDirective` - 2 @Input
- `EgyptianIconDirective` - 2 @Input
- `EgyptianSpinnerDirective` - 1 @Input

## ⚡ **ESLint Rules Added**

```javascript
// Enforce signal-based inputs/outputs over decorators
'@angular-eslint/prefer-signals': 'error',
'@angular-eslint/prefer-signal-inputs': 'error',
'@angular-eslint/prefer-signal-queries': 'error',

// Prevent legacy patterns
'@angular-eslint/no-inputs-metadata-property': 'error',
'@angular-eslint/no-outputs-metadata-property': 'error',
```

## 🔄 **Migration Examples from Your Code**

### **1. @Input → input() Migration**

#### ❌ **Before (Decorator-based)**

```typescript
// egyptian-button.component.ts
export class EgyptianButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() icon?: string;
  @Input() variant: 'primary' | 'secondary' | 'tertiary' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() ariaLabel?: string;
}
```

#### ✅ **After (Signal-based)**

```typescript
// egyptian-button.component.ts
import { input } from '@angular/core';

export class EgyptianButtonComponent {
  // Required imports
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly icon = input<string>();
  readonly variant = input<'primary' | 'secondary' | 'tertiary'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly ariaLabel = input<string>();

  // Use in template: {{disabled()}} instead of {{disabled}}
  // Use in code: if (this.disabled()) { ... }
}
```

### **2. @Output → output() Migration**

#### ❌ **Before (Decorator-based)**

```typescript
// egyptian-input.component.ts
export class EgyptianInputComponent {
  @Output() inputChange = new EventEmitter<string>();
  @Output() focused = new EventEmitter<void>();
  @Output() blurred = new EventEmitter<void>();

  onInput(value: string): void {
    this.inputChange.emit(value);
  }
}
```

#### ✅ **After (Signal-based)**

```typescript
// egyptian-input.component.ts
import { output } from '@angular/core';

export class EgyptianInputComponent {
  readonly inputChange = output<string>();
  readonly focused = output<void>();
  readonly blurred = output<void>();

  onInput(value: string): void {
    this.inputChange.emit(value); // Same API!
  }
}
```

### **3. @ViewChild → viewChild() Migration**

#### ❌ **Before (Decorator-based)**

```typescript
export class ChatComponent {
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild(MatDialog) dialog?: MatDialog;

  ngAfterViewInit(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }
}
```

#### ✅ **After (Signal-based)**

```typescript
import { viewChild, effect } from '@angular/core';

export class ChatComponent {
  readonly messageInput = viewChild.required<ElementRef<HTMLTextAreaElement>>('messageInput');
  readonly dialog = viewChild<MatDialog>(MatDialog);

  constructor() {
    // Use effect instead of ngAfterViewInit
    effect(() => {
      const input = this.messageInput();
      if (input) {
        input.nativeElement.focus();
      }
    });
  }
}
```

### **4. Directive @Input → input() Migration**

#### ❌ **Before (Your EgyptianButtonDirective)**

```typescript
// egyptian-accents.directive.ts
@Directive({ selector: '[egyptianButton]' })
export class EgyptianButtonDirective {
  @Input() egyptianButton: EgyptianVariant = 'default';
  @Input() egyptianSize: 'sm' | 'md' | 'lg' = 'md';
}
```

#### ✅ **After (Signal-based)**

```typescript
// egyptian-accents.directive.ts
import { input } from '@angular/core';

@Directive({ selector: '[egyptianButton]' })
export class EgyptianButtonDirective {
  readonly egyptianButton = input<EgyptianVariant>('default');
  readonly egyptianSize = input<'sm' | 'md' | 'lg'>('md');

  // In host bindings, use signal values:
  @HostBinding('class') get classes() {
    return `egyptian-btn-${this.egyptianButton()} egyptian-size-${this.egyptianSize()}`;
  }
}
```

## 🎯 **Required vs Optional Inputs**

### **Required Inputs**

```typescript
// Old way
@Input() userId!: string; // Non-null assertion needed

// New way
readonly userId = input.required<string>(); // No assertion needed!
```

### **Optional Inputs**

```typescript
// Old way
@Input() title?: string;

// New way
readonly title = input<string>(); // Returns signal<string | undefined>
```

### **Inputs with Defaults**

```typescript
// Old way
@Input() size: 'sm' | 'md' | 'lg' = 'md';

// New way
readonly size = input<'sm' | 'md' | 'lg'>('md');
```

## 🔄 **Template Usage Changes**

### **In Templates**

```html
<!-- Before: Property access -->
<button [disabled]="disabled" [class]="'btn-' + variant">{{title}}</button>

<!-- After: Function call access -->
<button [disabled]="disabled()" [class]="'btn-' + variant()">{{title()}}</button>
```

### **In Component Logic**

```typescript
// Before: Direct property access
if (this.disabled) {
  return;
}
this.variant = 'secondary';

// After: Signal function calls (readonly!)
if (this.disabled()) {
  return;
}
// Can't reassign signals - they're readonly!
// this.variant = 'secondary'; // ❌ Compile error
```

## 🚀 **Automatic Migration Commands**

```bash
# Angular 19+ has integrated migration schematic
cd webview/ptah-webview
npx ng generate @angular/core:signals

# OR run individual migrations:
npx ng generate @angular/core:signal-inputs
npx ng generate @angular/core:signal-queries
npx ng generate @angular/core:signal-outputs
```

## ✅ **Benefits of Signal Migration**

### **Performance**

- **Granular Reactivity**: Only components using changed signals re-render
- **No ngOnChanges**: Automatic reactivity without lifecycle hooks
- **Better Change Detection**: Works perfectly with OnPush

### **Developer Experience**

- **Type Safety**: Better TypeScript integration
- **Required Inputs**: No more non-null assertions
- **Consistency**: Same pattern for all reactive data

### **Bundle Size**

- **Tree Shaking**: Better optimization
- **Less Code**: No EventEmitter imports needed

## 📝 **Migration Checklist for Your Codebase**

### **Priority 1: Core Components**

- [ ] `NavigationComponent` (5 @Input, 1 @Output)
- [ ] `EgyptianInputComponent` (10 @Input, 3 @Output)
- [ ] `EgyptianButtonComponent` (7 @Input, 1 @Output)

### **Priority 2: Directives**

- [ ] `EgyptianButtonDirective` (2 @Input)
- [ ] `EgyptianInputDirective` (2 @Input)
- [ ] `EgyptianCardDirective` (2 @Input)
- [ ] `EgyptianIconDirective` (2 @Input)
- [ ] `EgyptianSpinnerDirective` (1 @Input)

### **Priority 3: Supporting Components**

- [ ] `StatusBarComponent` (3 @Input)
- [ ] `EgyptianCardComponent` (4 @Input)
- [ ] `LoadingSpinnerComponent` (4 @Input)

## ⚠️ **Migration Tips**

1. **Start with Leaf Components**: Components with no child components first
2. **Update Templates**: Remember to add `()` for signal access
3. **Remove Lifecycle Hooks**: Replace ngOnChanges with computed() or effect()
4. **Make Properties Readonly**: All signal properties should be readonly
5. **Test Incrementally**: Migrate one component at a time

## 🎯 **ESLint Will Help You**

After running `npm run lint`, you'll see errors like:

```
❌ Use input() function instead of @Input decorator
❌ Use output() function instead of @Output decorator
❌ Use viewChild() function instead of @ViewChild decorator
❌ Mark signal properties as readonly
```

Your migration to modern Angular signals starts now! 🚀
