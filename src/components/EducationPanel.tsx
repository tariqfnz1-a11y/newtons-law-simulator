import React, { useState } from 'react';
import { BookOpen, HelpCircle, CheckCircle, XCircle, Award, Compass, Sparkles } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function EducationPanel() {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: 'According to Newton\'s First Law, what happens to a hockey puck sliding across a frictionless ice rink?',
      options: [
        'It will slowly deccelerate until it comes to a natural stop.',
        'It will continue moving in a straight line at a constant speed forever.',
        'It requires a continuous, small force to maintain its speed.',
        'It will immediately stop the moment the stick releases it.'
      ],
      correctIndex: 1,
      explanation: 'Correct! If there is no friction or air resistance (zero external forces), an object in motion does not slow down. It maintains its speed and straight-line trajectory forever.'
    },
    {
      id: 2,
      question: 'When a bus driver brakes suddenly, why do standing passengers slide forward?',
      options: [
        'Because a forward push force is suddenly created by the brakes.',
        'Because of friction acting on the passengers\' heads pulling them forward.',
        'Because their inertia keeps them moving forward at pre-brake speed while the bus stops.',
        'Because heavy objects naturally move faster than light vehicles.'
      ],
      correctIndex: 2,
      explanation: 'Correct! This is the classic seatbelt/bus passenger demonstration of inertia. The bus stops due to the brakes (external force), but the standing passengers do not experience that same external force, so their bodies continue moving forward at the original speed!'
    },
    {
      id: 3,
      question: 'Which of the following is the physical measurement of an object\'s inertia?',
      options: [
        'Velocity',
        'Mass',
        'Acceleration',
        'Friction Coefficient'
      ],
      correctIndex: 1,
      explanation: 'Correct! Mass is the fundamental measure of inertia. The more mass an object has, the more it resists changes to its state of motion (making it harder to speed up or slow down).'
    },
    {
      id: 4,
      question: 'If an object is traveling at a constant speed of 50 m/s in a straight line, what can we conclude about the net force acting on it?',
      options: [
        'The net force is positive and continuous.',
        'The net force is exactly zero.',
        'A large force must be actively pushing it forward.',
        'The object has run out of inertia.'
      ],
      correctIndex: 1,
      explanation: 'Correct! If speed is constant and direction is straight, acceleration is zero ($a=0$). By Newton\'s Second Law ($F=ma$), the net external force must be exactly ZERO. This is a state of equilibrium!'
    }
  ];

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    setShowResults((prev) => ({ ...prev, [questionId]: true }));
  };

  const score = Object.entries(userAnswers).reduce((acc, [qId, selectedIdx]) => {
    const question = quizQuestions.find((q) => q.id === parseInt(qId));
    if (question && question.correctIndex === selectedIdx) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const totalAnswered = Object.keys(userAnswers).length;

  return (
    <div className="space-y-8">
      
      {/* 1. Academic Reading Text */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-800">
            Newton\'s First Law of Motion: Explained
          </h2>
        </div>

        <div className="prose prose-slate max-w-none text-xs text-slate-600 leading-relaxed space-y-4">
          <p>
            Formulated by Sir Isaac Newton in 1687, the <strong>First Law of Motion</strong> (also known as the <strong>Law of Inertia</strong>) defines how objects behave when forces are either absent or perfectly balanced.
          </p>

          <blockquote className="border-l-4 border-blue-600 bg-blue-50/50 p-3.5 rounded-r-xl italic font-medium text-blue-950 text-xs">
            "An object at rest remains at rest, and an object in motion remains in motion at a constant velocity in a straight line, unless acted upon by a net external force."
          </blockquote>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <span className="text-blue-600">●</span> 1. Concept: Inertia
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                <strong>Inertia</strong> is the natural resistance of an object to change its velocity. Objects are incredibly stubborn! A stationary object "wants" to stay stationary. A moving object "wants" to keep sliding at the exact same speed in the exact same direction. Mass is the measure of this stubbornness.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <span className="text-emerald-600">●</span> 2. Concept: Net Force
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Newton's First Law doesn't say "no forces can act on the object". It says no <strong>NET</strong> external force can act on it. If you push a heavy crate at 50N and friction pushes back at exactly 50N, the forces are balanced. The Net Force is <strong>0 N</strong>. The crate maintains a constant speed!
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center gap-1">
                <span className="text-red-500">●</span> 3. Concept: Friction
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                In daily life, moving objects (like a rolling soccer ball) always slow down. Why? It's not because their "inertia ran out," but because <strong>friction</strong> and air resistance are invisible external forces dragging against them. If you kick a ball in the vacuum of outer space, it will travel forever!
              </p>
            </div>

          </div>

          <div className="space-y-2.5 pt-2">
            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1">
              <Compass className="w-4 h-4 text-blue-500" /> Real-World Examples
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-500">
              <li>
                <strong>Seatbelts in Cars:</strong> When a speeding car collides with a wall, the car stops immediately because of the collision force. However, your body has inertia and continues moving forward at the pre-crash speed. A seatbelt applies a crucial external force to stop you safely instead of hitting the windshield!
              </li>
              <li>
                <strong>Voyager Spacecraft:</strong> The Voyager 1 probe was launched in 1977. Its rockets have been off for decades, yet it continues traveling away from Earth at a staggering 38,000 miles per hour. Since space is a vacuum with no air friction, inertia keeps Voyager sailing indefinitely with zero engine thrust.
              </li>
              <li>
                <strong>Tablecloth Trick:</strong> If you whip a slippery tablecloth out from under heavy ceramic plates extremely fast, the plates remain at rest. Because the plates have high mass (inertia), and the pull was too fast for friction to apply a significant force, they resist changing their state of rest.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Interactive Comprehension Quiz */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-800">
              Inertia Comprehension Check
            </h2>
          </div>
          {totalAnswered > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full text-xs">
              <Award className="w-4 h-4 text-blue-600" />
              Score: {score} / {quizQuestions.length}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {quizQuestions.map((q, idx) => {
            const hasAnswered = showResults[q.id];
            const selectedIdx = userAnswers[q.id];

            return (
              <div key={q.id} className="border border-slate-100 rounded-xl p-4 space-y-3 bg-slate-50/50">
                <div className="flex gap-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-100/60 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    Q{idx + 1}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-800 leading-normal">
                    {q.question}
                  </h4>
                </div>

                <div className="grid grid-cols-1 gap-2 pl-7">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = selectedIdx === oIdx;
                    const isCorrect = q.correctIndex === oIdx;
                    
                    let btnStyle = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700';
                    
                    if (hasAnswered) {
                      if (isCorrect) {
                        btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-medium';
                      } else if (isSelected) {
                        btnStyle = 'border-red-500 bg-red-50 text-red-800';
                      } else {
                        btnStyle = 'border-slate-100 bg-white opacity-60 text-slate-400';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        disabled={hasAnswered}
                        onClick={() => handleSelectOption(q.id, oIdx)}
                        id={`q-${q.id}-opt-${oIdx}`}
                        className={`px-4 py-2 text-left rounded-lg border text-xs transition duration-200 flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {hasAnswered && isCorrect && (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                        {hasAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <div className="pl-7 pt-2">
                    <p className="text-[11px] text-slate-500 bg-white p-3 border border-slate-100 rounded-lg leading-relaxed">
                      <span className="font-bold text-slate-700 block mb-0.5">💡 Scientific Commentary:</span>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalAnswered === quizQuestions.length && (
          <div className="bg-blue-600 text-white rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-md">
            <div className="space-y-1 text-center sm:text-left">
              <h4 className="font-bold text-sm flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-4 h-4 text-yellow-300" /> Quiz Completed!
              </h4>
              <p className="text-xs text-blue-100">
                Excellent! You scored {score} out of {quizQuestions.length} questions correctly. You are now an expert in Newton's First Law.
              </p>
            </div>
            <button
              onClick={() => {
                setUserAnswers({});
                setShowResults({});
              }}
              id="btn-restart-quiz"
              className="px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-lg hover:bg-blue-50 transition flex-shrink-0"
            >
              Take Quiz Again
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
