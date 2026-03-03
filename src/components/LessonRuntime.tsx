import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Play, Pause, RotateCcw } from 'lucide-react';
import type { LessonSchemaV1, RuntimeNode } from '../types/lesson-schema';

interface LessonRuntimeProps {
  lesson: LessonSchemaV1;
  onBack: () => void;
}

type RuntimeVariables = Record<string, boolean | number | string>;

function createInitialVariables(lesson: LessonSchemaV1): RuntimeVariables {
  return lesson.variables.reduce<RuntimeVariables>((acc, variable) => {
    acc[variable.id] = variable.initial;
    return acc;
  }, {});
}

function toBoolean(value: boolean | number | string | undefined) {
  return value === true || value === 1 || value === 'true';
}

function computeBinarySum(node: Extract<RuntimeNode, { type: 'computed-number' }>, values: RuntimeVariables) {
  return node.props.sources.reduce((sum, source) => {
    return sum + (toBoolean(values[source.variableId]) ? source.weight : 0);
  }, 0);
}

export default function LessonRuntime({ lesson, onBack }: LessonRuntimeProps) {
  const [variables, setVariables] = useState<RuntimeVariables>(() => createInitialVariables(lesson));
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const timeline = lesson.timeline || [];
  const currentStep = timeline[stepIndex];
  const activeFocusNodeId = currentStep?.focusNodeId;

  useEffect(() => {
    setVariables(createInitialVariables(lesson));
    setStepIndex(0);
    setIsPlaying(false);
  }, [lesson.lessonId]);

  useEffect(() => {
    if (!isPlaying || timeline.length <= 1) return;

    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % timeline.length);
    }, 2200);

    return () => window.clearInterval(timer);
  }, [isPlaying, timeline.length]);

  const resetRuntime = () => {
    setVariables(createInitialVariables(lesson));
    setStepIndex(0);
    setIsPlaying(false);
  };

  const sortedNodes = useMemo(() => {
    return [...lesson.nodes].sort((a, b) => a.y - b.y || a.x - b.x);
  }, [lesson.nodes]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 flex flex-col h-screen p-4">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-white">{lesson.title}</h1>
              <p className="text-xs text-slate-400">{lesson.subtitle || `Schema v${lesson.schemaVersion}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={resetRuntime} className="p-2 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((v) => !v)}
              className="px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? '暂停讲解' : '自动讲解'}
            </button>
          </div>
        </header>

        <div className="border-b border-white/10 bg-black/20 px-6 py-3">
          {currentStep ? (
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm text-blue-300 font-semibold">{currentStep.title}</p>
                <p className="text-xs text-slate-400 mt-1">{currentStep.description}</p>
              </div>
              <div className="flex gap-2">
                {timeline.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setStepIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full ${idx === stepIndex ? 'bg-blue-400' : 'bg-slate-600 hover:bg-slate-500'}`}
                    title={step.title}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">该课件未定义时间轴，当前仅支持自由交互。</p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-950/70">
          <div className="min-w-[900px]">
            <div
              className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 to-slate-900"
              style={{ width: lesson.canvas.width, height: lesson.canvas.height }}
            >
              {sortedNodes.map((node) => {
                const isFocused = activeFocusNodeId === node.id;
                const baseStyle: React.CSSProperties = {
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                  transition: 'all .2s ease',
                };

                if (node.type === 'panel') {
                  return (
                    <div
                      key={node.id}
                      style={baseStyle}
                      className={`rounded-2xl border p-4 ${isFocused ? 'ring-2 ring-blue-400/70' : ''}`}
                    >
                      <div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: node.props.background || 'rgba(15,23,42,.65)',
                          borderColor: node.props.borderColor || 'rgba(148,163,184,.2)',
                          borderStyle: 'solid',
                          borderWidth: 1,
                        }}
                      />
                      {node.props.label && <span className="relative text-xs text-slate-300 font-semibold">{node.props.label}</span>}
                    </div>
                  );
                }

                if (node.type === 'text') {
                  return (
                    <div
                      key={node.id}
                      style={{
                        ...baseStyle,
                        color: node.props.color || '#cbd5e1',
                        fontSize: node.props.size || 16,
                        fontWeight: node.props.weight || 500,
                        textAlign: node.props.align || 'left',
                        textShadow: isFocused ? '0 0 18px rgba(59,130,246,.65)' : 'none',
                      }}
                    >
                      {node.props.content}
                    </div>
                  );
                }

                if (node.type === 'toggle') {
                  const isOn = toBoolean(variables[node.props.variableId]);
                  return (
                    <button
                      key={node.id}
                      type="button"
                      style={baseStyle}
                      onClick={() =>
                        setVariables((prev) => ({
                          ...prev,
                          [node.props.variableId]: !toBoolean(prev[node.props.variableId]),
                        }))
                      }
                      className={`rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                        isOn
                          ? 'bg-amber-400/20 border-amber-400/70 text-amber-300 shadow-[0_0_32px_rgba(251,191,36,.35)]'
                          : 'bg-black/40 border-white/15 text-slate-500'
                      } ${isFocused ? 'ring-2 ring-blue-400/70' : ''}`}
                    >
                      <span className="text-3xl leading-none">{isOn ? '💡' : '◌'}</span>
                      <span className="text-sm font-bold">{node.props.label}</span>
                      <span className="text-xs font-mono">{isOn ? '1' : '0'}</span>
                    </button>
                  );
                }

                if (node.type === 'computed-number') {
                  const value = computeBinarySum(node, variables);
                  return (
                    <div
                      key={node.id}
                      style={baseStyle}
                      className={`rounded-xl border border-blue-400/25 bg-blue-500/10 flex flex-col items-center justify-center ${
                        isFocused ? 'ring-2 ring-blue-400/70' : ''
                      }`}
                    >
                      <span className="text-xs text-blue-200 tracking-widest">{node.props.label}</span>
                      <span className="text-6xl font-semibold text-white mt-2">{value}</span>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
