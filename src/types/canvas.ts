// Canvas-specific types for template editor

export interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplateElement {
  id: string;
  fieldName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  styles: {
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right';
    fontFamily: string;
    color?: string;
  };
}

export interface CanvasElement extends TemplateElement {
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  zIndex: number;
}

export interface CanvasState {
  elements: CanvasElement[];
  selectedElementIds: string[];
  dragState: DragState | null;
  resizeState: ResizeState | null;
  scale: number;
  offset: { x: number; y: number };
  gridVisible: boolean;
  snapToGrid: boolean;
}

export interface DragState {
  elementId: string;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  offset: { x: number; y: number };
}

export interface ResizeState {
  elementId: string;
  handle: ResizeHandle;
  startBounds: ElementBounds;
  currentBounds: ElementBounds;
}

export type ResizeHandle =
  | 'nw' | 'n' | 'ne'
  | 'w' | 'e'
  | 'sw' | 's' | 'se';

export interface CanvasViewport {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  scale: number;
}

export interface CanvasInteraction {
  type: 'select' | 'drag' | 'resize' | 'pan' | 'zoom';
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  isActive: boolean;
}

export interface GridSettings {
  size: number;
  visible: boolean;
  snapEnabled: boolean;
  color: string;
  opacity: number;
}

export interface CanvasHistory {
  states: CanvasState[];
  currentIndex: number;
  maxStates: number;
}

export interface CanvasAction {
  type: 'ADD_ELEMENT' | 'REMOVE_ELEMENT' | 'UPDATE_ELEMENT' | 'MOVE_ELEMENT' | 'RESIZE_ELEMENT';
  payload: any;
  timestamp: Date;
}

export interface CanvasMouseEvent {
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'click' | 'dblclick';
  position: { x: number; y: number };
  canvasPosition: { x: number; y: number };
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface CanvasKeyboardEvent {
  type: 'keydown' | 'keyup';
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export type CanvasTool = 'select' | 'text' | 'rectangle' | 'pan' | 'zoom';

export interface CanvasToolState {
  activeTool: CanvasTool;
  toolOptions: Record<string, any>;
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  viewport: CanvasViewport;
  theme: CanvasTheme;
}

export interface CanvasTheme {
  background: string;
  grid: string;
  selection: string;
  handles: string;
  text: string;
  border: string;
}

export interface CanvasExportOptions {
  format: 'png' | 'jpeg' | 'svg';
  quality?: number;
  scale?: number;
  includeBackground?: boolean;
}

export interface CanvasExportResult {
  success: boolean;
  data?: Blob | string;
  error?: string;
}