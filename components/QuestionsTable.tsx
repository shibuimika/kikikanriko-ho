'use client';

import { Question } from '@/lib/schemas';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface QuestionsTableProps {
  questions: Question[];
  topic?: string; // シミュレーション用のテーマ
}

export default function QuestionsTable({ questions, topic }: QuestionsTableProps) {
  const router = useRouter();

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGotchaColor = (gotcha: number) => {
    if (gotcha === 0) return 'bg-gray-100 text-gray-800';
    if (gotcha <= 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const handleSimulationStart = () => {
    if (topic) {
      router.push(`/simulate?topic=${encodeURIComponent(topic)}`);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              質問
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              意図
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              難易度
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              罠レベル
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              期待する根拠
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              リスク領域
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              アクション
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {questions.map((question, index) => (
            <tr key={question.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                <div className="break-words">
                  {question.question}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {question.intent_tag}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}/5
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGotchaColor(question.gotcha_level)}`}>
                  {question.gotcha_level}/3
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                <div className="break-words">
                  {question.expected_evidence}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {question.risk_area}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {index === 0 && topic ? (
                  <button
                    onClick={handleSimulationStart}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    シミュレーション開始
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="font-medium">総質問数:</span> {questions.length}件
          </div>
          <div>
            <span className="font-medium">平均難易度:</span> {(questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length).toFixed(1)}
          </div>
          <div>
            <span className="font-medium">高リスク質問:</span> {questions.filter(q => q.gotcha_level >= 2).length}件
          </div>
        </div>
      </div>
    </div>
  );
}