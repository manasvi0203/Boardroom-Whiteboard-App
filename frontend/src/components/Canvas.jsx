import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import Toolbar from './Toolbar';
import api from '../api/axios';
import { exportAsPNG, exportAsPDF } from '../utils/exportUtils';


fabric.Object.prototype.objectCaching = false;

const AUTOSAVE_DELAY = 1500; //time taken to save
const BROADCAST_THROTTLE = 120; //time taken to show the saved image to other users
const CURSOR_THROTTLE = 60; //to show other users curson currently
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.15;

// svg image for eraser cursor, bottom left pointer, auto is given if image doesnt work then fallback to the original pointer
const ERASER_CURSOR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="#111827" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 21H8a2 2 0 0 1-1.42-.587l-3.994-4a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.828 0l6 6a2 2 0 0 1 0 2.828L12.833 21" fill="white"/>
  <path d="m5.082 11.09 8.828 8.828"/>
</svg>`.trim(); //url is encoded because it cannot contain <,><# such characters
const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(ERASER_CURSOR_SVG)}") 2 18, auto`;

//Maps each tool name to the CSS cursor it should show
const CURSOR_BY_TOOL = {
  select: 'default',
  pen: 'crosshair',
  eraser: ERASER_CURSOR,
  line: 'crosshair',
  rect: 'crosshair',
  circle: 'crosshair',
  text: 'text',
  pan: 'grab',
};


//what the props of the Canvas React component are and why they are passed in.
export default function Canvas({ boardId, initialData, socket, onCollaboratorsChange, onSaveStatus }) {
  const containerRef = useRef(null); //available size
  const canvasElRef = useRef(null);  //canvas element
  const fabricRef = useRef(null);    //fabric canvas instance

  const [tool, setTool] = useState('select');      //current tool
  const [color, setColor] = useState('#1F2937'); //stroke color
  const [brushSize, setBrushSize] = useState(4);   //brush width
  const [zoomPct, setZoomPct] = useState(100);     //zoom precentage
  const [canUndo, setCanUndo] = useState(false);   //undo button
  const [canRedo, setCanRedo] = useState(false);   //redo button
  const [cursors, setCursors] = useState({});      //map of users live cursor position


  //why used useRef instead of useState?
  //These values are internal implementation details. 
  // The user never directly sees them in the UI, so there's no reason to re-render the component every time they change.
  const historyRef = useRef({ stack: [], index: -1 }); //history for undo/redo
  const isApplyingRef = useRef(false);
  const drawingShapeRef = useRef(null);   //shape currently being drawn
  const isPanningRef = useRef(false);     //tracks if user is dragging canvas
  const lastPosRef = useRef({ x: 0, y: 0 }); //stores last mouse postition while panning
  const autosaveTimerRef = useRef(null);   //The board is only saved after they've been idle for 1 second.
  const broadcastTimerRef = useRef(null);  //control how often updates are send to collaborators
  const cursorTimerRef = useRef(null);  //control how often cursor position is shared

  //useEffect is attached to fabricjs once hence useref used
  const toolRef = useRef(tool);         
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);

  toolRef.current = tool;
  colorRef.current = color;
  brushSizeRef.current = brushSize;

  //stack has all board saved states, index - currently active state
  const updateUndoRedoFlags = () => {
    const h = historyRef.current;
    setCanUndo(h.index > 0);         //Undo is possible only if we're not at the first state
    setCanRedo(h.index < h.stack.length - 1); //Redo is possible only if there are states ahead of the current index
  };


  //useCallback memoizes the function
  const scheduleAutosave = useCallback(() => {  
    onSaveStatus?.('saving');
    clearTimeout(autosaveTimerRef.current); //clear any previous autosave states

    autosaveTimerRef.current = setTimeout(async () => {
      try
      {
        const json = JSON.stringify(fabricRef.current.toJSON());
        await api.put(`/whiteboards/${boardId}`, { data: json }); //This makes an HTTP PUT request
        onSaveStatus?.('saved');

      } 
      catch
      {
        onSaveStatus?.('error');
      }
    }, AUTOSAVE_DELAY);
  }, [boardId, onSaveStatus]);



//sends the latest whiteboard state to all other connected users through a WebSocket
  const scheduleBroadcast = useCallback(() => {
    clearTimeout(broadcastTimerRef.current); //Cancel the previous broadcast

    broadcastTimerRef.current = setTimeout(() => {
      if (!socket) return; //checks if WebSocket connection hasn't been established

      const json = JSON.stringify(fabricRef.current.toJSON());

      socket.emit('canvas:update', 
        { boardId, 
          data: json, 
          version: Date.now() 
        });
    }, BROADCAST_THROTTLE);

  }, [socket, boardId]);

//commits history for undo/redo, schedule autosave, broadcast to other collaborators
  const commit = useCallback(() => {
    if (isApplyingRef.current) return; //internal flag that prevents user from recursive commit

    const h = historyRef.current;
    const json = JSON.stringify(fabricRef.current.toJSON()); //capture current canvas

    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(json);

    //Limit history size
    if (h.stack.length > 100) h.stack.shift();  //only the latest 100 states are stored

    h.index = h.stack.length - 1;  //Move the history pointer

    updateUndoRedoFlags();
    scheduleAutosave();
    scheduleBroadcast();

  }, [scheduleAutosave, scheduleBroadcast]);


  //loads a saved canvas state 
  // (used during Undo, Redo, or when receiving updates from collaborators)
  const applyJSON = (json, cb) => {
    isApplyingRef.current = true; //tells server that we are loading an existing canvas 

    fabricRef.current.loadFromJSON(json, () => {  //loads the saved canvas
      fabricRef.current.renderAll();  //redraws entire canvas
      isApplyingRef.current = false;
      cb?.(); //execute callback function
    });
  };

  //Undo function
  const undo = () => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index -= 1;

    //json, callback functions
    applyJSON(h.stack[h.index], () => {
      updateUndoRedoFlags();
      scheduleAutosave();
      scheduleBroadcast();
    });
  };

  //Redo functiom
  const redo = () => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index += 1;

    //json, callback
    applyJSON(h.stack[h.index], () => {
      updateUndoRedoFlags();
      scheduleAutosave();
      scheduleBroadcast();
    });
  };

  //to delete the selected portion
  const deleteSelected = () => {
    const canvas = fabricRef.current;
    const active = canvas.getActiveObjects(); //which user selects

    if (!active.length) return;

    isApplyingRef.current = true; //prevent recursive commits

    active.forEach((obj) => canvas.remove(obj)); //remove each selected object

    canvas.discardActiveObject(); //remove selection box
    canvas.requestRenderAll();  //redraw canvas
    isApplyingRef.current = false;
    commit(); //commiting changes
  };


  //clear all canvas
  const clearBoard = () => {
    if (!window.confirm('Clear the entire whiteboard for everyone? This cannot be undone.')) return; //to confirm

    const canvas = fabricRef.current;
    canvas.clear(); //also removes bg settings
    canvas.backgroundColor = '#ffffff'; //restore bg color
    canvas.requestRenderAll();
    commit();
  };

  // prevents excessive zooming
  const applyZoom = (zoom, point) => {
    const canvas = fabricRef.current;
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

    // to zoom around a point, if not given zoom around the center
    canvas.zoomToPoint(point || { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 }, clamped);

    setZoomPct(Math.round(clamped * 100)); //update ui
  };

  //each click increases/decreases zoom by 15%
  const zoomIn = () => applyZoom(fabricRef.current.getZoom() * 1.15);
  const zoomOut = () => applyZoom(fabricRef.current.getZoom() / 1.15);
  const zoomReset = () => {
    const canvas = fabricRef.current;

    //fabric view stores [scaleX, skewY, skewX, scaleY, translateX, translateY]
    //normal view [1,0,0,1,0,0]
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    setZoomPct(100);
  };

  //initialization code for your whiteboard, runs once when the component mounts
  useEffect(() => {
    //create fabric canvas
    const canvas = new fabric.Canvas(canvasElRef.current, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true, //original stack is preserved
      selection: true, //drag a selection box
    });
    fabricRef.current = canvas; //save canvas reference
    
    //size of canvas
    const getSize = () => {
      const el = containerRef.current;
      const width = (el && el.clientWidth) || window.innerWidth;
      const height = (el && el.clientHeight) || window.innerHeight - 56; //-56 for toolbar height

      //to prevent zero dimensions
      return { width: Math.max(width, 1), 
               height: Math.max(height, 1) 
            };
    };

    
    const resize = () => {
      const { width, height } = getSize();
      canvas.setDimensions({ width, height }); //to resize to latest size
      canvas.forEachObject((obj) => { obj.dirty = true; }); //this object needs to be redrawn
      canvas.requestRenderAll(); //everything is redrawn
    };
    resize(); //size the canvas when component loads

    //watch for container resizing and runs resize automatically
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);

    //
    const raf = requestAnimationFrame(() => {
      resize();
      if (initialData) {
        isApplyingRef.current = true;
        canvas.loadFromJSON(initialData, () => { //recreates every object from saved render
          canvas.renderAll();

          isApplyingRef.current = false;

          //initialize history
          historyRef.current = { stack: [JSON.stringify(canvas.toJSON())], index: 0 };
          updateUndoRedoFlags();
        });
      } else {
        //if new whiteboard is created
        historyRef.current = { stack: [JSON.stringify(canvas.toJSON())], index: 0 };
      }
    });

    //main event registeration of whiteboard
    const onChange = () => commit();
    canvas.on('object:added', onChange);
    canvas.on('object:modified', onChange); //moved, sized, rotated
    canvas.on('object:removed', onChange);

    //runs whenever mouse wheel is scrolled
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;  //get wheel movement

      let zoom = canvas.getZoom() * 0.999 ** delta;

      //zooms around the cursor position
      applyZoom(zoom, { 
        x: opt.e.offsetX, 
        y: opt.e.offsetY 
      });
      //prevent browser scrolling
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    //pan on whole canvas
    canvas.on('mouse:down', (opt) => {
      const t = toolRef.current; //get current tool
      const pointer = canvas.getPointer(opt.e); //get click position

      if (t === 'pan') {
        isPanningRef.current = true;  //start dragging the canvas
        lastPosRef.current = { x: opt.e.clientX, y: opt.e.clientY }; //store mouse position
        canvas.selection = false; //disable object selection while panning
        return;
      }

      //creating editable text
      if (t === 'text') {
        const textObj = new fabric.IText('Type here', {
          left: pointer.x, //position the text
          top: pointer.y,
          fill: colorRef.current, //set color
          fontFamily: 'Inter, sans-serif', //font type
          fontSize: 20 + brushSizeRef.current, //font size
        });
        canvas.add(textObj); //adding to canvas
        canvas.setActiveObject(textObj); //make it selected
        textObj.enterEditing();      //start editing (cursor blinks)
        setTool('select');           //switch back to select tool 
        return;
      }

      //
      if (['line', 'rect', 'circle'].includes(t)) {
        let shape;
        const common = {
          left: pointer.x, 
          top: pointer.y,
          stroke: colorRef.current, 
          strokeWidth: brushSizeRef.current,
          fill: 'transparent', //only borders are there
          selectable: false,   //user is still drawing
          originX: 'left',
          originY: 'top',  //top-left corner position
        };
        //1. Line
        if (t === 'line') {
          shape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: colorRef.current,
            strokeWidth: brushSizeRef.current,
            selectable: false,
          });

        //2. Rectangle
        } else if (t === 'rect') {
          shape = new fabric.Rect({ ...common, width: 0, height: 0 });

        //3. Circle
        } else {
          shape = new fabric.Circle({ ...common, radius: 0 });
        }

        //save drawing info
        drawingShapeRef.current = { shape, originX: pointer.x, originY: pointer.y };
        
        isApplyingRef.current = true; //temporarily disable automatic commits
        canvas.add(shape);
        isApplyingRef.current = false;
      }
    });

    //handles panning
    canvas.on('mouse:move', (opt) => {
      if (isPanningRef.current) {
        const e = opt.e;   //get mouse event
        const vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - lastPosRef.current.x;
        vpt[5] += e.clientY - lastPosRef.current.y;

        canvas.requestRenderAll();  //draw canvas again 
        lastPosRef.current = { x: e.clientX, y: e.clientY }; //save curr mouse position
      }

      //updates the drawn shape 
      const drawing = drawingShapeRef.current;
      if (drawing) {
        const pointer = canvas.getPointer(opt.e);

        const { shape, originX, originY } = drawing;

        if (shape.type === 'line') {
          shape.set({ x2: pointer.x, y2: pointer.y });
        } 
        else if (shape.type === 'rect') {
          shape.set({
            left: Math.min(originX, pointer.x), //min to let the user draw in any direction
            top: Math.min(originY, pointer.y),
            width: Math.abs(pointer.x - originX), //absolute to keep value positive
            height: Math.abs(pointer.y - originY),
          });
        } 
        else if (shape.type === 'circle') {
          const radius = Math.hypot(pointer.x - originX, pointer.y - originY) / 2;
          shape.set({
            left: Math.min(originX, pointer.x),
            top: Math.min(originY, pointer.y),
            radius,
          });
        }
        canvas.requestRenderAll();
      }

      //send updated canvas to other collaborators
      if (socket) {
        clearTimeout(cursorTimerRef.current); //clear prev timer

        cursorTimerRef.current = setTimeout(() => {
          const pointer = canvas.getPointer(opt.e); //to get canvas coordinates

          socket.emit('cursor:move', {  //send cursor position
            boardId, 
            x: pointer.x, 
            y: pointer.y 
          });
        }, CURSOR_THROTTLE);
      }
    });


    canvas.on('mouse:up', () => {
      //stop panning
      if (isPanningRef.current) {
        isPanningRef.current = false;
        canvas.selection = toolRef.current === 'select'; //enable selection again
      }
      //checks if shape is being drawn
      if (drawingShapeRef.current) {
        const shape = drawingShapeRef.current.shape; //get shape
        drawingShapeRef.current = null; //finish drawing

        // A click without a drag leaves the shape at zero size-discard it
        const isDegenerate =
          (shape.type === 'rect' && (shape.width <= 1 || shape.height <= 1)) ||
          (shape.type === 'circle' && shape.radius <= 1) ||
          (shape.type === 'line' && Math.hypot(shape.x2 - shape.x1, shape.y2 - shape.y1) <= 1);

        if (isDegenerate) {
          isApplyingRef.current = true; //prevent commit
          canvas.remove(shape);
          isApplyingRef.current = false; //enable commit after removing invisible shape
          canvas.requestRenderAll();
          return;
        }

        shape.set({ selectable: true });
        canvas.setActiveObject(shape);
        commit();
      }
    });

    //creating a keyboard handler
    const onKeyDown = (e) => {
      const active = document.activeElement;

      //checks if user is typing
      const typing = active && ['INPUT', 'TEXTAREA'].includes(active.tagName);

      if (typing) return;

      //to delete objects
      if ((e.key === 'Delete' || e.key === 'Backspace') && !canvas.getActiveObject()?.isEditing) {
        deleteSelected();
      }

      //if (ctrl + z -> undo, ctrl + shift + z -> redo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }

      //if (ctrl + y -> redo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    //cleanups
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(autosaveTimerRef.current);
      clearTimeout(broadcastTimerRef.current);
      clearTimeout(cursorTimerRef.current);
      canvas.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  useEffect(() => {
    const canvas = fabricRef.current; //get the canvas
    if (!canvas) return;

    canvas.isDrawingMode = tool === 'pen' || tool === 'eraser'; //enable drawing mode
    canvas.selection = tool === 'select'; 

    canvas.forEachObject((o) => (o.selectable = tool === 'select')); //update every objects selectable property

    //pen, eraser
    if (canvas.isDrawingMode) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);  //create pencilbrush
      canvas.freeDrawingBrush.width = brushSize;  //set brush size
      canvas.freeDrawingBrush.color = tool === 'eraser' ? '#ffffff' : color; //if eraser-color white
    }

    //choose the cursor
    const cursor = CURSOR_BY_TOOL[tool] || 'default';
    canvas.defaultCursor = cursor;
    canvas.hoverCursor = cursor;
    canvas.freeDrawingCursor = cursor; // fabric uses this when isDrawingMode is on
  }, [tool, color, brushSize]);


  //to establish web socket connection
  useEffect(() => {
    if (!socket) return;
    socket.emit('board:join', { boardId }); //join a particular board

    const onRemoteCanvas = ({ data }) => {

      applyJSON(data, () => {      //apply the remote canvas
        const h = historyRef.current;   //update history

        h.stack = h.stack.slice(0, h.index + 1);  //remove redo history
        h.stack.push(data);                       //save new state
        h.index = h.stack.length - 1;             //update index
        updateUndoRedoFlags();
      });
    };

    //cursor updates, append new users to previous users
    const onCursor = (payload) => {
      setCursors((prev) => ({ ...prev, [payload.userId]: { ...payload, ts: Date.now() } }));
    };

    //optional chaining for collaborators updates
    const onCollaborators = (list) => onCollaboratorsChange?.(list);

    //register listens whenever:
    socket.on('canvas:update', onRemoteCanvas);
    socket.on('cursor:update', onCursor);
    socket.on('collaborators:update', onCollaborators);

    //remove listeners
    return () => {
      socket.emit('board:leave', { boardId });
      socket.off('canvas:update', onRemoteCanvas);
      socket.off('cursor:update', onCursor);
      socket.off('collaborators:update', onCollaborators);
    };
   // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, boardId]);


  //to remove inactive collaborative cursors
  useEffect(() => {
    const id = setInterval(() => {
      setCursors((prev) => {  //update cursor state
        const next = {};      //active cursors
        const now = Date.now();

        Object.entries(prev).forEach(([k, v]) => {
          if (now - v.ts < 6000) next[k] = v;      //is the user still active? keep only active users
        });
        return next;  //return new state
      });
    }, 2000); //checked every 2 seconds 
    return () => clearInterval(id); //cleanup
  }, []);


  //converts canvas coordinates to screen coordinates
  const toScreenPoint = (x, y) => {
    const canvas = fabricRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const p = fabric.util.transformPoint(new fabric.Point(x, y), canvas.viewportTransform);
    return { x: p.x, y: p.y };
  };

  return (
    <div className="canvas-wrapper">
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={zoomReset}
        zoomPct={zoomPct}
        onClearBoard={clearBoard}
        onExportPNG={() => exportAsPNG(fabricRef.current, 'whiteboard.png')}
        onExportPDF={() => exportAsPDF(fabricRef.current, 'whiteboard.pdf')}
        onDeleteSelected={deleteSelected}
      />

      {/*canvas-container - canvas, remote cursors*/}
      <div className="canvas-container" ref={containerRef}>

        <canvas ref={canvasElRef} /> {/*initially html canvas*/}

        {Object.values(cursors).map((c) => {  {/* render remote cursors */}
          const p = toScreenPoint(c.x, c.y);  {/* convert coordinates */}
          return (
            <div key={c.userId} className="remote-cursor" style={{ 
                                                           left: p.x, 
                                                           top: p.y, 
                                                           '--cursor-color': c.color }}>
              <span className="remote-cursor-dot" />
              <span className="remote-cursor-label">{c.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}