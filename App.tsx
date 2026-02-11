
import React, { useState, useEffect } from 'react';
import { QUESTIONS, LOADING_MESSAGES } from './constants';
import { UserAnswer, AnalysisResult } from './types';
import { analyzeStartupIdea, validateApiKey } from './services/gemini';

const App: React.FC = () => {
  const [step, setStep] = useState<'checking_api' | 'intro' | 'quiz' | 'loading' | 'result'>('checking_api');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [currentInputValue, setCurrentInputValue] = useState('');
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const performCheck = async () => {
    setApiError(null);
    setStep('checking_api');
    
    const { valid, error } = await validateApiKey();
    if (valid) {
      setStep('intro');
    } else {
      setApiError(error || "Не удалось инициализировать API.");
    }
  };

  useEffect(() => {
    performCheck();
  }, []);

  useEffect(() => {
    if (step === 'loading') {
      const interval = setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [step]);

  const startQuiz = () => {
    setStep('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentInputValue('');
    setError(null);
  };

  const handleNext = () => {
    if (!currentInputValue.trim()) return;

    const newAnswer: UserAnswer = {
      questionId: QUESTIONS[currentQuestionIndex].id,
      questionText: QUESTIONS[currentQuestionIndex].text,
      answer: currentInputValue
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setCurrentInputValue('');

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      processAnalysis(updatedAnswers);
    }
  };

  const processAnalysis = async (finalAnswers: UserAnswer[]) => {
    setStep('loading');
    try {
      const analysis = await analyzeStartupIdea(finalAnswers);
      setResult(analysis);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Ошибка при генерации разбора.');
      setStep('intro');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#0a0a0a]">
      <div className="max-w-3xl w-full">
        
        {step === 'checking_api' && !apiError && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Инициализация нейронов...</p>
          </div>
        )}

        {apiError && (
          <div className="error-container bg-[#1a0505] p-8 md:p-12 space-y-8 animate-in zoom-in duration-300">
            <h1 className="text-4xl font-black text-red-500 uppercase glitch-text text-center">API НЕ ОТВЕЧАЕТ</h1>
            
            <div className="space-y-4 bg-black p-6 border border-red-500/30">
              <p className="text-red-200 font-bold text-lg leading-relaxed">
                {apiError}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-black uppercase text-sm text-gray-500 tracking-widest">Инструкция для исправления:</h3>
              <ol className="list-decimal list-inside text-gray-400 space-y-2 font-bold text-sm">
                <li>Убедись, что в Vercel переменная называется <code className="text-white bg-gray-800 px-1">API_KEY</code>.</li>
                <li>Зайди в Dashboard проекта на Vercel → вкладка <span className="text-white">Deployments</span>.</li>
                <li>Нажми на <span className="text-white">три точки (⋮)</span> рядом с последним деплоем.</li>
                <li>Выбери <span className="text-red-400">Redeploy</span>. Это критично! Без этого код не увидит переменную.</li>
              </ol>
            </div>
            
            <button 
              onClick={performCheck}
              className="w-full neo-brutalism-btn bg-white text-black py-4 font-black uppercase hover:bg-gray-200 transition-colors"
            >
              Я ВСЕ СДЕЛАЛ, ПРОВЕРЬ ЕЩЕ РАЗ
            </button>
          </div>
        )}

        {step === 'intro' && (
          <div className="text-center space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <header className="space-y-4">
               <h1 className="text-5xl md:text-7xl font-black uppercase glitch-text italic leading-none">
                РЕАЛИТИ ЧЕК
              </h1>
              <p className="text-xl text-gray-400 font-bold tracking-tight">
                Бизнес-инкубатор для тех, кто устал от розовых очков.
              </p>
            </header>

            <div className="neo-brutalism-border bg-[#111] p-8 text-left border-l-[12px] border-l-yellow-400">
              <p className="text-lg leading-relaxed font-bold">
                У тебя есть идея? Отлично. У 99% людей она тоже есть. 
                Наш ИИ-инвестор разберет твой проект с токсичностью бывшего и точностью хирурга. 
                Готов узнать, стоит ли твоя затея хотя бы пачки сухариков?
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border-2 border-red-600 p-4 text-red-200 font-bold">
                КРИТИЧЕСКАЯ ОШИБКА: {error}
              </div>
            )}

            <button 
              onClick={startQuiz}
              className="neo-brutalism-btn bg-white text-black px-12 py-5 text-3xl font-black uppercase hover:bg-yellow-400 hover:text-black transition-all"
            >
              УНИЗИТЬ МОЮ ИДЕЮ
            </button>
          </div>
        )}

        {step === 'quiz' && (
          <div className="neo-brutalism-border bg-[#111] p-6 md:p-12 space-y-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">
                Этап {currentQuestionIndex + 1} / {QUESTIONS.length}
              </span>
              <div className="h-3 w-40 bg-gray-900 border border-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 transition-all duration-500 shadow-[0_0_10px_#facc15]" 
                  style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-black leading-tight uppercase italic">
              {QUESTIONS[currentQuestionIndex].text}
            </h2>
            
            <textarea
              value={currentInputValue}
              onChange={(e) => setCurrentInputValue(e.target.value)}
              placeholder={QUESTIONS[currentQuestionIndex].placeholder}
              className="w-full h-48 bg-black border-4 border-gray-800 p-6 text-white focus:border-white outline-none resize-none text-xl font-bold placeholder:text-gray-700 transition-all"
              autoFocus
            />

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleNext}
                disabled={!currentInputValue.trim()}
                className={`neo-brutalism-btn px-12 py-4 text-2xl font-black uppercase transition-all ${
                  !currentInputValue.trim() ? 'opacity-30 grayscale cursor-not-allowed bg-gray-600' : 'bg-white text-black hover:bg-yellow-400'
                }`}
              >
                {currentQuestionIndex === QUESTIONS.length - 1 ? 'УЗНАТЬ СУДЬБУ' : 'ДАЛЬШЕ'}
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center space-y-12 py-20">
            <div className="relative inline-block scale-150">
              <div className="w-16 h-16 border-8 border-white border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xs">AI</div>
            </div>
            <p className="text-3xl font-black uppercase italic animate-pulse tracking-tighter text-yellow-400">
              {loadingMessage}
            </p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-32">
            <div className="text-center border-b-8 border-white pb-8">
              <h1 className="text-5xl md:text-7xl font-black uppercase glitch-text italic">
                {result.title}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="neo-brutalism-border bg-[#111] p-8 border-l-[12px] border-l-pink-500">
                <h3 className="text-2xl font-black uppercase mb-6 text-pink-500 italic">Честный вердикт</h3>
                <p className="text-xl leading-relaxed font-bold text-gray-200">
                  {result.verdict}
                </p>
              </div>

              <div className="neo-brutalism-border bg-[#111] p-8 border-l-[12px] border-l-cyan-400">
                <h3 className="text-2xl font-black uppercase mb-6 text-cyan-400 italic">Стек / Инструменты</h3>
                <ul className="space-y-4 font-bold text-lg">
                  {result.techStack.map((tech, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <span className="text-cyan-400 mt-1">█</span>
                      <span>{tech}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="neo-brutalism-border bg-[#111] p-8 border-l-[12px] border-l-green-400">
                <h3 className="text-2xl font-black uppercase mb-6 text-green-400 italic">Как рубить бабло</h3>
                <p className="text-xl font-bold text-gray-200 leading-relaxed">
                  {result.monetization}
                </p>
              </div>

              <div className="neo-brutalism-border bg-red-950/20 p-8 border-red-600 border-l-[12px] border-l-red-600">
                <h3 className="text-2xl font-black uppercase mb-6 text-red-500 italic">Риски (Твой провал)</h3>
                <ul className="space-y-3 font-bold text-lg text-gray-300">
                  {result.risks.map((risk, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="text-red-600">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="neo-brutalism-border bg-white text-black p-10">
              <h3 className="text-4xl font-black uppercase mb-10 text-center italic tracking-tighter">
                План действий (бегом марш!):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.nextSteps.map((step, i) => (
                  <div key={i} className="border-4 border-black p-6 flex flex-col items-center text-center hover:bg-black hover:text-white transition-all cursor-default">
                    <span className="text-6xl font-black mb-4 opacity-20">{i + 1}</span>
                    <p className="text-lg font-black uppercase">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-16 space-y-12">
              <p className="text-3xl font-black italic uppercase text-gray-500 max-w-2xl mx-auto leading-tight">
                "{result.sarcasticComment}"
              </p>
              <button 
                onClick={() => setStep('intro')}
                className="neo-brutalism-btn bg-black text-white px-12 py-5 text-2xl font-black uppercase hover:bg-white hover:text-black border-white"
              >
                У МЕНЯ ЕЩЕ ЕСТЬ ИДЕЯ!
              </button>
            </div>
          </div>
        )}
      </div>
      
      <footer className="fixed bottom-6 right-6 text-xs font-black text-gray-700 uppercase tracking-[0.5em] pointer-events-none">
        DESIGNED FOR DISRUPTION
      </footer>
    </div>
  );
};

export default App;
