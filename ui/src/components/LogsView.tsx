import { useState } from 'react';

interface LogsViewProps {
  logs: string[];
}

export const LogsView: React.FC<LogsViewProps> = ({ logs }) => {
  const [expanded, setExpanded] = useState(false);
  
  const downloadLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'karate-execution-logs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div 
        className="p-4 cursor-pointer flex justify-between items-center border-b"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="transform transition-transform duration-200" style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>▶</span>
          <h2 className="text-lg font-semibold">Execution Logs</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyLogs();
            }}
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            Copy
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadLogs();
            }}
            className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-50"
          >
            Download
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-4">
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto max-h-[500px] whitespace-pre-wrap font-mono">
            {logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};
