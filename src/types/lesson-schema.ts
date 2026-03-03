export type LessonVariableType = 'boolean' | 'number' | 'string';

export interface LessonVariable {
  id: string;
  type: LessonVariableType;
  initial: boolean | number | string;
}

interface BaseNode {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface TextNode extends BaseNode {
  type: 'text';
  props: {
    content: string;
    color?: string;
    size?: number;
    weight?: number;
    align?: 'left' | 'center' | 'right';
  };
}

export interface PanelNode extends BaseNode {
  type: 'panel';
  props: {
    label?: string;
    background?: string;
    borderColor?: string;
  };
}

export interface ToggleNode extends BaseNode {
  type: 'toggle';
  props: {
    variableId: string;
    label: string;
    onColor?: string;
    offColor?: string;
  };
}

export interface ComputedNumberNode extends BaseNode {
  type: 'computed-number';
  props: {
    label: string;
    formula: 'binary_sum';
    sources: Array<{
      variableId: string;
      weight: number;
    }>;
  };
}

export type RuntimeNode = TextNode | PanelNode | ToggleNode | ComputedNumberNode;

export interface TimelineStep {
  id: string;
  title: string;
  description: string;
  atMs: number;
  focusNodeId?: string;
}

export interface LessonSchemaV1 {
  schemaVersion: '1.0';
  lessonId: string;
  title: string;
  subtitle?: string;
  canvas: {
    width: number;
    height: number;
  };
  variables: LessonVariable[];
  nodes: RuntimeNode[];
  timeline?: TimelineStep[];
}
