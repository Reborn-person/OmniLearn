import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, Type, Image as ImageIcon, MousePointer2, 
  Lightbulb, Network, Layout, PlusCircle, Settings, 
  Save, Play, Trash2, Eye, Video, Code, ChevronDown, ChevronUp,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Link,
  Clock, ArrowUp, ArrowDown, Copy, Download
} from 'lucide-react';
import { draftsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type ComponentType = 'text' | 'image' | 'video' | 'code' | 'hotspot' | 'switch' | 'flow' | 'quiz' | 'accordion' | 'divider';

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

interface Step {
  id: string;
  name: string;
  duration: number;
}

const componentTypes: { type: ComponentType; icon: React.ElementType; label: string; color: string }[] = [
  { type: 'text', icon: Type, label: '文本', color: 'slate' },
  { type: 'image', icon: ImageIcon, label: '图片', color: 'slate' },
  { type: 'video', icon: Video, label: '视频', color: 'red' },
  { type: 'code', icon: Code, label: '代码', color: 'yellow' },
  { type: 'hotspot', icon: MousePointer2, label: '点击热区', color: 'blue' },
  { type: 'switch', icon: Lightbulb, label: '状态开关', color: 'amber' },
  { type: 'flow', icon: Network, label: '数据流', color: 'purple' },
  { type: 'quiz', icon: Lightbulb, label: '测验', color: 'emerald' },
  { type: 'accordion', icon: ChevronDown, label: '折叠面板', color: 'cyan' },
  { type: 'divider', icon: AlignLeft, label: '分隔线', color: 'gray' },
];

function BuilderView({ onBack, draftId }: { onBack: () => void; draftId?: number }) {
  const { user } = useAuth();
  const [currentDraftId, setCurrentDraftId] = useState<number | undefined>(draftId);
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<ComponentType | null>(null);
  const [courseTitle, setCourseTitle] = useState('我的新课程');
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<Step[]>([
    { id: 'step-1', name: '引入', duration: 0 },
    { id: 'step-2', name: '讲解', duration: 2 },
    { id: 'step-3', name: '练习', duration: 4 },
    { id: 'step-4', name: '总结', duration: 6 },
  ]);
  const [isDraggingOnCanvas, setIsDraggingOnCanvas] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const selectedComponent = components.find(c => c.id === selectedId);

  // Auto-save
  useEffect(() => {
    if (!autoSaveEnabled || components.length === 0) return;
    
    const savedData = localStorage.getItem('omnilearn_builder_draft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCourseTitle(parsed.title || '我的新课程');
        setComponents(parsed.components || []);
        setSteps(parsed.steps || steps);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!autoSaveEnabled || components.length === 0) return;
    
    const timer = setTimeout(() => {
      const draft = { title: courseTitle, components, steps };
      localStorage.setItem('omnilearn_builder_draft', JSON.stringify(draft));
      setLastSaved(new Date());
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [components, courseTitle, steps, autoSaveEnabled]);

  const getDefaultProps = (type: ComponentType) => {
    switch (type) {
      case 'text':
        return { text: '双击编辑文本', fontSize: 16, color: '#ffffff', bold: false, italic: false, align: 'left' };
      case 'image':
        return { src: '', alt: '图片', fit: 'cover' };
      case 'video':
        return { url: '', autoplay: false };
      case 'code':
        return { code: '// 代码', language: 'javascript', theme: 'dark' };
      case 'hotspot':
        return { label: '点击这里', action: 'show-tip', tipContent: '' };
      case 'switch':
        return { label: '开关', state: false };
      case 'flow':
        return { from: '', to: '', label: '' };
      case 'quiz':
        return { question: '问题?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: '' };
      case 'accordion':
        return { title: '点击展开', content: '内容', expanded: false };
      case 'divider':
        return { style: 'solid', color: '#ffffff' };
      default:
        return {};
    }
  };

  // Drag from sidebar
  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedType || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 40;

    const newComponent: BuilderComponent = {
      id: `${draggedType}-${Date.now()}`,
      type: draggedType,
      x: Math.max(0, Math.min(x, rect.width - 150)),
      y: Math.max(0, Math.min(y, rect.height - 100)),
      width: draggedType === 'text' ? 200 : 150,
      height: draggedType === 'code' ? 120 : 80,
      stepId: steps[currentStep]?.id || 'step-1',
      props: getDefaultProps(draggedType),
    };

    setComponents([...components, newComponent]);
    setSelectedId(newComponent.id);
    setDraggedType(null);
  };

  // Drag on canvas (reposition)
  const handleCanvasMouseDown = (e: React.MouseEvent, compId: string) => {
    e.stopPropagation();
    const comp = components.find(c => c.id === compId);
    if (!comp || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setSelectedId(compId);
    setIsDraggingOnCanvas(true);
    setDragOffset({
      x: e.clientX - rect.left - comp.x,
      y: e.clientY - rect.top - comp.y
    });
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingOnCanvas || !selectedId || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 100));
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 60));

    setComponents(components.map(c => 
      c.id === selectedId ? { ...c, x, y } : c
    ));
  }, [isDraggingOnCanvas, selectedId, dragOffset, components]);

  const handleCanvasMouseUp = () => {
    setIsDraggingOnCanvas(false);
  };

  const updateComponentProps = (id: string, props: Record<string, any>) => {
    setComponents(components.map(c => 
      c.id === id ? { ...c, props: { ...c.props, ...props } } : c
    ));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateComponent = (id: string) => {
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    
    const newComp: BuilderComponent = {
      ...comp,
      id: `${comp.type}-${Date.now()}`,
      x: comp.x + 20,
      y: comp.y + 20,
    };
    setComponents([...components, newComp]);
    setSelectedId(newComp.id);
  };

  const handleSave = async () => {
    const draft = { title: courseTitle, components, steps };
    
    try {
      if (currentDraftId) {
        await draftsApi.update(currentDraftId, courseTitle, JSON.stringify(draft));
        alert('草稿已更新！');
      } else {
        const result = await draftsApi.create(courseTitle, JSON.stringify(draft), user?.id);
        if (result.data?.id) {
          setCurrentDraftId(result.data.id);
          alert('草稿已保存！');
        }
      }
    } catch (e) {
      alert('保存失败，请重试');
    }
  };

  const handlePreview = () => {
    sessionStorage.setItem('previewComponents', JSON.stringify(components));
    sessionStorage.setItem('previewTitle', courseTitle);
    sessionStorage.setItem('previewSteps', JSON.stringify(steps));
    window.open('/preview', '_blank');
  };

  const handlePublish = async () => {
    if (components.length === 0) {
      alert('请先添加至少一个组件');
      return;
    }
    await handleSave();
    alert('课程已发布！可以到课程列表中查看。');
  };

  const addStep = () => {
    const newStep = { id: `step-${steps.length + 1}`, name: `步骤 ${steps.length + 1}`, duration: steps.length * 2 };
    setSteps([...steps, newStep]);
  };

  const deleteStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter(s => s.id !== id));
    setComponents(components.map(c => 
      c.stepId === id ? { ...c, stepId: steps[0]?.id } : c
    ));
  };

  const renderComponent = (comp: BuilderComponent) => {
    const isSelected = comp.id === selectedId;
    const isOnCanvas = true;
    
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: comp.x,
      top: comp.y,
      width: comp.width,
      height: comp.height,
      cursor: isDraggingOnCanvas && selectedId === comp.id ? 'grabbing' : 'grab',
      border: isSelected ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.3)',
      overflow: 'hidden',
    };

    switch (comp.type) {
      case 'text':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex items-center p-2"
          >
            <span style={{ 
              color: comp.props.color, 
              fontSize: comp.props.fontSize,
              fontWeight: comp.props.bold ? 'bold' : 'normal',
              fontStyle: comp.props.italic ? 'italic' : 'normal',
              textAlign: comp.props.align as any,
              width: '100%'
            }}>
              {comp.props.text}
            </span>
          </div>
        );
      case 'image':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex items-center justify-center"
          >
            {comp.props.src ? (
              <img src={comp.props.src} alt={comp.props.alt} style={{ width: '100%', height: '100%', objectFit: comp.props.fit as any }} />
            ) : (
              <div className="text-center text-slate-500">
                <ImageIcon size={24} className="mx-auto mb-1" />
                <span className="text-xs">点击添加图片</span>
              </div>
            )}
          </div>
        );
      case 'video':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex items-center justify-center bg-black/50"
          >
            {comp.props.url ? (
              <iframe src={comp.props.url} className="w-full h-full" frameBorder="0" allowFullScreen />
            ) : (
              <div className="text-center text-slate-500">
                <Video size={24} className="mx-auto mb-1" />
                <span className="text-xs">输入视频URL</span>
              </div>
            )}
          </div>
        );
      case 'code':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="bg-slate-900 p-2 font-mono text-xs overflow-auto"
          >
            <pre className="text-green-400">{comp.props.code}</pre>
          </div>
        );
      case 'hotspot':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex items-center justify-center bg-blue-500/20 border-blue-500/30"
          >
            <MousePointer2 size={16} className="text-blue-400 mr-1" />
            <span className="text-blue-300 text-xs">{comp.props.label}</span>
          </div>
        );
      case 'switch':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className={`flex items-center justify-center ${comp.props.state ? 'bg-amber-500/20' : ''}`}
          >
            <Lightbulb size={20} className={comp.props.state ? 'text-amber-400' : 'text-slate-500'} />
            <span className="text-xs ml-1">{comp.props.label}</span>
          </div>
        );
      case 'flow':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex items-center justify-center bg-purple-500/20"
          >
            <Network size={16} className="text-purple-400" />
            <span className="text-purple-300 text-xs ml-1">→</span>
          </div>
        );
      case 'quiz':
        return (
          <div 
            style={{...baseStyle, flexDirection: 'column', padding: '8px'}}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="bg-emerald-500/20"
          >
            <span className="text-emerald-300 text-xs mb-1">{comp.props.question}</span>
            <div className="flex flex-wrap gap-1">
              {(comp.props.options || []).map((opt: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-500/30 rounded text-xs text-emerald-200">
                  {opt}
                </span>
              ))}
            </div>
          </div>
        );
      case 'accordion':
        return (
          <div 
            style={baseStyle}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex flex-col bg-cyan-500/20"
          >
            <div className="flex items-center justify-between px-2 py-1 bg-cyan-500/30">
              <span className="text-cyan-300 text-xs">{comp.props.title}</span>
              {comp.props.expanded ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
            </div>
            {comp.props.expanded && <div className="flex-1 p-2 text-slate-400 text-xs">{comp.props.content}</div>}
          </div>
        );
      case 'divider':
        return (
          <div 
            style={{...baseStyle, height: 20, background: 'transparent'}}
            onMouseDown={(e) => handleCanvasMouseDown(e, comp.id)}
            className="flex items-center"
          >
            <div className="w-full h-px" style={{ background: comp.props.color }} />
          </div>
        );
      default:
        return <div style={baseStyle}>?</div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      className="relative z-10 flex h-screen overflow-hidden p-4 gap-4"
    >
      {/* Left Panel */}
      <div className="w-64 flex flex-col gap-4">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={onBack} className="p-1.5 hover:bg-white/10 rounded-md text-slate-300">
              <ChevronLeft size={18} />
            </button>
            <input 
              type="text" 
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="bg-transparent text-white font-bold text-sm focus:outline-none flex-1"
            />
          </div>
          
          <div className="text-xs text-slate-500 mb-2">
            {lastSaved && `已自动保存: ${lastSaved.toLocaleTimeString()}`}
          </div>
        </div>

        {/* Component Library */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex-1 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">拖拽组件</h4>
          <div className="grid grid-cols-2 gap-2">
            {componentTypes.map(({ type, icon: Icon, label, color }) => (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type as ComponentType)}
                className={`bg-${color}-500/10 border border-${color}-500/20 rounded-lg p-3 flex flex-col items-center gap-2 cursor-grab hover:bg-${color}-500/30 transition-colors`}
              >
                <Icon size={20} className={`text-${color}-400`} />
                <span className={`text-xs text-${color}-100`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">操作</h4>
          <div className="space-y-2">
            <button onClick={handleSave} className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-sm">
              <Save size={16} /> 保存草稿
            </button>
            <button onClick={handlePreview} className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm">
              <Eye size={16} /> 预览课程
            </button>
            <button onClick={handlePublish} className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm">
              <Play size={16} /> 发布课程
            </button>
          </div>
        </div>
      </div>

      {/* Center - Canvas + Timeline */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Canvas */}
        <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden">
          <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/20">
            <div className="flex items-center gap-2">
              <Layout size={18} className="text-slate-400" />
              <span className="text-white text-sm">画布 - {steps[currentStep]?.name}</span>
            </div>
            <span className="text-xs text-slate-500">{components.length} 个组件</span>
          </div>
          
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-auto"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{ 
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              cursor: isDraggingOnCanvas ? 'grabbing' : 'default'
            }}
          >
            {components.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                <PlusCircle size={48} className="mb-4 opacity-30" />
                <p>从左侧拖拽组件到此处</p>
                <p className="text-xs mt-2">点击组件可选中，拖动可移动位置</p>
              </div>
            ) : (
              components.map(comp => (
                <div key={comp.id} onClick={() => setSelectedId(comp.id)}>
                  {renderComponent(comp)}
                  {selectedId === comp.id && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteComponent(comp.id); }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600"
                      >
                        <Trash2 size={12} className="text-white" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateComponent(comp.id); }}
                        className="absolute -top-2 -right-8 p-1 bg-blue-500 rounded-full hover:bg-blue-600"
                      >
                        <Copy size={12} className="text-white" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="h-32 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col">
          <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-black/20">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-400" />
              <span className="font-bold text-white text-xs">时间轴</span>
            </div>
            <button onClick={addStep} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <PlusCircle size={12} /> 添加步骤
            </button>
          </div>
          <div className="flex-1 p-3 overflow-x-auto">
            <div className="flex gap-3 h-full">
              {steps.map((step, index) => (
                <div 
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`flex-shrink-0 w-28 rounded-lg border-2 cursor-pointer transition-all flex flex-col ${
                    index === currentStep 
                      ? 'border-blue-500 bg-blue-500/20' 
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className={`text-xs font-medium ${index === currentStep ? 'text-blue-400' : 'text-slate-400'}`}>
                      {step.name}
                    </span>
                    {steps.length > 1 && (
                      <button onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }} className="text-slate-600 hover:text-red-400">
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-slate-500 text-xs">{step.duration}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden">
        <div className="h-12 border-b border-white/10 flex items-center px-4 bg-black/20">
          <Settings size={16} className="text-slate-400 mr-2" />
          <span className="text-white text-sm">属性</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {selectedComponent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">{selectedComponent.type}</span>
                <div className="flex gap-1">
                  <button onClick={() => duplicateComponent(selectedComponent.id)} className="p-1 hover:bg-white/10 rounded text-blue-400">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => deleteComponent(selectedComponent.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Step Assignment */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">显示步骤</label>
                <select
                  value={selectedComponent.stepId}
                  onChange={(e) => setComponents(components.map(c => 
                    c.id === selectedComponent.id ? { ...c, stepId: e.target.value } : c
                  ))}
                  className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                >
                  {steps.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Type-specific props */}
              {selectedComponent.type === 'text' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">文本内容</label>
                    <textarea
                      value={selectedComponent.props.text}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { text: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm min-h-[60px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">字号</label>
                      <input
                        type="number"
                        value={selectedComponent.props.fontSize}
                        onChange={(e) => updateComponentProps(selectedComponent.id, { fontSize: parseInt(e.target.value) })}
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">颜色</label>
                      <input
                        type="color"
                        value={selectedComponent.props.color}
                        onChange={(e) => updateComponentProps(selectedComponent.id, { color: e.target.value })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateComponentProps(selectedComponent.id, { bold: !selectedComponent.props.bold })}
                      className={`p-2 rounded ${selectedComponent.props.bold ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => updateComponentProps(selectedComponent.id, { italic: !selectedComponent.props.italic })}
                      className={`p-2 rounded ${selectedComponent.props.italic ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'}`}
                    >
                      <Italic size={14} />
                    </button>
                  </div>
                </>
              )}

              {selectedComponent.type === 'image' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">图片URL</label>
                    <input
                      type="text"
                      value={selectedComponent.props.src}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { src: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">替换文字</label>
                    <input
                      type="text"
                      value={selectedComponent.props.alt}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { alt: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                </>
              )}

              {selectedComponent.type === 'video' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">视频URL (YouTube embed)</label>
                    <input
                      type="text"
                      value={selectedComponent.props.url}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { url: e.target.value })}
                      placeholder="https://www.youtube.com/embed/..."
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                </>
              )}

              {selectedComponent.type === 'code' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">代码</label>
                    <textarea
                      value={selectedComponent.props.code}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { code: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-green-400 text-sm min-h-[100px] font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">语言</label>
                    <select
                      value={selectedComponent.props.language}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { language: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="html">HTML</option>
                      <option value="css">CSS</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>
                </>
              )}

              {selectedComponent.type === 'hotspot' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">标签文字</label>
                    <input
                      type="text"
                      value={selectedComponent.props.label}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">触发动作</label>
                    <select
                      value={selectedComponent.props.action}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { action: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    >
                      <option value="show-tip">显示提示</option>
                      <option value="next-step">下一步</option>
                      <option value="highlight">高亮</option>
                      <option value="play-animation">播放动画</option>
                    </select>
                  </div>
                </>
              )}

              {selectedComponent.type === 'switch' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">开关标签</label>
                    <input
                      type="text"
                      value={selectedComponent.props.label}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { label: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-500">初始状态</label>
                    <button
                      onClick={() => updateComponentProps(selectedComponent.id, { state: !selectedComponent.props.state })}
                      className={`px-3 py-1 rounded text-xs ${selectedComponent.props.state ? 'bg-amber-500 text-black' : 'bg-slate-700 text-white'}`}
                    >
                      {selectedComponent.props.state ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </>
              )}

              {selectedComponent.type === 'quiz' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">问题</label>
                    <input
                      type="text"
                      value={selectedComponent.props.question}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { question: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">选项 (逗号分隔)</label>
                    <input
                      type="text"
                      value={selectedComponent.props.options.join(',')}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { options: e.target.value.split(',') })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">正确答案</label>
                    <select
                      value={selectedComponent.props.answer}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { answer: parseInt(e.target.value) })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    >
                      {selectedComponent.props.options.map((opt: string, i: number) => (
                        <option key={i} value={i}>选项 {i + 1}: {opt}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedComponent.type === 'accordion' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">标题</label>
                    <input
                      type="text"
                      value={selectedComponent.props.title}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { title: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">内容</label>
                    <textarea
                      value={selectedComponent.props.content}
                      onChange={(e) => updateComponentProps(selectedComponent.id, { content: e.target.value })}
                      className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-white text-sm min-h-[80px]"
                    />
                  </div>
                </>
              )}

              {/* Common: Position & Size */}
              <div className="pt-4 border-t border-white/10">
                <label className="text-xs text-slate-500 block mb-2">位置与大小</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-600">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedComponent.x)}
                      onChange={(e) => setComponents(components.map(c => 
                        c.id === selectedComponent.id ? { ...c, x: parseInt(e.target.value) || 0 } : c
                      ))}
                      className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedComponent.y)}
                      onChange={(e) => setComponents(components.map(c => 
                        c.id === selectedComponent.id ? { ...c, y: parseInt(e.target.value) || 0 } : c
                      ))}
                      className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">宽</label>
                    <input
                      type="number"
                      value={selectedComponent.width}
                      onChange={(e) => setComponents(components.map(c => 
                        c.id === selectedComponent.id ? { ...c, width: parseInt(e.target.value) || 50 } : c
                      ))}
                      className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">高</label>
                    <input
                      type="number"
                      value={selectedComponent.height}
                      onChange={(e) => setComponents(components.map(c => 
                        c.id === selectedComponent.id ? { ...c, height: parseInt(e.target.value) || 50 } : c
                      ))}
                      className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center">
              <Settings size={32} className="mb-3 opacity-50" />
              <p>点击画布上的组件<br/>编辑其属性</p>
              <p className="text-xs mt-4 text-slate-600">拖动组件可调整位置</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default BuilderView;