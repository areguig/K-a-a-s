import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';
import { usePanelSizes } from '../hooks/useLocalStorage';

interface ResizablePanelProps {
  children: React.ReactNode[];
  direction?: 'horizontal' | 'vertical';
  defaultSizes?: number[];
  minSizes?: number[];
  className?: string;
  storageKey?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  direction = 'vertical',
  defaultSizes = [50, 50],
  minSizes = [20, 20],
  className = '',
  storageKey = 'default-panels'
}) => {
  const [sizes, setSizes] = usePanelSizes(defaultSizes);

  const handleResize = (newSizes: number[]) => {
    setSizes(newSizes);
  };

  return (
    <PanelGroup
      direction={direction}
      className={className}
      onLayout={handleResize}
    >
      {children.map((child, index) => (
        <React.Fragment key={index}>
          <Panel
            defaultSize={sizes[index]}
            minSize={minSizes[index] || 10}
            className="panel-content"
          >
            {child}
          </Panel>
          
          {/* Add resize handle between panels, but not after the last one */}
          {index < children.length - 1 && (
            <PanelResizeHandle className="panel-resize-handle">
              <div className="panel-resize-handle-inner">
                <GripVertical className="panel-resize-handle-icon" />
              </div>
            </PanelResizeHandle>
          )}
        </React.Fragment>
      ))}
    </PanelGroup>
  );
};

// Optional: Specialized component for editor/results layout
interface EditorResultsPanelProps {
  editorContent: React.ReactNode;
  resultsContent: React.ReactNode;
  className?: string;
}

export const EditorResultsPanel: React.FC<EditorResultsPanelProps> = ({
  editorContent,
  resultsContent,
  className = ''
}) => {
  return (
    <ResizablePanel
      direction="vertical"
      defaultSizes={[40, 60]}
      minSizes={[25, 25]}
      className={className}
      storageKey="editor-results-panels"
    >
      {[editorContent, resultsContent]}
    </ResizablePanel>
  );
};