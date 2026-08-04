import React from 'react';
import {
  MousePointer2,
  Pencil,
  Eraser,
  Slash,
  Square,
  Circle,
  Type,
  Hand,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Image,
  FileText,
  Delete,
} from 'lucide-react';

const TOOLS = [
  { id: 'select', label: 'Select', Icon: MousePointer2 },
  { id: 'pen', label: 'Pen', Icon: Pencil },
  { id: 'eraser', label: 'Eraser', Icon: Eraser },
  { id: 'line', label: 'Line', Icon: Slash },
  { id: 'rect', label: 'Rectangle', Icon: Square },
  { id: 'circle', label: 'Circle', Icon: Circle },
  { id: 'text', label: 'Text', Icon: Type },
  { id: 'pan', label: 'Pan', Icon: Hand },
];

//divider component | 
const Divider = () => <span className="toolbar-divider" aria-hidden="true" />;

//props from parent component
export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  zoomPct,
  onClearBoard,
  onExportPNG,
  onExportPDF,
  onDeleteSelected,
}) {
  return (
    <div className="toolbar">

      <div className="toolbar-group" role="group" aria-label="Tools">

        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tool-btn ${tool === id ? 'active' : ''}`}
            title={label}
            aria-label={label}
            aria-pressed={tool === id}
            onClick={() => setTool(id)}
          >
            <Icon size={18} strokeWidth={2} />
          </button>
        ))}
      </div>

      <Divider />

      <div className="toolbar-group" role="group" aria-label="Style">
        <label className="swatch-label" title="Color">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Stroke color"
          />
        </label>
        <label className="brush-size-label" title="Brush size">
          <input
            type="range" //creates a slider
            min="1"
            max="40"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            aria-label="Brush size"
          />
          <span className="brush-size-value">{brushSize}px</span>
        </label>
      </div>

      <Divider />

      <div className="toolbar-group" role="group" aria-label="History">
        <button className="tool-btn" title="Undo (Ctrl+Z)" aria-label="Undo" onClick={onUndo} disabled={!canUndo}>
          <Undo2 size={18} strokeWidth={2} />
        </button>

        <button className="tool-btn" title="Redo (Ctrl+Shift+Z)" aria-label="Redo" onClick={onRedo} disabled={!canRedo}>
          <Redo2 size={18} strokeWidth={2} />
        </button>

        <button className="tool-btn" title="Delete selected (Del)" aria-label="Delete selected" onClick={onDeleteSelected}>
          <Delete size={18} strokeWidth={2} />
        </button>
      </div>

      <Divider />

      <div className="toolbar-group zoom-group" role="group" aria-label="Zoom">
        <button className="tool-btn" title="Zoom out" aria-label="Zoom out" onClick={onZoomOut}>
          <ZoomOut size={18} strokeWidth={2} />
        </button>

        <button className="zoom-pct" title="Reset zoom" onClick={onZoomReset}>
          {zoomPct}%
        </button>

        <button className="tool-btn" title="Zoom in" aria-label="Zoom in" onClick={onZoomIn}>
          <ZoomIn size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-group" role="group" aria-label="Board actions">
        <button className="tool-btn danger" title="Clear board" aria-label="Clear board" onClick={onClearBoard}>
          <Trash2 size={18} strokeWidth={2} />
        </button>

        <button className="tool-btn text-btn" title="Export as PNG" onClick={onExportPNG}>
          <Image size={16} strokeWidth={2} />
          <span>PNG</span>
        </button>

        <button className="tool-btn text-btn" title="Export as PDF" onClick={onExportPDF}>
          <FileText size={16} strokeWidth={2} />
          <span>PDF</span>
        </button>
      </div>
      
    </div>
  );
}