import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { VSCodeService } from '../../core/services/vscode.service';
import { AppStateManager } from '../../core/services/app-state.service';
import {
  EgyptianCardComponent,
  EgyptianButtonComponent,
  LoadingSpinnerComponent,
} from '../../shared';

// Context Tree specific types
export interface FileTreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  tokenEstimate?: number;
  isIncluded: boolean;
  isExcluded: boolean;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  depth: number;
  parent?: FileTreeNode;
}

export interface ContextTreeState {
  files: FileTreeNode[];
  totalTokens: number;
  maxTokens: number;
  isLoading: boolean;
  error?: string;
  selectedFiles: Set<string>;
  expandedFolders: Set<string>;
}

export interface TokenWarning {
  level: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

@Component({
  selector: 'app-context-tree',
  standalone: true,
  imports: [CommonModule, EgyptianCardComponent, EgyptianButtonComponent, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './context-tree.component.html',
  styles: [
    `
      .context-tree-container {
        @apply min-h-full;
      }

      .token-usage-bar .bg-green-500 {
        background-color: #10b981;
      }

      .token-usage-bar .bg-yellow-500 {
        background-color: #f59e0b;
      }

      .token-usage-bar .bg-red-500 {
        background-color: #ef4444;
      }

      .file-node:hover .context-menu-trigger {
        @apply opacity-100;
      }

      .file-node.selected {
        @apply bg-papyrus-200;
      }

      .inclusion-toggle.included {
        @apply border-ankh-500 bg-ankh-500 text-white;
      }

      .inclusion-toggle.excluded {
        @apply border-red-500 bg-red-50 text-red-500;
      }

      .inclusion-toggle.default {
        @apply border-papyrus-300 bg-white text-hieroglyph-400 hover:border-papyrus-400;
      }

      .context-menu {
        @apply transition-all duration-200;
        animation: fadeInZoom 0.2s ease-out;
      }

      @keyframes fadeInZoom {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* VS Code theme adaptations */
      :host-context(.vscode-dark) .context-menu {
        @apply bg-hieroglyph-800 border-hieroglyph-600 text-papyrus-100;
      }

      :host-context(.vscode-dark) .file-node.selected {
        @apply bg-hieroglyph-700;
      }

      :host-context(.vscode-dark) .node-content:hover {
        @apply bg-hieroglyph-700;
      }

      :host-context(.vscode-dark) .menu-item:hover {
        @apply bg-hieroglyph-700;
      }

      :host-context(.vscode-high-contrast) .context-menu {
        @apply bg-black border-white text-white;
      }

      :host-context(.vscode-high-contrast) .inclusion-toggle {
        @apply border-white;
      }
    `,
  ],
})
export class ContextTreeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Services
  private vscodeService = inject(VSCodeService);
  private appState = inject(AppStateManager);

  // Component state signals
  private _contextState = signal<ContextTreeState>({
    files: [],
    totalTokens: 0,
    maxTokens: 200000,
    isLoading: false,
    selectedFiles: new Set(),
    expandedFolders: new Set(),
  });

  private _contextMenuFile = signal<FileTreeNode | null>(null);
  private _showContextMenu = signal(false);
  private _contextMenuPosition = signal({ x: 0, y: 0 });

  // Public readonly signals
  readonly files = computed(() => this._contextState().files);
  readonly isLoading = computed(() => this._contextState().isLoading);
  readonly error = computed(() => this._contextState().error);
  readonly currentTokens = computed(() => this._contextState().totalTokens);
  readonly maxTokens = computed(() => this._contextState().maxTokens);
  readonly selectedFiles = computed(() => this._contextState().selectedFiles);
  readonly expandedFolders = computed(() => this._contextState().expandedFolders);
  readonly contextMenuFile = computed(() => this._contextMenuFile());
  readonly showContextMenuFlag = computed(() => this._showContextMenu());
  readonly contextMenuPosition = computed(() => this._contextMenuPosition());

  // Computed values for UI
  readonly includedFilesCount = computed(
    () => this.files().filter((f) => f.type === 'file' && f.isIncluded).length,
  );

  readonly tokenUsagePercentage = computed(() =>
    Math.min(100, (this.currentTokens() / this.maxTokens()) * 100),
  );

  readonly tokenUsageBarClass = computed(() => {
    const percentage = this.tokenUsagePercentage();
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  });

  readonly tokenWarning = computed((): TokenWarning | null => {
    const percentage = this.tokenUsagePercentage();
    const current = this.currentTokens();
    const max = this.maxTokens();

    if (percentage >= 95) {
      return {
        level: 'error',
        message: `Critical: ${current} tokens (${percentage.toFixed(1)}% of limit)`,
        suggestion: 'Exclude some files to avoid hitting the token limit',
      };
    }

    if (percentage >= 80) {
      return {
        level: 'warning',
        message: `High usage: ${current} tokens (${percentage.toFixed(1)}% of limit)`,
        suggestion: 'Consider excluding test files or build artifacts',
      };
    }

    if (percentage >= 60) {
      return {
        level: 'info',
        message: `Moderate usage: ${current} tokens (${percentage.toFixed(1)}% of limit)`,
        suggestion: 'Token usage is within normal range',
      };
    }

    return null;
  });

  readonly tokenWarningClass = computed(() => {
    const warning = this.tokenWarning();
    if (!warning) return '';

    switch (warning.level) {
      case 'error':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return '';
    }
  });

  readonly filteredFiles = computed(() => {
    // Return flattened tree based on expanded state
    return this.flattenTree(this.files());
  });

  constructor() {
    // Setup click outside listener for context menu
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('contextmenu', this.handleDocumentRightClick.bind(this));
  }

  ngOnInit(): void {
    console.log('ContextTreeComponent: Initializing...');
    this.setupMessageListeners();
    this.loadInitialContext();
  }

  ngOnDestroy(): void {
    console.log('ContextTreeComponent: Destroying...');
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
    document.removeEventListener('contextmenu', this.handleDocumentRightClick.bind(this));
  }

  private setupMessageListeners(): void {
    // Listen for context updates from extension
    this.vscodeService
      .onMessageType('context:filesLoaded')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('Context files loaded:', data);
        this.handleContextFilesLoaded(data);
      });

    this.vscodeService
      .onMessageType('context:fileIncluded')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('File included:', data);
        this.handleFileIncluded(data.filePath);
      });

    this.vscodeService
      .onMessageType('context:fileExcluded')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.log('File excluded:', data);
        this.handleFileExcluded(data.filePath);
      });

    this.vscodeService
      .onMessageType('context:error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        console.error('Context error:', data);
        this.handleContextError(data.message);
      });
  }

  private loadInitialContext(): void {
    console.log('ContextTreeComponent: Loading initial context...');
    this.setLoading(true);
    this.vscodeService.getContextFiles();
  }

  refreshContext(): void {
    console.log('ContextTreeComponent: Refreshing context...');
    this.setLoading(true);
    this.vscodeService.getContextFiles();
  }

  clearAll(): void {
    console.log('ContextTreeComponent: Clearing all included files...');
    const includedFiles = this.files().filter((f) => f.type === 'file' && f.isIncluded);

    for (const file of includedFiles) {
      this.vscodeService.excludeFile(file.path);
    }
  }

  toggleFileInclusion(filePath: string): void {
    const file = this.findFileByPath(filePath);
    if (!file || file.type !== 'file') return;

    if (file.isIncluded) {
      this.vscodeService.excludeFile(filePath);
    } else {
      this.vscodeService.includeFile(filePath);
    }
  }

  toggleDirectory(dirPath: string): void {
    const expanded = this.expandedFolders();
    const newExpanded = new Set(expanded);

    if (expanded.has(dirPath)) {
      newExpanded.delete(dirPath);
    } else {
      newExpanded.add(dirPath);
    }

    this.updateExpandedFolders(newExpanded);
  }

  showContextMenu(event: MouseEvent, file: FileTreeNode): void {
    event.preventDefault();
    event.stopPropagation();

    this._contextMenuFile.set(file);
    this._contextMenuPosition.set({ x: event.clientX, y: event.clientY });
    this._showContextMenu.set(true);
  }

  hideContextMenu(): void {
    this._showContextMenu.set(false);
    this._contextMenuFile.set(null);
  }

  includeFileFromMenu(): void {
    const file = this.contextMenuFile();
    if (file && file.type === 'file') {
      this.vscodeService.includeFile(file.path);
    }
    this.hideContextMenu();
  }

  excludeFileFromMenu(): void {
    const file = this.contextMenuFile();
    if (file && file.type === 'file') {
      this.vscodeService.excludeFile(file.path);
    }
    this.hideContextMenu();
  }

  includeDirectoryFromMenu(): void {
    const file = this.contextMenuFile();
    if (file && file.type === 'directory') {
      // Find all files in this directory and include them
      const allFiles = this.flattenTree(this.files());
      const directoryFiles = allFiles.filter(
        (f) => f.type === 'file' && f.path.startsWith(file.path + '/'),
      );

      for (const dirFile of directoryFiles) {
        if (!dirFile.isIncluded) {
          this.vscodeService.includeFile(dirFile.path);
        }
      }
    }
    this.hideContextMenu();
  }

  excludeDirectoryFromMenu(): void {
    const file = this.contextMenuFile();
    if (file && file.type === 'directory') {
      // Find all files in this directory and exclude them
      const allFiles = this.flattenTree(this.files());
      const directoryFiles = allFiles.filter(
        (f) => f.type === 'file' && f.path.startsWith(file.path + '/'),
      );

      for (const dirFile of directoryFiles) {
        if (dirFile.isIncluded) {
          this.vscodeService.excludeFile(dirFile.path);
        }
      }
    }
    this.hideContextMenu();
  }

  getInclusionToggleClass(file: FileTreeNode): string {
    if (file.isIncluded) return 'inclusion-toggle included';
    if (file.isExcluded) return 'inclusion-toggle excluded';
    return 'inclusion-toggle default';
  }

  getInclusionToggleLabel(file: FileTreeNode): string {
    if (file.isIncluded) return `Exclude ${file.name} from context`;
    return `Include ${file.name} in context`;
  }

  private handleDocumentClick(event: Event): void {
    if (this.showContextMenuFlag()) {
      this.hideContextMenu();
    }
  }

  private handleDocumentRightClick(event: Event): void {
    if (this.showContextMenuFlag()) {
      this.hideContextMenu();
    }
  }

  private handleContextFilesLoaded(data: any): void {
    console.log('Processing loaded context files:', data);

    if (data.files && Array.isArray(data.files)) {
      const treeFiles = this.buildFileTree(data.files, data.context || {});
      this.updateContextState({
        files: treeFiles,
        totalTokens: data.context?.tokenEstimate || 0,
        isLoading: false,
        error: undefined,
      });
    } else {
      this.handleContextError('Invalid file data received from extension');
    }
  }

  private handleFileIncluded(filePath: string): void {
    this.updateFileInclusion(filePath, true, false);
  }

  private handleFileExcluded(filePath: string): void {
    this.updateFileInclusion(filePath, false, true);
  }

  private handleContextError(message: string): void {
    this.updateContextState({
      isLoading: false,
      error: message,
    });
  }

  private setLoading(loading: boolean): void {
    this.updateContextState({ isLoading: loading });
  }

  private updateContextState(updates: Partial<ContextTreeState>): void {
    this._contextState.update((state) => ({ ...state, ...updates }));
  }

  private updateExpandedFolders(expanded: Set<string>): void {
    this.updateContextState({ expandedFolders: expanded });
  }

  private updateFileInclusion(filePath: string, isIncluded: boolean, isExcluded: boolean): void {
    const files = this.files().map((file) =>
      this.updateFileInclusionRecursive(file, filePath, isIncluded, isExcluded),
    );

    // Recalculate total tokens
    const totalTokens = this.calculateTotalTokens(files);

    this.updateContextState({ files, totalTokens });
  }

  private updateFileInclusionRecursive(
    file: FileTreeNode,
    targetPath: string,
    isIncluded: boolean,
    isExcluded: boolean,
  ): FileTreeNode {
    if (file.path === targetPath) {
      return { ...file, isIncluded, isExcluded };
    }

    if (file.children) {
      return {
        ...file,
        children: file.children.map((child) =>
          this.updateFileInclusionRecursive(child, targetPath, isIncluded, isExcluded),
        ),
      };
    }

    return file;
  }

  private findFileByPath(filePath: string): FileTreeNode | null {
    return this.findFileInTree(this.files(), filePath);
  }

  private findFileInTree(files: FileTreeNode[], filePath: string): FileTreeNode | null {
    for (const file of files) {
      if (file.path === filePath) {
        return file;
      }
      if (file.children) {
        const found = this.findFileInTree(file.children, filePath);
        if (found) return found;
      }
    }
    return null;
  }

  private buildFileTree(files: any[], context: any): FileTreeNode[] {
    // This is a simplified tree builder - in real implementation, you'd want
    // to properly parse workspace files and build hierarchical structure
    const fileMap = new Map<string, FileTreeNode>();
    const rootFiles: FileTreeNode[] = [];

    // Sort files by path to ensure proper tree structure
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const fileData of sortedFiles) {
      const pathParts = fileData.path.split('/').filter(Boolean);
      let currentPath = '';

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!fileMap.has(currentPath)) {
          const isFile = i === pathParts.length - 1 && fileData.type === 'file';

          const node: FileTreeNode = {
            path: currentPath,
            name: part,
            type: isFile ? 'file' : 'directory',
            size: isFile ? fileData.size : undefined,
            tokenEstimate: isFile ? fileData.tokenEstimate : undefined,
            isIncluded: isFile ? (context.includedFiles || []).includes(currentPath) : false,
            isExcluded: isFile ? (context.excludedFiles || []).includes(currentPath) : false,
            children: isFile ? undefined : [],
            isExpanded: false,
            depth: i,
          };

          fileMap.set(currentPath, node);

          if (parentPath && fileMap.has(parentPath)) {
            const parent = fileMap.get(parentPath)!;
            parent.children!.push(node);
            node.parent = parent;
          } else if (i === 0) {
            rootFiles.push(node);
          }
        }
      }
    }

    return rootFiles;
  }

  private flattenTree(files: FileTreeNode[]): FileTreeNode[] {
    const result: FileTreeNode[] = [];

    const addToResult = (file: FileTreeNode) => {
      result.push(file);

      if (file.type === 'directory' && file.children && this.expandedFolders().has(file.path)) {
        for (const child of file.children) {
          addToResult(child);
        }
      }
    };

    for (const file of files) {
      addToResult(file);
    }

    return result;
  }

  private calculateTotalTokens(files: FileTreeNode[]): number {
    let total = 0;

    const countTokens = (file: FileTreeNode) => {
      if (file.type === 'file' && file.isIncluded && file.tokenEstimate) {
        total += file.tokenEstimate;
      }

      if (file.children) {
        for (const child of file.children) {
          countTokens(child);
        }
      }
    };

    for (const file of files) {
      countTokens(file);
    }

    return total;
  }
}
