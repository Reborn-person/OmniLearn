import type { LessonSchemaV1, RuntimeNode, LessonVariable } from '../types/lesson-schema';

type ComponentType =
  | 'text'
  | 'image'
  | 'video'
  | 'code'
  | 'hotspot'
  | 'switch'
  | 'flow'
  | 'quiz'
  | 'accordion'
  | 'divider';

interface BuilderComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  stepId: string;
  props: Record<string, any>;
}

interface BuilderStep {
  id: string;
  name: string;
  duration: number;
}

interface ConvertInput {
  courseTitle: string;
  components: BuilderComponent[];
  steps: BuilderStep[];
}

interface RestoreResult {
  courseTitle: string;
  components: BuilderComponent[];
  steps: BuilderStep[];
}

export interface RuntimeSchemaDiffSummary {
  fromVersion?: number;
  toVersion?: number;
  nodeAdded: number;
  nodeRemoved: number;
  nodeChanged: number;
  variableAdded: number;
  variableRemoved: number;
  variableChanged: number;
  timelineChanged: boolean;
}

function sanitize(n: number, fallback = 0) {
  return Number.isFinite(n) ? n : fallback;
}

function truncate(text: string, maxLen = 42) {
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
}

function createPanelFallbackNode(component: BuilderComponent): RuntimeNode {
  let label = `[${component.type}]`;

  if (component.type === 'image') label = `[image] ${component.props.alt || 'image'}`;
  if (component.type === 'video') label = `[video] ${truncate(component.props.url || '')}`;
  if (component.type === 'code') label = `[code] ${component.props.language || 'plain'}`;
  if (component.type === 'quiz') label = `[quiz] ${truncate(component.props.question || '')}`;
  if (component.type === 'accordion') label = `[accordion] ${truncate(component.props.title || '')}`;
  if (component.type === 'hotspot') label = `[hotspot] ${truncate(component.props.label || '')}`;
  if (component.type === 'flow') label = `[flow] ${truncate(component.props.label || 'data flow')}`;
  if (component.type === 'divider') label = '[divider]';

  return {
    id: component.id,
    type: 'panel',
    x: sanitize(component.x),
    y: sanitize(component.y),
    width: sanitize(component.width, 160),
    height: sanitize(component.height, 80),
    props: {
      label,
      background: 'rgba(15, 23, 42, 0.65)',
      borderColor: 'rgba(148, 163, 184, 0.35)',
    },
  };
}

export function convertBuilderToRuntimeSchema(input: ConvertInput): LessonSchemaV1 {
  const { courseTitle, components, steps } = input;

  const variables: LessonVariable[] = [];
  const nodes: RuntimeNode[] = [
    {
      id: 'runtime-title',
      type: 'text',
      x: 24,
      y: 18,
      props: {
        content: `${courseTitle}（Runtime）`,
        size: 24,
        weight: 700,
        color: '#e2e8f0',
      },
    },
  ];

  const switchVariables: string[] = [];

  for (const component of components) {
    if (component.type === 'text') {
      nodes.push({
        id: component.id,
        type: 'text',
        x: sanitize(component.x),
        y: sanitize(component.y),
        width: sanitize(component.width, 180),
        height: sanitize(component.height, 80),
        props: {
          content: component.props.text || 'text',
          color: component.props.color || '#cbd5e1',
          size: sanitize(component.props.fontSize, 16),
          weight: component.props.bold ? 700 : 400,
          align: component.props.align || 'left',
        },
      });
      continue;
    }

    if (component.type === 'switch') {
      const variableId = `switch_${component.id}`;
      variables.push({
        id: variableId,
        type: 'boolean',
        initial: Boolean(component.props.state),
      });
      switchVariables.push(variableId);
      nodes.push({
        id: component.id,
        type: 'toggle',
        x: sanitize(component.x),
        y: sanitize(component.y),
        width: sanitize(component.width, 110),
        height: sanitize(component.height, 100),
        props: {
          variableId,
          label: component.props.label || 'switch',
        },
      });
      continue;
    }

    nodes.push(createPanelFallbackNode(component));
  }

  if (switchVariables.length > 0) {
    nodes.push({
      id: 'switch-count-panel',
      type: 'computed-number',
      x: 24,
      y: 56,
      width: 260,
      height: 108,
      props: {
        label: 'ACTIVE SWITCHES',
        formula: 'binary_sum',
        sources: switchVariables.map((variableId) => ({ variableId, weight: 1 })),
      },
    });
  }

  const maxX = nodes.reduce((m, n) => Math.max(m, (n.x || 0) + (n.width || 220)), 0);
  const maxY = nodes.reduce((m, n) => Math.max(m, (n.y || 0) + (n.height || 100)), 0);

  return {
    schemaVersion: '1.0',
    lessonId: `runtime-${Date.now()}`,
    title: courseTitle,
    subtitle: 'Exported from Builder',
    canvas: {
      width: Math.max(960, maxX + 60),
      height: Math.max(560, maxY + 60),
    },
    variables,
    nodes,
    timeline: steps.map((step, idx) => ({
      id: step.id,
      title: step.name,
      description: `${step.name} 阶段`,
      atMs: Math.max(0, Number(step.duration || idx * 2) * 1000),
      focusNodeId: components.find((c) => c.stepId === step.id)?.id,
    })),
  };
}

function makeStepId(index: number) {
  return `step-${index + 1}`;
}

export function convertRuntimeSchemaToBuilderDraft(schema: LessonSchemaV1): RestoreResult {
  const variables = new Map<string, boolean | number | string>();
  for (const variable of schema.variables || []) {
    variables.set(variable.id, variable.initial);
  }

  const steps: BuilderStep[] = (schema.timeline && schema.timeline.length > 0)
    ? schema.timeline.map((item, index) => ({
        id: makeStepId(index),
        name: item.title || `步骤 ${index + 1}`,
        duration: Math.round(Math.max(0, Number(item.atMs || 0)) / 1000),
      }))
    : [
        { id: 'step-1', name: '引入', duration: 0 },
        { id: 'step-2', name: '讲解', duration: 2 },
        { id: 'step-3', name: '练习', duration: 4 },
      ];

  const focusToStep = new Map<string, string>();
  if (schema.timeline) {
    schema.timeline.forEach((item, index) => {
      if (item.focusNodeId) {
        focusToStep.set(item.focusNodeId, makeStepId(index));
      }
    });
  }

  const components: BuilderComponent[] = [];

  for (const node of schema.nodes || []) {
    if (node.id === 'runtime-title') continue;

    const stepId = focusToStep.get(node.id) || steps[0]?.id || 'step-1';

    if (node.type === 'text') {
      components.push({
        id: `restored-${node.id}`,
        type: 'text',
        x: sanitize(node.x),
        y: sanitize(node.y),
        width: sanitize(node.width ?? 220, 220),
        height: sanitize(node.height ?? 80, 80),
        stepId,
        props: {
          text: node.props.content || 'text',
          fontSize: sanitize(node.props.size ?? 16, 16),
          color: node.props.color || '#ffffff',
          bold: Number(node.props.weight || 400) >= 600,
          italic: false,
          align: node.props.align || 'left',
        },
      });
      continue;
    }

    if (node.type === 'toggle') {
      components.push({
        id: `restored-${node.id}`,
        type: 'switch',
        x: sanitize(node.x),
        y: sanitize(node.y),
        width: sanitize(node.width ?? 120, 120),
        height: sanitize(node.height ?? 100, 100),
        stepId,
        props: {
          label: node.props.label || 'switch',
          state: Boolean(variables.get(node.props.variableId)),
        },
      });
      continue;
    }

    const fallbackLabel = node.type === 'panel'
      ? node.props.label || '[panel]'
      : `[computed] ${node.props.label || 'number'}`;

    components.push({
      id: `restored-${node.id}`,
      type: 'hotspot',
      x: sanitize(node.x),
      y: sanitize(node.y),
      width: sanitize(node.width ?? 180, 180),
      height: sanitize(node.height ?? 80, 80),
      stepId,
      props: {
        label: fallbackLabel,
        action: 'show-tip',
        tipContent: '从 Runtime Schema 回填的占位组件',
      },
    });
  }

  return {
    courseTitle: schema.title || '恢复课件',
    components,
    steps,
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => `"${key}":${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}

function nodeSignature(node: RuntimeNode) {
  return stableStringify(node);
}

function variableSignature(variable: LessonVariable) {
  return stableStringify(variable);
}

export function diffRuntimeSchemas(
  fromSchema: LessonSchemaV1,
  toSchema: LessonSchemaV1,
  fromVersion?: number,
  toVersion?: number
): RuntimeSchemaDiffSummary {
  const fromNodeMap = new Map((fromSchema.nodes || []).map((node) => [node.id, node]));
  const toNodeMap = new Map((toSchema.nodes || []).map((node) => [node.id, node]));

  let nodeAdded = 0;
  let nodeRemoved = 0;
  let nodeChanged = 0;

  for (const [id, node] of toNodeMap.entries()) {
    const oldNode = fromNodeMap.get(id);
    if (!oldNode) {
      nodeAdded += 1;
      continue;
    }
    if (nodeSignature(oldNode) !== nodeSignature(node)) {
      nodeChanged += 1;
    }
  }
  for (const id of fromNodeMap.keys()) {
    if (!toNodeMap.has(id)) nodeRemoved += 1;
  }

  const fromVarMap = new Map((fromSchema.variables || []).map((v) => [v.id, v]));
  const toVarMap = new Map((toSchema.variables || []).map((v) => [v.id, v]));

  let variableAdded = 0;
  let variableRemoved = 0;
  let variableChanged = 0;

  for (const [id, variable] of toVarMap.entries()) {
    const oldVar = fromVarMap.get(id);
    if (!oldVar) {
      variableAdded += 1;
      continue;
    }
    if (variableSignature(oldVar) !== variableSignature(variable)) {
      variableChanged += 1;
    }
  }
  for (const id of fromVarMap.keys()) {
    if (!toVarMap.has(id)) variableRemoved += 1;
  }

  const timelineChanged = stableStringify(fromSchema.timeline || []) !== stableStringify(toSchema.timeline || []);

  return {
    fromVersion,
    toVersion,
    nodeAdded,
    nodeRemoved,
    nodeChanged,
    variableAdded,
    variableRemoved,
    variableChanged,
    timelineChanged,
  };
}
