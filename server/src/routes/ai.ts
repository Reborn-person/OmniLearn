import { Router } from 'express';
import OpenAI from 'openai';

export const aiRouter = Router();

// Get AI client based on configuration
function getAIClient() {
  const provider = process.env.AI_PROVIDER || 'local';
  
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      provider: 'OpenAI',
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      }),
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      generate: async (prompt: string) => {
        const response = await client.chat.completions.create({
          model: model,
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