import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { coursesApi, lessonsApi, progressApi } from '../lib/api';

const GlassPanel = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-2xl ${className}`}
  >
    {children}
  </div>
);

interface Lesson {
  id: number;
  title: string;
  description: string;
  lesson_type: string;
  order_index: number;
}

interface CourseDetailViewProps {
  courseId: number;
  onBack: () => void;
  onNavigate: (view: string, courseId?: number, lessonId?: number) => void;
}

export function CourseDetailView({ courseId, onBack, onNavigate }: CourseDetailViewProps) {
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<number, { completed: boolean; score?: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    const { data: courseData } = await coursesApi.getById(courseId);
    if (courseData?.course) {
      setCourse(courseData.course);
    }
    const { data: lessonsData } = await lessonsApi.getByCourse(courseId);
    if (lessonsData?.lessons) {
      setLessons(lessonsData.lessons);
    }
    const { data: progressData } = await progressApi.getCourseProgress(courseId);
    if (progressData?.progress) {
      const progressMap: Record<number, { completed: boolean; score?: number }> = {};
      progressData.progress.forEach((p: any) => {
        progressMap[p.lesson_id] = { completed: p.completed, score: p.score };
      });
      setProgress(progressMap);
    }
    setLoading(false);
  };

  const totalLessons = lessons.length;
  const completedLessons = (Object.values(progress) as Array<{ completed: boolean; score?: number }>).filter((p) => p.completed).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const getLessonTypeLabel = (type: string) => {
    if (type === 'interactive') return '互动';
    if (type === 'diagram') return '图解';
    if (type === 'text') return '图文';
    if (type === 'runtime') return 'Runtime';
    return '视频';
  };

  const getLessonTypeColor = (type: string) => {
    if (type === 'interactive') return 'bg-amber-500/20 text-amber-400';
    if (type === 'diagram') return 'bg-purple-500/20 text-purple-400';
    if (type === 'text') return 'bg-blue-500/20 text-blue-400';
    if (type === 'runtime') return 'bg-cyan-500/20 text-cyan-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 flex flex-col h-screen p-4">
      <GlassPanel className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-white/10 flex items-center px-6 bg-black/20">
          <button type="button" onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-slate-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-400" />
            <h1 className="font-bold text-white">{course?.title || '课程详情'}</h1>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-400" size={32} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-4">
                <Sparkles size={14} /> <span>{course?.category || '未分类'}</span>
              </div>
              <p className="text-slate-300 mb-6">{course?.description || '暂无描述'}</p>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">学习进度</span>
                  <span className="text-sm font-bold text-white">{progressPercent}%</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{completedLessons} / {totalLessons} 课时已完成</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-white mb-4">课程内容</h2>
            {lessons.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>暂无课时内容</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, index) => {
                  const lessonProgress = progress[lesson.id] || { completed: false };
                  return (
                    <div 
                      key={lesson.id}
                      onClick={() => onNavigate('lesson', courseId, lesson.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer group ${

                        lessonProgress.completed 
                          ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400' 
                          : 'bg-white/5 border-white/10 hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                          lessonProgress.completed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {lessonProgress.completed ? <CheckCircle size={18} /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-1">{lesson.title}</h3>
                          <p className="text-sm text-slate-400">{lesson.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getLessonTypeColor(lesson.lesson_type)}`}>
                            {getLessonTypeLabel(lesson.lesson_type)}
                          </span>
                          <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  );
}

export default CourseDetailView;
