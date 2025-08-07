'use client';

import { Risk } from '@/lib/schemas';

interface RiskAnalysisProps {
  risks: Risk[];
  isAnalyzing: boolean;
}

interface AlertProps {
  severity: 'high' | 'medium' | 'low';
  children: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ severity, children }) => {
  const severityStyles = {
    high: 'bg-red-50 border border-red-200 text-red-800',
    medium: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
    low: 'bg-gray-50 border border-gray-200 text-gray-700'
  };

  const iconStyles = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-gray-500'
  };

  const severityLabels = {
    high: '高',
    medium: '中',
    low: '低'
  };

  return (
    <div className={`p-4 rounded-lg ${severityStyles[severity]} mb-3`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${iconStyles[severity]} mr-3`}>
          {severity === 'high' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {severity === 'medium' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          {severity === 'low' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityStyles[severity]} mr-2`}>
              リスク度: {severityLabels[severity]}
            </span>
          </div>
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default function RiskAnalysis({ risks, isAnalyzing }: RiskAnalysisProps) {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">想定リスク分析</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">リスクを分析中...</span>
        </div>
      </div>
    );
  }

  if (risks.length === 0) {
    return null;
  }

  // リスクを重要度順に並び替え
  const sortedRisks = [...risks].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const riskCounts = {
    high: risks.filter(r => r.severity === 'high').length,
    medium: risks.filter(r => r.severity === 'medium').length,
    low: risks.filter(r => r.severity === 'low').length
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">想定リスク分析</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            高リスク: {riskCounts.high}件
          </span>
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
            中リスク: {riskCounts.medium}件
          </span>
          <span className="flex items-center">
            <span className="inline-block w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
            低リスク: {riskCounts.low}件
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedRisks.map((risk) => (
          <Alert key={risk.id} severity={risk.severity}>
            {risk.description}
          </Alert>
        ))}
      </div>

      {riskCounts.high > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800 text-sm font-medium">
              高リスクが検出されました。追加の対策検討をお勧めします。
            </span>
          </div>
        </div>
      )}
    </div>
  );
}