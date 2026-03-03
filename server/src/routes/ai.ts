import { Router } from 'express';
import OpenAI from 'openai';
import { validateRuntimeSchema } from '../lib/runtimeSchema.js';

export const aiRouter = Router();

// Get AI client based on configuration
function getAIClient() {
  const provider = process.env.AI_PROVIDER || 'local';
  
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    return {
      name: 'openai',
      provider: 'OpenAI',
      client,
      model,
      generate: async (prompt: string) => {
        const response = await client.chat.completions.create({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });
        return response.choices[0]?.message?.content || '';
      }
    };
  }
  
  // Default: local template mode
  return null;
}

// Course template library for built-in course generation
const courseTemplates: Record<string, any> = {
  'python': {
    title: 'Python 编程入门',
    description: '从零开始学习 Python 编程，掌握基本语法和编程思维。',
    category: 'programming',
    lessons: [
      { title: 'Hello World', description: '编写你的第一个 Python 程序', type: 'interactive', content: { steps: [{ title: '输出', description: '使用 print() 函数输出 Hello World' }] }},
      { title: '变量与数据类型', description: '理解 Python 中的变量和数据类型', type: 'diagram', content: { components: ['变量', '整数', '字符串', '浮点数'] }},
      { title: '条件语句', description: 'if-else 条件判断', type: 'interactive', content: { interactions: [{ type: 'choice', options: ['if', 'elif', 'else'] }] }},
    ]
  },
  'javascript': {
    title: 'JavaScript 基础',
    description: '学习网页开发的灵魂语言 JavaScript。',
    category: 'web',
    lessons: [
      { title: '初识 JavaScript', description: 'JS 在网页中的作用', type: 'interactive', content: { steps: [{ title: '脚本', description: '在 HTML 中嵌入 JavaScript' }] }},
      { title: '函数', description: '函数的定义与调用', type: 'diagram', content: { components: ['function', '参数', '返回值'] }},
    ]
  },
  '数据结构': {
    title: '数据结构基础',
    description: '理解计算机存储和组织数据的方式。',
    category: 'computer-science',
    lessons: [
      { title: '数组', description: '最基本的数据结构', type: 'interactive', content: { interactions: [{ type: 'array', operations: ['push', 'pop', 'shift'] }] }},
      { title: '链表', description: '链式存储结构', type: 'diagram', content: { components: ['节点', '指针', '头结点'] }},
    ]
  },
  '算法': {
    title: '算法入门',
    description: '学习解决问题的核心思路。',
    category: 'computer-science',
    lessons: [
      { title: '排序算法', description: '冒泡排序与快速排序', type: 'interactive', content: { interactions: [{ type: 'sort', algorithms: ['bubble', 'quick'] }] }},
      { title: '查找算法', description: '二分查找', type: 'interactive', content: { interactions: [{ type: 'search', algorithm: 'binary' }] }},
    ]
  },
  '网络': {
    title: '计算机网络基础',
    description: '理解互联网是如何工作的。',
    category: 'computer-science',
    lessons: [
      { title: 'TCP/IP 四层模型', description: '网络协议分层', type: 'diagram', content: { components: ['应用层', '传输层', '网络层', '链路层'] }},
      { title: 'HTTP 协议', description: '网页通信的基础', type: 'interactive', content: { interactions: [{ type: 'request', methods: ['GET', 'POST', 'PUT', 'DELETE'] }] }},
    ]
  },
  '数据库': {
    title: '数据库入门',
    description: '学习数据存储与管理。',
    category: 'data',
    lessons: [
      { title: 'SQL 基础', description: '数据库查询语言', type: 'interactive', content: { interactions: [{ type: 'sql', commands: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] }] }},
      { title: '表设计', description: '如何设计高效的数据库表', type: 'diagram', content: { components: ['主键', '外键', '索引', '约束'] }},
    ]
  }
};

// Generate course from template
function generateFromTemplate(topic: string) {
  const normalizedTopic = topic.toLowerCase().trim();
  
  for (const [key, template] of Object.entries(courseTemplates)) {
    if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
      return template;
    }
  }
  
  return {
    title: topic,
    description: `关于 "${topic}" 的交互式学习课程`,
    category: 'general',
    lessons: [
      {
        title: '第一章：基础概念',
        description: `学习 ${topic} 的基本概念`,
        type: 'interactive',
        content: {
          steps: [
            { title: '概念介绍', description: `理解 ${topic} 的核心概念` },
            { title: '案例演示', description: '通过示例加深理解' }
          ]
        }
      },
      {
        title: '第二章：实践应用',
        description: `动手实践 ${topic}`,
        type: 'diagram',
        content: {
          components: ['理论', '实践', '总结']
        }
      }
    ]
  };
}

function extractJsonObject(raw: string) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return raw.slice(start, end + 1);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function makeRuntimeTemplate(topic: string, visualStyle: string = 'tech', complexity: 'low' | 'medium' | 'high' = 'medium') {
  const bitCount = complexity === 'high' ? 8 : complexity === 'medium' ? 6 : 4;
  const nodes: any[] = [
    {
      id: 'title',
      type: 'text',
      x: 28,
      y: 20,
      props: {
        content: `${topic} · 动态图解课件`,
        size: 24,
        weight: 700,
        color: '#e2e8f0',
      }
    },
    {
      id: 'hint',
      type: 'text',
      x: 28,
      y: 56,
      props: {
        content: `风格: ${visualStyle} | 难度: ${complexity}`,
        size: 13,
        color: '#94a3b8',
      }
    },
    {
      id: 'main-panel',
      type: 'panel',
      x: 24,
      y: 96,
      width: 980,
      height: 360,
      props: {
        label: `${topic} 互动区域`,
        background: 'rgba(15,23,42,0.72)',
        borderColor: 'rgba(56,189,248,0.3)',
      }
    }
  ];

  const variables: any[] = [];
  const sources: any[] = [];

  for (let i = 0; i < bitCount; i += 1) {
    const id = `state_${i + 1}`;
    variables.push({ id, type: 'boolean', initial: false });
    sources.push({ variableId: id, weight: Math.pow(2, bitCount - i - 1) });

    nodes.push({
      id: `toggle_${i + 1}`,
      type: 'toggle',
      x: 52 + i * 140,
      y: 190,
      width: 112,
      height: 120,
      props: {
        variableId: id,
        label: `${Math.pow(2, bitCount - i - 1)}`
      }
    });
  }

  nodes.push({
    id: 'computed-value',
    type: 'computed-number',
    x: 660,
    y: 118,
    width: 300,
    height: 110,
    props: {
      label: '实时结果',
      formula: 'binary_sum',
      sources
    }
  });

  const timeline = [
    { id: 'step-1', title: '观察结构', description: `先看 ${topic} 的组件分布。`, atMs: 0, focusNodeId: 'main-panel' },
    { id: 'step-2', title: '切换状态', description: '点击开关观察局部变化。', atMs: 2000, focusNodeId: 'toggle_1' },
    { id: 'step-3', title: '看总结果', description: '关注右上角实时计算结果。', atMs: 4000, focusNodeId: 'computed-value' },
    { id: 'step-4', title: '自由探索', description: '组合不同状态，理解规律。', atMs: 6000, focusNodeId: 'main-panel' },
  ];

  return {
    schemaVersion: '1.0',
    lessonId: `ai-${Date.now()}`,
    title: `${topic} · AI Runtime`,
    subtitle: 'Generated by AI template fallback',
    canvas: { width: 1040, height: 500 },
    variables,
    nodes,
    timeline
  };
}

async function generateRuntimeSchema(topic: string, visualStyle: string, complexity: 'low' | 'medium' | 'high') {
  const ai = getAIClient();

  if (!ai) {
    return { schema: makeRuntimeTemplate(topic, visualStyle, complexity), provider: 'template' };
  }

  const nodeBudget = complexity === 'high' ? 24 : complexity === 'medium' ? 16 : 10;
  const prompt = `
你是互动课件生成器。请根据主题生成 Runtime Schema v1 的 JSON。

要求：
1) 只返回 JSON，不要 markdown，不要注释。
2) schemaVersion 必须是 "1.0"。
3) 仅允许节点类型：text、panel、toggle、computed-number。
4) 画布尺寸保持在 width 900-1300, height 500-800。
5) 节点数量不超过 ${nodeBudget}。
6) timeline 至少 4 步，每一步包含 focusNodeId。
7) 变量类型仅使用 boolean/number/string。

主题: ${topic}
视觉风格: ${visualStyle}
复杂度: ${complexity}

返回对象结构：
{
  "schemaVersion": "1.0",
  "lessonId": "string",
  "title": "string",
  "subtitle": "string",
  "canvas": { "width": number, "height": number },
  "variables": [{ "id": "string", "type": "boolean|number|string", "initial": any }],
  "nodes": [
    { "id": "string", "type": "text", "x": number, "y": number, "width": number?, "height": number?, "props": { "content": "string", "size": number?, "weight": number?, "color": "string?", "align": "left|center|right?" } },
    { "id": "string", "type": "panel", "x": number, "y": number, "width": number, "height": number, "props": { "label": "string?", "background": "string?", "borderColor": "string?" } },
    { "id": "string", "type": "toggle", "x": number, "y": number, "width": number, "height": number, "props": { "variableId": "string", "label": "string" } },
    { "id": "string", "type": "computed-number", "x": number, "y": number, "width": number, "height": number, "props": { "label": "string", "formula": "binary_sum", "sources": [{ "variableId": "string", "weight": number }] } }
  ],
  "timeline": [{ "id": "string", "title": "string", "description": "string", "atMs": number, "focusNodeId": "string" }]
}
`;

  try {
    const raw = await ai.generate(prompt);
    const jsonText = extractJsonObject(raw) || raw;
    const parsed = normalizeRuntimeSchema(JSON.parse(jsonText));

    const validation = validateRuntimeSchema(parsed);
    if (!validation.valid) {
      console.warn('Generated runtime schema invalid, fallback template:', validation.error);
      return { schema: makeRuntimeTemplate(topic, visualStyle, complexity), provider: 'template' };
    }

    return { schema: parsed, provider: ai.provider.toLowerCase() };
  } catch (error) {
    console.error('Runtime schema generation failed, fallback template:', error);
    return { schema: makeRuntimeTemplate(topic, visualStyle, complexity), provider: 'template' };
  }
}

function normalizeRuntimeSchema(schema: any) {
  const normalized = deepClone(schema);

  if (normalized?.canvas) {
    normalized.canvas.width = clamp(Number(normalized.canvas.width || 1000), 900, 1300);
    normalized.canvas.height = clamp(Number(normalized.canvas.height || 600), 500, 800);
  }

  if (Array.isArray(normalized.nodes)) {
    normalized.nodes = normalized.nodes.slice(0, 32);
  }

  if (Array.isArray(normalized.variables)) {
    normalized.variables = normalized.variables.slice(0, 40);
  }

  if (Array.isArray(normalized.timeline)) {
    normalized.timeline = normalized.timeline.slice(0, 16).map((item: any, index: number) => ({
      ...item,
      atMs: clamp(Number(item.atMs ?? index * 2000), 0, 120000),
    }));
  }

  return normalized;
}

function refineRuntimeSchemaByRules(currentSchema: any, instruction: string, visualStyle: string = 'tech') {
  const schema = normalizeRuntimeSchema(deepClone(currentSchema));
  const text = instruction.toLowerCase();

  if (text.includes('快') || text.includes('fast') || text.includes('提速')) {
    if (Array.isArray(schema.timeline)) {
      schema.timeline = schema.timeline.map((item: any) => ({
        ...item,
        atMs: Math.max(200, Math.round(Number(item.atMs || 0) * 0.75)),
      }));
    }
  }

  if (text.includes('慢') || text.includes('slow')) {
    if (Array.isArray(schema.timeline)) {
      schema.timeline = schema.timeline.map((item: any) => ({
        ...item,
        atMs: Math.min(120000, Math.round(Number(item.atMs || 0) * 1.3)),
      }));
    }
  }

  if (text.includes('高亮') || text.includes('highlight') || text.includes('强调')) {
    if (Array.isArray(schema.nodes)) {
      schema.nodes = schema.nodes.map((node: any, index: number) => {
        if (node.type === 'text' && index < 2) {
          return { ...node, props: { ...node.props, color: '#f59e0b', weight: 800 } };
        }
        if (node.type === 'panel') {
          return { ...node, props: { ...node.props, borderColor: 'rgba(245, 158, 11, 0.5)' } };
        }
        return node;
      });
    }
  }

  if (text.includes('开关') || text.includes('toggle') || text.includes('交互')) {
    const maxToggleIndex = Array.isArray(schema.variables) ? schema.variables.length : 0;
    if (!Array.isArray(schema.variables)) schema.variables = [];
    if (!Array.isArray(schema.nodes)) schema.nodes = [];

    const newVarId = `state_${maxToggleIndex + 1}`;
    schema.variables.push({ id: newVarId, type: 'boolean', initial: false });
    schema.nodes.push({
      id: `toggle_${maxToggleIndex + 1}`,
      type: 'toggle',
      x: 50 + (maxToggleIndex % 6) * 130,
      y: 340,
      width: 110,
      height: 100,
      props: {
        variableId: newVarId,
        label: `${maxToggleIndex + 1}`,
      },
    });
  }

  if (visualStyle === 'minimal' && Array.isArray(schema.nodes)) {
    schema.nodes = schema.nodes.map((node: any) => {
      if (node.type === 'panel') {
        return {
          ...node,
          props: {
            ...node.props,
            background: 'rgba(2, 6, 23, 0.55)',
            borderColor: 'rgba(148, 163, 184, 0.2)',
          },
        };
      }
      return node;
    });
  }

  schema.subtitle = `Refined by rules: ${instruction.slice(0, 48)}`;
  return schema;
}

async function refineRuntimeSchema(currentSchema: any, instruction: string, visualStyle: string = 'tech') {
  const ai = getAIClient();
  const normalizedCurrent = normalizeRuntimeSchema(currentSchema);

  if (!ai) {
    return { schema: refineRuntimeSchemaByRules(normalizedCurrent, instruction, visualStyle), provider: 'template' };
  }

  const prompt = `
你是 Runtime Schema v1 的改写器。请基于给定 currentSchema 按 instruction 做增量修改，并返回“完整 schema JSON”。

严格要求：
1) 只返回 JSON，不要 markdown，不要解释。
2) schemaVersion 必须为 "1.0"。
3) 仅允许节点类型：text、panel、toggle、computed-number。
4) 保持 lessonId 不变。
5) 尽量复用现有 node id / variable id，避免无谓重命名。
6) 保留可交互性，不能把 nodes 清空。

visualStyle: ${visualStyle}
instruction: ${instruction}
currentSchema:
${JSON.stringify(normalizedCurrent)}
`;

  try {
    const raw = await ai.generate(prompt);
    const jsonText = extractJsonObject(raw) || raw;
    const parsed = normalizeRuntimeSchema(JSON.parse(jsonText));
    const validation = validateRuntimeSchema(parsed);

    if (!validation.valid) {
      console.warn('Refined runtime schema invalid, fallback rules:', validation.error);
      return { schema: refineRuntimeSchemaByRules(normalizedCurrent, instruction, visualStyle), provider: 'template' };
    }

    return { schema: parsed, provider: ai.provider.toLowerCase() };
  } catch (error) {
    console.error('Refine runtime schema failed, fallback rules:', error);
    return { schema: refineRuntimeSchemaByRules(normalizedCurrent, instruction, visualStyle), provider: 'template' };
  }
}

// Generate course with AI
async function generateWithAI(topic: string) {
  const ai = getAIClient();
  if (!ai) {
    return generateFromTemplate(topic);
  }

  const prompt = `
请生成一个关于 "${topic}" 的交互式学习课程。

请返回 JSON 格式的课程结构：
{
  "title": "课程标题",
  "description": "课程描述",
  "category": "分类",
  "lessons": [
    {
      "title": "课时标题",
      "description": "课时描述", 
      "type": "diagram" | "interactive" | "quiz",
      "content": { /* 根据类型生成对应内容 */ }
    }
  ]
}

请确保内容准确、有教育价值。返回纯 JSON，不要有其他文字。
`;

  try {
    const result = await ai.generate(prompt);
    const parsed = JSON.parse(result);
    return parsed;
  } catch (error) {
    console.error('AI generation failed, using template:', error);
    return generateFromTemplate(topic);
  }
}

// Generate course
aiRouter.post('/generate-course', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic required' });
    }

    const provider = process.env.AI_PROVIDER || 'local';
    let course;
    let providerName = 'template';

    if (provider !== 'local') {
      course = await generateWithAI(topic);
      providerName = provider;
    } else {
      course = generateFromTemplate(topic);
    }
    
    res.json({ 
      course,
      provider: providerName
    });
  } catch (error) {
    console.error('Course generation error:', error);
    res.status(500).json({ error: 'Failed to generate course' });
  }
});

// Generate lesson content
aiRouter.post('/generate-lesson', async (req, res) => {
  try {
    const { lessonTitle, topic, type = 'interactive' } = req.body;
    
    if (!lessonTitle || !topic) {
      return res.status(400).json({ error: 'Lesson title and topic required' });
    }

    const provider = process.env.AI_PROVIDER || 'local';
    let lesson;
    let providerName = 'template';

    if (provider !== 'local') {
      const ai = getAIClient();
      if (ai) {
        const prompt = `
生成一个关于 "${topic}" 的 "${type}" 类型课时。
课时标题: ${lessonTitle}

请返回 JSON 格式：
{
  "title": "课时标题",
  "description": "课时描述",
  "type": "${type}",
  "content": { /* 根据类型生成对应内容 */ }
}
`;
        try {
          const result = await ai.generate(prompt);
          lesson = JSON.parse(result);
        } catch {
          lesson = {
            title: lessonTitle,
            description: `${topic} - ${lessonTitle}`,
            type,
            content: {
              steps: [
                { title: '概念', description: `理解 ${topic} 的基本概念` },
                { title: '示例', description: '通过示例学习' },
                { title: '练习', description: '动手实践' }
              ]
            }
          };
        }
      } else {
        lesson = generateFromTemplate(topic).lessons[0];
      }
    } else {
      lesson = {
        title: lessonTitle,
        description: `${topic} - ${lessonTitle}`,
        type,
        content: {
          steps: [
            { title: '概念', description: `理解 ${topic} 的基本概念` },
            { title: '示例', description: '通过示例学习' },
            { title: '练习', description: '动手实践' }
          ]
        }
      };
    }
    
    res.json({ 
      lesson,
      provider: providerName
    });
  } catch (error) {
    console.error('Lesson generation error:', error);
    res.status(500).json({ error: 'Failed to generate lesson' });
  }
});

// Get available templates
aiRouter.get('/templates', (req, res) => {
  res.json({
    templates: Object.keys(courseTemplates),
    provider: process.env.AI_PROVIDER || 'local'
  });
});

// Get current AI configuration
aiRouter.get('/config', (req, res) => {
  const provider = process.env.AI_PROVIDER || 'local';
  res.json({
    provider,
    configured: provider !== 'local',
    availableProviders: ['local', 'openai']
  });
});

// Generate runtime schema for dynamic lesson effects
aiRouter.post('/generate-runtime-schema', async (req, res) => {
  try {
    const { topic, visualStyle = 'tech', complexity = 'medium' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'topic is required' });
    }

    const allowedComplexity = ['low', 'medium', 'high'] as const;
    const normalizedComplexity = allowedComplexity.includes(complexity) ? complexity : 'medium';

    const { schema, provider } = await generateRuntimeSchema(topic.trim(), String(visualStyle || 'tech'), normalizedComplexity);
    res.json({ schema, provider });
  } catch (error) {
    console.error('Generate runtime schema error:', error);
    res.status(500).json({ error: 'Failed to generate runtime schema' });
  }
});

// Refine existing runtime schema by natural-language instruction
aiRouter.post('/refine-runtime-schema', async (req, res) => {
  try {
    const { currentSchema, instruction, visualStyle = 'tech' } = req.body;

    if (!currentSchema || typeof currentSchema !== 'object') {
      return res.status(400).json({ error: 'currentSchema is required' });
    }

    if (!instruction || typeof instruction !== 'string') {
      return res.status(400).json({ error: 'instruction is required' });
    }

    const validation = validateRuntimeSchema(currentSchema);
    if (!validation.valid) {
      return res.status(400).json({ error: `currentSchema invalid: ${validation.error}` });
    }

    const { schema, provider } = await refineRuntimeSchema(currentSchema, instruction.trim(), String(visualStyle || 'tech'));
    res.json({ schema, provider });
  } catch (error) {
    console.error('Refine runtime schema error:', error);
    res.status(500).json({ error: 'Failed to refine runtime schema' });
  }
});
