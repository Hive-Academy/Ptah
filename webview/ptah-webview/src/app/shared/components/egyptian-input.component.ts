import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-egyptian-input',
  standalone: true,
  template: `
    <div class="egyptian-input-wrapper">
      @if (label) {
        <label [for]="inputId" class="input-label gold-shimmer text-sm font-medium mb-2 block">
          {{ label }}
          @if (required) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }

      <div class="relative">
        @if (icon) {
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i [class]="'icon-' + icon" class="text-hieroglyph-500"></i>
          </div>
        }

        <input
          [id]="inputId"
          [type]="type"
          [class]="'hieroglyph-input w-full ' + (icon ? 'pl-10' : '') + ' ' + additionalClasses"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [required]="required"
          [value]="value"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          [attr.aria-describedby]="errorId"
          [attr.aria-invalid]="hasError"
        />

        @if (clearable && value) {
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
            (click)="clear()"
            aria-label="Clear input">
            <i class="icon-x text-hieroglyph-400 hover:text-hieroglyph-600"></i>
          </button>
        }
      </div>

      @if (hasError && errorMessage) {
        <p [id]="errorId" class="text-red-500 text-xs mt-1">{{ errorMessage }}</p>
      }

      @if (helpText && !hasError) {
        <p class="text-hieroglyph-500 text-xs mt-1">{{ helpText }}</p>
      }
    </div>
  `,
  styles: [`
    .hieroglyph-input {
      @apply bg-papyrus-50 border border-papyrus-300
             rounded-egyptian px-4 py-2
             focus:ring-2 focus:ring-lapis-400 focus:border-lapis-500
             transition-all duration-200
             placeholder-hieroglyph-400;
    }

    .hieroglyph-input:disabled {
      @apply bg-hieroglyph-100 cursor-not-allowed opacity-60;
    }

    .hieroglyph-input.error {
      @apply border-red-500 focus:ring-red-400 focus:border-red-500;
    }

    /* VS Code theme adaptations */
    :host-context(.vscode-dark) .hieroglyph-input {
      @apply bg-hieroglyph-800 border-hieroglyph-600
             text-papyrus-100 placeholder-hieroglyph-400;
    }

    :host-context(.vscode-light) .hieroglyph-input {
      @apply bg-white border-papyrus-200
             text-hieroglyph-800 placeholder-hieroglyph-500;
    }

    :host-context(.vscode-high-contrast) .hieroglyph-input {
      @apply bg-black border-white text-white;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EgyptianInputComponent),
      multi: true
    }
  ]
})
export class EgyptianInputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() type: string = 'text';
  @Input() icon?: string;
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() clearable: boolean = false;
  @Input() errorMessage?: string;
  @Input() helpText?: string;
  @Input() inputId: string = 'input-' + Math.random().toString(36).substring(2);

  @Output() inputChange = new EventEmitter<string>();
  @Output() focused = new EventEmitter<void>();
  @Output() blurred = new EventEmitter<void>();

  value: string = '';
  private onChange = (value: string) => {};
  private onTouched = () => {};

  get errorId(): string {
    return this.inputId + '-error';
  }

  get hasError(): boolean {
    return !!this.errorMessage;
  }

  get additionalClasses(): string {
    const classes = [];

    if (this.hasError) {
      classes.push('error');
    }

    return classes.join(' ');
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }

  onFocus(): void {
    this.focused.emit();
  }

  onBlur(): void {
    this.onTouched();
    this.blurred.emit();
  }

  clear(): void {
    this.value = '';
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }
}
