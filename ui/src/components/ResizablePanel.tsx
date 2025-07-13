import React, { useState, useEffect } from 'react';
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatch by using default sizes until hydrated
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const currentSizes = isHydrated ? sizes : defaultSizes;

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
        <React.Fragment key={`panel-${index}`}>
          <Panel
            defaultSize={currentSizes[index]}
            minSize={minSizes[index] || 10}
            className="panel-content"
          >
            {child}
          </Panel>
          
          {/* Add resize handle between panels, but not after the last one */}
          {index < children.length - 1 && (
            <PanelResizeHandle key={`handle-${index}`} className="panel-resize-handle">
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
      direction="horizontal"
      defaultSizes={[70, 30]}
      minSizes={[40, 20]}
      className={className}
      storageKey="editor-results-panels"
    >
      {[
        <React.Fragment key="editor">{editorContent}</React.Fragment>,
        <React.Fragment key="results">{resultsContent}</React.Fragment>
      ]}
    </ResizablePanel>
  );
};