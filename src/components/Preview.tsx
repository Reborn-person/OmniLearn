import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronDown, ChevronUp, Play, Pause, RotateCcw } from 'lucide-react';

type ComponentType = 'text' | 'image' | 'video' | 'code' | 'hotspot' | 'switch' | 'flow' | 'quiz' | 'accordion' | 'divider';

interface BuilderComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, any>;
}

function PreviewView() {
  const [components, setComponents] = useState<BuilderComponent[]>([]);
  const [title, setTitle] = useState('课程预览');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [switchStates, setSwitchStates] = useState<Record<string, boolean>>({});
  const [accordionStates, setAccordionStates] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [accordionStates, setAccordionStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const storedComponents = sessionStorage.getItem('previewComponents');
    const storedTitle = sessionStorage.getItem('previewTitle');
    
    if (storedComponents) {
      try {
        setComponents(JSON.parse(storedComponents));
      } catch (e) {
        console.error('Failed to parse components', e);
      }
    }
    if (storedTitle) {
      setTitle(storedTitle);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev < 2 ? prev + 1 : 0));
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSwitchToggle = (id: string) => {
    setSwitchStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderComponent = (comp: BuilderComponent) => {
    const isOn = switchStates[comp.id] ?? comp.props.state ?? false;
    const isExpanded = accordionStates[comp.id] ?? comp.props.expanded ?? false;
    
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: comp.x,
      top: comp.y,
      width: comp.width,
      height: comp.height,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
    };

    switch (comp.type) {
      case 'text':
        return (
          <div style={baseStyle}>
            <span style={{ color: comp.props.color, fontSize: comp.props.fontSize }}>
              {comp.props.text}
            </span>
          </div>
        );
      case 'image':
        return (
          <div style={{ ...baseStyle, background: 'rgba(255,255,255,0.05)' }}>
            {comp.props.src ? (
              <img src={comp.props.src} alt={comp.props.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
            ) : (
              <div className="text-slate-500 text-sm">图片占位</div>
            )}
          </div>
        );
      case 'hotspot':
        return (
          <motion.button
            type="button"
            style={{ ...baseStyle, background: 'rgba(59,130,246,0.2)', border: 'none', cursor: 'pointer' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-blue-300 text-sm">{comp.props.label}</span>
          </motion.button>
        );
      case 'switch':
        return (
          <motion.button
            type="button"
            style={{ 
              ...baseStyle, 
              background: isOn ? 'rgba(251,191,36,0.3)' : 'rgba(0,0,0,0.3)',
              border: 'none', 
              cursor: 'pointer' 
            }}
            onClick={() => handleSwitchToggle(comp.id)}
            whileTap={{ scale: 0.95 }}
          >
            <span style={{ color: isOn ? '#fbbf24' : '#64748b' }}>
              {isOn ? 'ON' : 'OFF'}
            </span>
          </motion.button>
        );
      case 'flow':
        return (
          <div style={{ ...baseStyle, background: 'rgba(168,85,247,0.2)' }}>
            <span className="text-purple-300 text-sm">→</span>
          </div>
        );
      case 'quiz':
        const selectedAnswer = quizAnswers[comp.id];
        const isSubmitted = quizSubmitted[comp.id];
        const correctAnswer = comp.props.answer ?? 0;
        
        const handleAnswerSelect = (idx: number) => {
          if (isSubmitted) return;
          setQuizAnswers(prev => ({ ...prev, [comp.id]: idx }));
        };
        
        const handleSubmit = () => {
          if (selectedAnswer === undefined) return;
          setQuizSubmitted(prev => ({ ...prev, [comp.id]: true }));
          if (selectedAnswer === correctAnswer) {
            setQuizScore(prev => prev + 10);
          }
        };
        
        const getOptionStyle = (idx: number) => {
          if (!isSubmitted) {
            return selectedAnswer === idx 
              ? 'bg-emerald-500/50 border-emerald-400 text-white' 
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/30';
          }
          if (idx === correctAnswer) return 'bg-emerald-500/50 border-emerald-400 text-white';
          if (idx === selectedAnswer && idx !== correctAnswer) return 'bg-red-500/50 border-red-400 text-white';
          return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200 opacity-50';
        };
        
        return (
          <div style={{ ...baseStyle, background: 'rgba(16,185,129,0.2)', flexDirection: 'column', padding: '8px', height: 'auto', minHeight: comp.height }}>
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-emerald-300 text-xs font-bold">测验</span>
              {isSubmitted && (
                <span className={`text-xs font-bold ${selectedAnswer === correctAnswer ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedAnswer === correctAnswer ? '✓ 正确!' : '✗ 错误'}
                </span>
              )}
            </div>
            <span className="text-white text-sm mb-3 block">{comp.props.question}</span>
            <div className="flex flex-col gap-2 w-full">
              {(comp.props.options || []).map((opt: string, idx: number) => (
                <button
                  key={`${comp.id}-opt-${idx}`}
                  type="button"
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={isSubmitted}
                  className={`px-3 py-2 rounded text-xs text-left border transition-all ${getOptionStyle(idx)}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {!isSubmitted && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedAnswer === undefined}
                className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white text-xs font-bold rounded transition-all"
              >
                提交答案
              </button>
            )}
            {isSubmitted && comp.props.explanation && (
              <div className="mt-3 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-200">
                {comp.props.explanation}
              </div>
            )}
          </div>
        );
        return (
          <div style={{ ...baseStyle, background: 'rgba(16,185,129,0.2)', flexDirection: 'column', padding: '8px' }}>
            <span className="text-emerald-300 text-xs mb-2">{comp.props.question}</span>
            <div className="flex gap-1 flex-wrap">
              {(comp.props.options || []).map((opt: string, idx: number) => (
                <span key={`${comp.id}-opt-${idx}`} className="px-2 py-0.5 bg-emerald-500/30 rounded text-xs text-emerald-200">
                  {opt}
                </span>
              ))}
            </div>
          </div>
        );
      case 'video':
        return (
          <div style={{ ...baseStyle, background: 'rgba(239,68,68,0.2)', flexDirection: 'column', padding: '8px' }}>
            {comp.props.url ? (
              comp.props.url.includes('youtube') || comp.props.url.includes('youtu.be') ? (
                <div className="w-full h-full flex items-center justify-center bg-black/40 rounded">
                  <span className="text-red-300 text-xs">YouTube: {comp.props.url}</span>
                </div>
              ) : (
                <video src={comp.props.url} controls className="w-full h-full object-cover rounded">
                  <track kind="captions" />
                </video>
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <span className="text-red-300 text-xs mb-1">视频占位</span>
              </div>
            )}
          </div>
        );
      case 'code':
        return (
          <div style={{ ...baseStyle, background: '#1e1e1e', flexDirection: 'column', padding: '8px', overflow: 'hidden' }}>
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-yellow-300 text-xs">{comp.props.language || 'javascript'}</span>
            </div>
            <pre className="text-xs text-slate-200 font-mono overflow-hidden" style={{ margin: 0 }}>
              {comp.props.code || '// 代码'}</pre>
          </div>
        );
      case 'accordion':
        return (
          <motion.div
            type="button"
            style={{ ...baseStyle, background: 'rgba(6,182,212,0.2)', flexDirection: 'column', cursor: 'pointer' }}
            onClick={() => setAccordionStates(prev => ({ ...prev, [comp.id]: !prev[comp.id] }))}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between w-full px-2">
              <span className="text-cyan-300 text-sm font-medium">{comp.props.title || '点击展开'}</span>
              {isExpanded ? <ChevronUp size={14} className="text-cyan-400" /> : <ChevronDown size={14} className="text-cyan-400" />}
            </div>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-2 mt-2"
              >
                <span className="text-slate-300 text-xs">{comp.props.content || '内容'}</span>
              </motion.div>
            )}
          </motion.div>
        );
      case 'divider':
        return (
          <div style={{ ...baseStyle, background: 'transparent', justifyContent: 'flex-start' }}>
            <hr
              style={{
                width: '100%',
                border: 'none',
                borderTop: comp.props.style === 'dashed' ? '1px dashed' : '1px solid',
                borderColor: comp.props.color || '#ffffff'
              }}
            />
          </div>
        );
      default:
        return <div style={baseStyle}>?</div>;
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-900 flex flex-col"
    >
      {/* Header */}
      <div className="h-14 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full text-slate-300">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-white font-bold">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setCurrentStep(0)}
            className="p-2 hover:bg-white/10 rounded-full text-slate-300"
            title="重置"
          >
            <RotateCcw size={18} />
          </button>
          <button 
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-full ${isPlaying ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/10 text-slate-300'}`}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="h-12 bg-black/20 flex items-center justify-center gap-4 px-4">
        {['引入', '讲解', '练习'].map((name, idx) => (
          <div 
            key={`step-${idx}`}
            className={`px-4 py-1 rounded-full text-xs font-medium transition-colors ${
              idx === currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/5 text-slate-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden p-8">
        <div 
          className="w-full h-full rounded-xl relative"
          style={{ 
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        >
          {components.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500">
              <p>没有可预览的内容</p>
            </div>
          ) : (
            components.map(comp => (
              <div key={comp.id}>
                {renderComponent(comp)}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="h-16 bg-white/5 border-t border-white/10 flex items-center justify-center">
        <span className="text-slate-500 text-sm">
          步骤 {currentStep + 1} / 3
        </span>
      </div>
    </motion.div>
  );
}

export default PreviewView;
