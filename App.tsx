
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

  const checkApi = async () => {
    setApiError(null);
    setStep('checking_api');
    
    // Сначала проверяем стандартный process.env
    const { valid, error } = await validateApiKey();
    if (valid) {
      setStep('intro');
      return;
    }

    // Если ключа нет в окружении, проверяем, не находимся ли мы в среде AI Studio
    const aiStudio = (window as any).aistudio;
    if (aiStudio && typeof aiStudio.hasSelectedApiKey === 'function') {
      const hasKey = await aiStudio.hasSelectedApiKey();
      if (hasKey) {
        setStep('intro');
      } else {
        setApiError("Нужно выбрать API ключ в настройках среды или через кнопку ниже.");
      }
    } else {
      setApiError(error || "Проблема с доступом к API Gemini.");
    }
  };

  useEffect(() => {
    checkApi();
  }, []);

  const handleOpenSelectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio && typeof aiStudio.openSelectKey === 'function') {
      await aiStudio.openSelectKey();
      // После открытия диалога считаем, что ключ будет выбран, и пробуем запустить приложение
      setStep('intro');
    }
  };

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
      setError(err.message || 'Что-то пошло по пизде...');
      setStep('intro');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-3xl w-full">
        
        {step === 'checking_api' && !apiError && (
          <div className="text-center space-y-6">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Проверяем связь с космосом...</p>
          </div>
        )}

        {apiError && (
          <div className="neo-brutalism-border bg-red-900/40 p-10 space-y-6 text-center">
            <h1 className="text-4xl font-black text-red-500 uppercase glitch-text">ПРОБЛЕМА С API</h1>
            <div className="bg-black p-6 border-2 border-red-500 text-left">
              <p className="text-xl font-bold text-red-200 leading-relaxed">
                {apiError}
              </p>
            </div>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={checkApi}
                className="neo-brutalism-btn bg-white text-black px-8 py-3 font-black uppercase hover:bg-gray-200"
              >
                ПОВТОРИТЬ ПРОВЕРКУ
              </button>
              
              {(window as any).aistudio && (
                <button 
                  onClick={handleOpenSelectKey}
                  className="neo-brutalism-btn bg-blue-600 text-white px-8 py-3 font-black uppercase"
                >
                  ВЫБРАТЬ API КЛЮЧ
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 font-bold uppercase mt-4">
              Подсказка для Vercel: Убедись, что переменная называется API_KEY и ты сделал новый Deploy после её добавления.
            </p>
          </div>
        )}

        {step === 'intro' && (
          <div className="text-center space-y-8 animate-in fade-in duration-700">
            <h1 className="text-4xl md:text-6xl font-extrabold uppercase glitch-text mb-4 italic">
              У меня тут идея есть но я не ебу как это реализовать!
            </h1>
            <p className="text-xl text-gray-400 font-bold border-l-4 border-white pl-4 text-left">
              Заебало слушать "гениальные" бизнес-идеи за пивом? Пройди этот тест, и наш ИИ-консультант 
              объяснит тебе, почему твой проект — это либо будущий рынок, либо полная хуйня. 
            </p>
            {error && (
              <div className="bg-red-900/50 border-2 border-red-500 p-4 text-red-200 font-bold mb-4">
                ОШИБКА: {error}
              </div>
            )}
            <button 
              onClick={startQuiz}
              className="neo-brutalism-btn bg-white text-black px-8 py-4 text-2xl font-black uppercase hover:bg-gray-200"
            >
              ПОГНАЛИ, БЛЯТЬ!
            </button>
          </div>
        )}

        {step === 'quiz' && (
          <div className="neo-brutalism-border bg-[#111] p-6 md:p-10 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold uppercase tracking-widest text-gray-500">
                Вопрос {currentQuestionIndex + 1} из {QUESTIONS.length}
              </span>
              <div className="h-2 w-32 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300" 
                  style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold leading-tight">
              {QUESTIONS[currentQuestionIndex].text}
            </h2>
            
            <textarea
              value={currentInputValue}
              onChange={(e) => setCurrentInputValue(e.target.value)}
              placeholder={QUESTIONS[currentQuestionIndex].placeholder}
              className="w-full h-40 bg-black border-2 border-gray-700 p-4 text-white focus:border-white outline-none resize-none text-lg"
              autoFocus
            />

            <div className="flex justify-end">
              <button 
                onClick={handleNext}
                disabled={!currentInputValue.trim()}
                className={`neo-brutalism-btn px-10 py-3 text-xl font-bold uppercase ${
                  !currentInputValue.trim() ? 'opacity-50 cursor-not-allowed bg-gray-600' : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {currentQuestionIndex === QUESTIONS.length - 1 ? 'ФИНАЛИМ' : 'ДАЛЕЕ'}
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center space-y-10 py-20">
            <div className="relative inline-block">
              <div className="w-24 h-24 border-8 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-3xl font-black uppercase italic animate-pulse">
              {loadingMessage}
            </p>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-black uppercase glitch-text mb-6">
                {result.title}
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="neo-brutalism-border bg-[#111] p-6">
                <h3 className="text-xl font-black uppercase mb-4 text-white underline decoration-4 decoration-pink-500">
                  Честный вердикт
                </h3>
                <p className="text-lg leading-relaxed text-gray-300">
                  {result.verdict}
                </p>
              </div>

              <div className="neo-brutalism-border bg-[#111] p-6">
                <h3 className="text-xl font-black uppercase mb-4 text-white underline decoration-4 decoration-cyan-400">
                  Что понадобится
                </h3>
                <ul className="space-y-2">
                  {result.techStack.map((tech, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <span className="text-cyan-400 font-bold">▶</span>
                      <span>{tech}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="neo-brutalism-border bg-[#111] p-6">
                <h3 className="text-xl font-black uppercase mb-4 text-white underline decoration-4 decoration-yellow-400">
                  Бабки (Монетизация)
                </h3>
                <p className="text-lg text-gray-300 italic">
                  {result.monetization}
                </p>
              </div>

              <div className="neo-brutalism-border bg-red-900/20 p-6 border-red-500">
                <h3 className="text-xl font-black uppercase mb-4 text-red-500 underline decoration-4 decoration-red-600">
                  Почему ты проебешься
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-300">
                  {result.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="neo-brutalism-border bg-white text-black p-8">
              <h3 className="text-2xl font-black uppercase mb-6 text-center">
                Что делать прямо сейчас:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.nextSteps.map((step, i) => (
                  <div key={i} className="border-2 border-black p-4 font-bold flex flex-col justify-center items-center text-center">
                    <span className="text-3xl mb-2">{i + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-10">
              <p className="text-2xl font-black italic mb-8 uppercase text-gray-400">
                "{result.sarcasticComment}"
              </p>
              <button 
                onClick={() => setStep('intro')}
                className="neo-brutalism-btn bg-black text-white px-8 py-3 text-lg font-bold uppercase hover:bg-gray-900 border-gray-400"
              >
                ЕЩЕ ОДНУ ИДЕЮ!
              </button>
            </div>
          </div>
        )}
      </div>
      
      <footer className="fixed bottom-4 right-4 text-xs font-bold text-gray-600 uppercase tracking-tighter">
        НЕ ДЛЯ СЛАБОНЕРВНЫХ
      </footer>
    </div>
  );
};

export default App;
