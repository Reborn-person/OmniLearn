import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Home, Compass, BookOpen, User, Play, 
  ChevronLeft, Lightbulb, Sparkles, ChevronRight,
  Lock, Mail, ArrowRight, Cpu, Code2,
  Layout, PlusCircle, Settings, RotateCcw, Info,
  PlayCircle, PauseCircle, LogOut, Loader2, BookMarked, Clock, CheckCircle,
  Type, Image as ImageIcon, Video, MousePointer2, Network
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { coursesApi, aiApi, progressApi, lessonsApi } from './lib/api';
import BuilderView from './components/Builder';
import CourseDetailView from './components/CourseDetailView';
import LessonRuntime from './components/LessonRuntime';
import { binaryRuntimeLesson } from './content/lessons/binary-runtime-lesson';
import type { LessonSchemaV1 } from './types/lesson-schema';

type ViewState = 'login' | 'register' | 'dashboard' | 'lesson-cpu' | 'lesson-binary' | 'lesson-runtime' | 'builder' | 'course-detail' | 'my-courses' | 'lesson';

const GlassPanel = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void, key?: React.Key }) => (
  <div 
    onClick={onClick}
    className={`bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl ${className}`}
  >
    {children}
  </div>
);

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-slate-950 pointer-events-none">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[150px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
    <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-600/20 blur-[100px] animate-[pulse_12s_ease-in-out_infinite]" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay" />
  </div>
);

function LoginView({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@omnilearn.app');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="relative z-10 flex items-center justify-center min-h-screen p-4"
    >
      <GlassPanel className="w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/30 blur-[50px] rounded-full" />
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Compass className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">OmniLearn</h1>
          <p className="text-slate-400 mt-2 text-sm">探索万物，图解一切</p>
        </div>
        <div className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                placeholder="hello@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>登录 / Login <ArrowRight size={18} /></>}
          </button>
          <button 
            onClick={onSwitchToRegister}
            className="w-full mt-2 text-slate-400 text-sm hover:text-white transition-colors"
          >
            还没有账号？立即注册
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

interface Course { id: number; title: string; description: string; category: string; creator_name: string; lesson_count: number; is_ai_generated: number; }

function DashboardView({ onNavigate }: { onNavigate: (view: ViewState, courseId?: number, lessonId?: number) => void }) {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [stats, setStats] = useState({ totalCourses: 0, completedLessons: 0, totalLessons: 0, streak: 0 });

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    setLoading(true);
    const { data } = await coursesApi.getAll();
    if (data?.courses) {
      setCourses(data.courses);
      // Calculate stats
      let totalLessons = 0;
      let completedLessons = 0;
      for (const course of data.courses) {
        const prog = await progressApi.getCourseProgress(course.id);
        if (prog.data?.progress) {
          totalLessons += prog.data.progress.length;
          completedLessons += prog.data.progress.filter((p: any) => p.completed).length;
        }
      }
      setStats({ 
        totalCourses: data.courses.length, 
        completedLessons, 
        totalLessons,
        streak: Math.floor(Math.random() * 7) + 1 // Mock streak
      });
    }
    setLoading(false);
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    const { data } = await aiApi.generateCourse(aiTopic);
    if (data?.course) {
      await coursesApi.create(data.course.title, data.course.description || '', data.course.category || 'ai');
      await loadCourses();
      setAiTopic('');
    }
    setGenerating(false);
  };


  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex h-screen overflow-hidden">
      <GlassPanel className="w-64 h-[calc(100vh-32px)] m-4 flex flex-col rounded-3xl border-white/10">
        <div className="h-20 flex items-center px-6 gap-3 border-b border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Compass className="text-white" size={18} />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">OmniLearn</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <button onClick={() => onNavigate('dashboard')} className="w-full flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/5 shadow-inner">
            <Home size={20} className="text-blue-400" /> <span>学习大厅</span>
          </button>
          <button onClick={() => onNavigate('my-courses')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
            <BookOpen size={20} /> <span>我的课程</span>
          </button>
          <div className="my-4 border-t border-white/5 pt-4">
            <span className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">创作者中心</span>
          </div>
          <button onClick={() => onNavigate('builder')} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors group">
            <Layout size={20} className="group-hover:text-purple-400 transition-colors" /> <span>构建内容 (Creator)</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center border border-white/10">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">Lv.{user?.level || 1} 探索者</p>
            </div>
            <button onClick={logout} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </GlassPanel>

      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar p-4 pl-0">
        <GlassPanel className="h-16 flex items-center justify-between px-6 mb-6 rounded-2xl">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="搜索任何你想学习的知识..." className="w-full bg-black/20 border border-white/5 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-all" />
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 mb-6 border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="text-purple-400" size={24} />
            <h3 className="text-lg font-bold text-white">智能创建课程</h3>
          </div>
          <div className="flex gap-3">
            <input type="text" placeholder="输入你想学习的主题，例如：Python 基础、数据结构入门..." value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="flex-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500" />
            <button onClick={handleAiGenerate} disabled={generating || !aiTopic.trim()} className="px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
              {generating ? <Loader2 className="animate-spin" size={18} /> : '生成'}
            </button>
          </div>
        </GlassPanel>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <GlassPanel className="p-4 text-center">
            <div className="text-3xl font-bold text-white">{stats.totalCourses}</div>
            <div className="text-xs text-slate-400 mt-1">课程总数</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <div className="text-3xl font-bold text-emerald-400">{stats.completedLessons}</div>
            <div className="text-xs text-slate-400 mt-1">已完成课时</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%</div>
            <div className="text-xs text-slate-400 mt-1">学习进度</div>
          </GlassPanel>
          <GlassPanel className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{stats.streak} 🔥</div>
            <div className="text-xs text-slate-400 mt-1">连续学习</div>
          </GlassPanel>
        </div>


        <GlassPanel onClick={() => onNavigate('lesson-cpu', 1)} className="relative overflow-hidden p-8 mb-8 cursor-pointer group hover:border-blue-500/30 transition-all">
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-4">
              <Cpu size={14} /> <span>经典图解模式</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">CPU 指令周期 (Fetch-Decode-Execute)</h3>
            <p className="text-slate-300 mb-6">深入计算机的心脏，直观感受控制单元、算术逻辑单元和内存是如何协同工作的。</p>
            <div className="flex items-center gap-4">
              <div className="w-64 h-2 bg-black/40 rounded-full overflow-hidden">
                <div className="w-[60%] h-full bg-blue-500 rounded-full" />
              </div>
              <span className="text-sm text-slate-400 font-medium">已完成 60%</span>
            </div>
          </div>
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300 shadow-xl">
            <Play size={24} fill="currentColor" className="text-white ml-1" />
          </div>
        </GlassPanel>

        <h2 className="text-xl font-bold text-white mb-4 px-2">推荐探索</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-400" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <GlassPanel key={course.id} onClick={() => onNavigate('course-detail', course.id)} className="p-6 cursor-pointer group hover:border-blue-500/30 transition-all flex flex-col">
                <h4 className="text-lg font-bold text-white mb-2">{course.title}</h4>
                <p className="text-sm text-slate-400 flex-1 mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>by {course.creator_name || 'System'}</span>
                  <span>{course.lesson_count} 课时</span>
                </div>
              </GlassPanel>
            ))}
            <GlassPanel onClick={() => onNavigate('lesson-binary', 2)} className="p-6 cursor-pointer group hover:border-amber-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Lightbulb size={24} />
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
                <Sparkles size={12} /> 互动沙盘
              </div>
              <h4 className="text-lg font-bold text-white mb-2">万物皆数：二进制</h4>
              <p className="text-sm text-slate-400 flex-1">亲手点亮灯泡，理解计算机底层的 0 和 1 是如何组合出整个世界的。</p>
            </GlassPanel>
            <GlassPanel onClick={() => onNavigate('lesson-runtime')} className="p-6 cursor-pointer group hover:border-cyan-500/30 transition-all flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
                <Network size={24} />
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                <Sparkles size={12} /> Runtime Engine
              </div>
              <h4 className="text-lg font-bold text-white mb-2">数据驱动课件（JSON）</h4>
              <p className="text-sm text-slate-400 flex-1">由 Lesson Schema 渲染，不依赖手写页面逻辑。用于验证“引擎化”路线。</p>
            </GlassPanel>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CpuLessonView({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const steps = [
    { phase: 'Fetch (取指)', desc: 'CPU 从内存 (RAM) 中读取下一条指令。', active: 'ram-to-cpu' },
    { phase: 'Decode (译码)', desc: '控制单元 (CU) 解析指令，决定需要执行什么操作。', active: 'cu' },
    { phase: 'Execute (执行)', desc: '算术逻辑单元 (ALU) 执行计算或数据处理。', active: 'alu' },
    { phase: 'Store (写回)', desc: '将计算结果写回到寄存器或内存中。', active: 'cpu-to-ram' }
  ];

  useEffect(() => {
    let timer: number;
    if (isPlaying) timer = window.setTimeout(() => setStep((s) => (s + 1) % steps.length), 2000);
    return () => clearTimeout(timer);
  }, [isPlaying, step]);

  const current = steps[step];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex flex-col h-screen p-4">
      <GlassPanel className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><ChevronLeft size={20} /></button>
            <div><h1 className="font-bold text-white">CPU 指令周期 (Fetch-Decode-Execute)</h1><p className="text-xs text-slate-400">计算机组成原理 · 核心概念</p></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(0)} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10"><RotateCcw size={16} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg text-sm font-medium backdrop-blur-md border border-blue-400/30">
              {isPlaying ? <PauseCircle size={18} /> : <PlayCircle size={18} />}{isPlaying ? '暂停' : '自动播放'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative p-8">
          <div className="relative w-full max-w-4xl h-[400px] flex items-center justify-between px-12">
            <GlassPanel className={`relative w-72 h-80 p-5 flex flex-col gap-4 transition-all duration-500 ${current.active === 'cu' || current.active === 'alu' ? 'border-blue-400/50 shadow-[0_0_40px_rgba(96,165,250,0.2)]' : 'border-white/10'}`}>
              <div className="absolute -top-3 left-6 bg-slate-900 px-3 py-0.5 rounded-full border border-white/10 text-xs font-bold text-slate-300 tracking-widest shadow-lg">CPU (中央处理器)</div>
              <div className={`flex-1 border rounded-xl p-4 flex flex-col items-center justify-center transition-colors ${current.active === 'cu' ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-inner' : 'border-white/10 text-slate-400 bg-black/20'}`}>
                <Cpu size={32} className="mb-2" /><span className="font-bold">Control Unit (CU)</span><span className="text-xs mt-1 opacity-80">控制单元 / 译码</span>
              </div>
              <div className={`flex-1 border rounded-xl p-4 flex flex-col items-center justify-center transition-colors ${current.active === 'alu' ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-300 shadow-inner' : 'border-white/10 text-slate-400 bg-black/20'}`}>
                <Code2 size={32} className="mb-2" /><span className="font-bold">ALU</span><span className="text-xs mt-1 opacity-80">算术逻辑单元 / 执行</span>
              </div>
              <div className="h-12 border border-white/10 bg-black/20 rounded-xl flex items-center justify-center text-slate-400 text-sm font-mono">Registers (寄存器)</div>
            </GlassPanel>

            <div className="flex-1 flex flex-col items-center justify-center relative h-full px-6">
              <div className="w-full h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                <AnimatePresence>
                  {current.active === 'ram-to-cpu' && <motion.div initial={{ left: '100%' }} animate={{ left: '-10%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -translate-y-1/2 w-16 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-[2px]" />}
                  {current.active === 'cpu-to-ram' && <motion.div initial={{ left: '-10%' }} animate={{ left: '100%' }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -translate-y-1/2 w-16 h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent blur-[2px]" />}
                </AnimatePresence>
              </div>
              <span className="text-xs text-slate-500 mt-3 font-mono tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">SYSTEM BUS</span>
            </div>

            <GlassPanel className={`relative w-56 h-80 p-5 flex flex-col transition-all duration-500 ${current.active === 'ram-to-cpu' || current.active === 'cpu-to-ram' ? 'border-purple-400/50 shadow-[0_0_40px_rgba(192,132,252,0.2)]' : 'border-white/10'}`}>
              <div className="absolute -top-3 left-6 bg-slate-900 px-3 py-0.5 rounded-full border border-white/10 text-xs font-bold text-slate-300 tracking-widest shadow-lg">MEMORY (内存)</div>
              <div className="flex-1 flex flex-col gap-3 mt-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-12 border rounded-lg flex items-center px-3 font-mono text-xs transition-colors ${i === 2 && current.active === 'ram-to-cpu' ? 'border-blue-400/50 bg-blue-400/20 text-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.3)]' : 'border-white/5 bg-black/20 text-slate-500'}`}>
                    0x00{i} {i === 2 && current.active === 'ram-to-cpu' ? '-> LOAD A, 5' : '...'}
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>

        <div className="h-48 border-t border-white/10 bg-black/20 p-8 flex flex-col items-center">
          <div className="w-full max-w-3xl">
            <div className="flex items-center justify-between mb-6 relative">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10 -z-10" />
              {steps.map((s, i) => (
                <div key={i} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 ${i === step ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' : 'bg-slate-800 border border-white/10 text-slate-400'}`}>
                  {i + 1}. {s.phase.split(' ')[0]}
                </div>
              ))}
            </div>
            <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 items-start bg-white/5 p-4 rounded-xl border border-white/10">
              <Info className="text-blue-400 shrink-0 mt-0.5" size={20} />
              <div><h3 className="text-lg font-bold text-white mb-1">{current.phase}</h3><p className="text-slate-300">{current.desc}</p></div>
            </motion.div>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

function BinaryLessonView({ onBack }: { onBack: () => void }) {
  const [bits, setBits] = useState([0, 0, 0, 0, 0, 0, 0, 0]);
  const decimalValue = bits.reduce((acc, bit, index) => acc + bit * Math.pow(2, 7 - index), 0);
  const toggleBit = (index: number) => { const newBits = [...bits]; newBits[index] = newBits[index] === 0 ? 1 : 0; setBits(newBits); };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex flex-col h-screen p-4">
      <GlassPanel className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><ChevronLeft size={20} /></button>
            <div><h1 className="font-bold text-white">万物皆数：二进制的本质</h1><p className="text-xs text-slate-400">互动沙盘模式</p></div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 tracking-wider">互动中</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="mb-16 flex flex-col items-center">
            <span className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-2 bg-black/40 px-4 py-1 rounded-full border border-white/5">当前十进制数值</span>
            <motion.div key={decimalValue} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-8xl font-light tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              {decimalValue}
            </motion.div>
          </div>

          <div className="flex gap-3 sm:gap-6">
            {bits.map((bit, index) => {
              const power = 7 - index;
              const value = Math.pow(2, power);
              const isOn = bit === 1;
              return (
                <div key={index} className="flex flex-col items-center gap-4">
                  <span className="text-slate-500 font-mono text-xs">{value}</span>
                  <button onClick={() => toggleBit(index)} className={`relative w-14 h-20 sm:w-16 sm:h-24 rounded-full border transition-all duration-300 flex items-center justify-center group ${isOn ? 'bg-amber-400/20 border-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.4)] backdrop-blur-md' : 'bg-black/40 border-white/10 hover:border-white/30 backdrop-blur-sm'}`}>
                    <Lightbulb size={isOn ? 32 : 24} className={`transition-all duration-300 ${isOn ? 'text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'text-slate-600'}`} fill={isOn ? "currentColor" : "none"} />
                  </button>
                  <span className={`font-mono text-xl font-bold transition-colors ${isOn ? 'text-amber-400' : 'text-slate-600'}`}>{bit}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-40 border-t border-white/10 bg-black/20 p-8 flex flex-col items-center justify-center">
          <div className="max-w-2xl text-center">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-center gap-2"><Sparkles className="text-amber-400" size={20} /> 动手尝试</h3>
            <p className="text-slate-300">点击上方的灯泡开关。每一个亮起的灯泡代表一个二进制的 1，它的数值会被累加到总和中。试着组合出你喜欢的数字吧！</p>
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

function MyCoursesView({ onBack, onNavigate }: { onBack: () => void; onNavigate: (view: ViewState, courseId?: number, lessonId?: number) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<number, { completed: number; total: number }>>({});

  useEffect(() => { loadMyCourses(); }, []);

  const loadMyCourses = async () => {
    setLoading(true);
    const { data } = await coursesApi.getAll();
    if (data?.courses) {
      setCourses(data.courses);
      const progressData: Record<number, { completed: number; total: number }> = {};
      for (const course of data.courses) {
        const prog = await progressApi.getCourseProgress(course.id);
        if (prog.data?.progress) {
          const completed = prog.data.progress.filter((p: any) => p.completed).length;
          progressData[course.id] = { completed, total: prog.data.progress.length };
        }
      }
      setProgress(progressData);
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex flex-col h-screen p-4">
      <GlassPanel className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center px-6 bg-black/20">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors"><ChevronLeft size={20} /></button>
          <div className="ml-4 flex items-center gap-2"><BookMarked size={20} className="text-blue-400" /><h1 className="font-bold text-white">我的课程</h1></div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-blue-400" size={32} /></div>
          ) : courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500"><BookOpen size={48} className="mb-4 opacity-50" /><p className="text-lg mb-2">还没有课程</p><p className="text-sm">开始学习或创建新课程吧！</p></div>
          ) : (
            <div className="space-y-4">
              {courses.map(course => {
                const prog = progress[course.id] || { completed: 0, total: course.lesson_count || 1 };
                const percent = prog.total > 0 ? (prog.completed / prog.total) * 100 : 0;
                return (
                  <GlassPanel key={course.id} onClick={() => onNavigate('course-detail', course.id)} className="p-4 cursor-pointer group hover:border-blue-500/30 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10"><BookOpen size={24} className="text-blue-400" /></div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{course.title}</h3>
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${percent}%` }} /></div>
                          <span className="text-xs text-slate-400">{prog.completed}/{prog.total} 课时</span>
                          {prog.completed === prog.total && prog.total > 0 && <CheckCircle size={16} className="text-emerald-400" />}
                        </div>
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          )}
        </div>
      </GlassPanel>
    </motion.div>
  );
}



// Python Interactive Lesson View
function PythonLessonView({ lessonId, onBack }: { lessonId: number; onBack: () => void }) {
  const [lesson, setLesson] = useState<any>(null);
  const [runtimeSchema, setRuntimeSchema] = useState<LessonSchemaV1 | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLesson(); }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    const { data } = await lessonsApi.getById(lessonId);
    if (data?.lesson) {
      setLesson(data.lesson);
      const content = typeof data.lesson.content === 'string'
        ? JSON.parse(data.lesson.content || '{}')
        : data.lesson.content || {};

      if (content.schemaVersion === '1.0' && Array.isArray(content.nodes)) {
        setRuntimeSchema(content as LessonSchemaV1);
      } else {
        setRuntimeSchema(null);
      }

      if (content.blocks) {
        const codeBlock = content.blocks.find((b: any) => b.type === 'code');
        if (codeBlock) setCode(codeBlock.content || '');
      }
    }
    setLoading(false);
  };

  const runCode = () => {
    const lines: string[] = [];
    try {
      const codeLines = code.split('\n');
      codeLines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('print(')) {
          const match = trimmed.match(/print\(["'](.*)["']\)/);
          if (match) lines.push(match[1]);
          else {
            const varMatch = trimmed.match(/print\((.*)\)/);
            if (varMatch) lines.push(varMatch[1]);
          }
        }
      });
      if (lines.length === 0) lines.push('[运行完成，无输出]');
    } catch (e) {
      lines.push('错误: ' + String(e));
    }
    setOutput(lines);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-400" size={48} />
    </div>
  );

  if (runtimeSchema) {
    return <LessonRuntime lesson={runtimeSchema} onBack={onBack} />;
  }

  const content = lesson ? JSON.parse(lesson.content || '{}') : {};
  const blocks = content.blocks || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex flex-col h-screen p-4">
      <GlassPanel className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center px-6 bg-black/20">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="ml-4">
            <h1 className="font-bold text-white">{lesson?.title || '课程'}</h1>
            <p className="text-xs text-slate-400">Python 互动课堂</p>
          </div>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl">
              {blocks.map((block: any, i: number) => (
                <div key={i} className="mb-6">
                  {block.type === 'heading' && <h2 className="text-2xl font-bold text-white mb-4">{block.content}</h2>}
                  {block.type === 'text' && <p className="text-slate-300 leading-relaxed mb-3">{block.content}</p>}
                  {block.type === 'code' && <pre className="bg-slate-900/80 border border-white/10 rounded-xl p-4 text-sm font-mono text-emerald-400 overflow-x-auto">{block.content}</pre>}
                  {block.type === 'divider' && <hr className="border-white/10 my-6" />}
                </div>
              ))}
            </div>
          </div>
          <div className="w-1/2 border-l border-white/10 bg-black/20 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-bold text-white">代码练习</h3>
              <p className="text-xs text-slate-400">修改并运行代码</p>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 bg-slate-900/50 border-0 p-4 font-mono text-sm text-blue-300 resize-none focus:outline-none"
              placeholder="输入Python代码..."
            />
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button onClick={runCode} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2">
                <Play size={16} /> 运行代码
              </button>
              <button onClick={() => setCode('')} className="px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg">清空</button>
            </div>
            {output.length > 0 && (
              <div className="p-4 border-t border-white/10 bg-slate-900/80 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-bold text-slate-400 mb-2">输出:</h4>
                {output.map((line, i) => <pre key={i} className="text-sm text-white font-mono">{line}</pre>)}
              </div>
            )}
          </div>
        </div>
      </GlassPanel>
    </motion.div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(0);


  useEffect(() => { if (!loading && user) setCurrentView('dashboard'); }, [user, loading]);

  const handleNavigate = (view: ViewState, courseId?: number, lessonId?: number) => {
    if (courseId !== undefined) setSelectedCourseId(courseId);
    if (lessonId !== undefined) setSelectedLessonId(lessonId);
    setCurrentView(view);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-400" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500/30 text-slate-200">
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        {!user && currentView === 'login' && <LoginView onSwitchToRegister={() => setCurrentView('register')} />}
        {user && currentView === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
        {user && currentView === 'my-courses' && <MyCoursesView onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />}
        {user && currentView === 'lesson-cpu' && <CpuLessonView onBack={() => setCurrentView('dashboard')} />}
        {user && currentView === 'lesson-binary' && <BinaryLessonView onBack={() => setCurrentView('dashboard')} />}
        {user && currentView === 'lesson-runtime' && <LessonRuntime lesson={binaryRuntimeLesson} onBack={() => setCurrentView('dashboard')} />}
        {user && currentView === 'builder' && <BuilderView onBack={() => setCurrentView('dashboard')} />}
        {user && currentView === 'course-detail' && <CourseDetailView courseId={selectedCourseId} onBack={() => setCurrentView('dashboard')} onNavigate={handleNavigate} />}
        {user && currentView === 'lesson' && selectedLessonId > 0 && <PythonLessonView lessonId={selectedLessonId} onBack={() => setCurrentView('course-detail')} />}
      </AnimatePresence>
    </div>
  );
}
