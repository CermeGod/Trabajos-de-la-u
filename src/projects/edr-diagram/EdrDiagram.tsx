import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Flag, Search, Code2,
  Layers,
  ZoomIn, ZoomOut, RotateCcw,
  Plus, Trash2, Edit2, Check, X
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type NodeType = 'root' | 'phase' | 'task';

interface FlatNode {
  id: string;
  label: string;
  code: string;
  type: NodeType;
  color: string;
  light: string;
  icon?: React.ReactNode;
  tooltip?: string;
  parentId?: string;
}

interface Pos { x: number; y: number }

// ─────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────
interface TreeNodeData {
  id: string;
  code: string;
  title: string;
  color?: string;
  light?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  children?: TreeNodeData[];
}

const EDR_TREE: TreeNodeData[] = [
  {
    id: "1", code: "1", title: "Recursos Humanos", color: "#2563eb", light: "#dbeafe", icon: <Flag size={16} />,
    children: [
      {
        id: "1.1", code: "1.1", title: "Equipo de Dirección",
        children: [
          { id: "1.1.1", code: "1.1.1", title: "Sponsor (Jefe de Caja Central)" },
          { id: "1.1.2", code: "1.1.2", title: "Jefe de Proyecto" }
        ]
      },
      {
        id: "1.2", code: "1.2", title: "Equipo de Desarrollo",
        children: [
          { id: "1.2.1", code: "1.2.1", title: "Jefe de Desarrollo" },
          { id: "1.2.2", code: "1.2.2", title: "Analista Funcional" },
          { id: "1.2.3", code: "1.2.3", title: "Desarrollador Backend" },
          { id: "1.2.4", code: "1.2.4", title: "Desarrollador Frontend" },
          { id: "1.2.5", code: "1.2.5", title: "Administrador de Base de Datos (DBA)" }
        ]
      },
      {
        id: "1.3", code: "1.3", title: "Equipo de Calidad",
        children: [
          { id: "1.3.1", code: "1.3.1", title: "Analista QA" }
        ]
      },
      {
        id: "1.4", code: "1.4", title: "Interesados",
        children: [
          { id: "1.4.1", code: "1.4.1", title: "Administrador de Caja Central" },
          { id: "1.4.2", code: "1.4.2", title: "Coordinador de Recaudación" },
          { id: "1.4.3", code: "1.4.3", title: "Jefaturas (Admisión/Matrícula/Grados)" }
        ]
      }
    ]
  },
  {
    id: "2", code: "2", title: "Equipamiento e Infraestructura", color: "#4f46e5", light: "#e0e7ff", icon: <Layers size={16} />,
    children: [
      { id: "2.1", code: "2.1", title: "Servidores (UNJFSC/Virtuales)" },
      { id: "2.2", code: "2.2", title: "Equipos de Cómputo (Laptops)" },
      { id: "2.3", code: "2.3", title: "Lectores POS" }
    ]
  },
  {
    id: "3", code: "3", title: "Software y Licencias", color: "#059669", light: "#d1fae5", icon: <Code2 size={16} />,
    children: [
      { id: "3.1", code: "3.1", title: "Entornos de Desarrollo (IDEs, GitHub)" },
      { id: "3.2", code: "3.2", title: "Herramientas de Diseño (Figma)" },
      { id: "3.3", code: "3.3", title: "Sistemas de Base de Datos" }
    ]
  },
  {
    id: "4", code: "4", title: "Materiales e Instalaciones", color: "#d97706", light: "#fef3c7", icon: <Search size={16} />,
    children: [
      { id: "4.1", code: "4.1", title: "Espacio de Trabajo (Virtual/Físico)" }
    ]
  }
];

const INITIAL_NODES: FlatNode[] = [];
const INITIAL_EDGES: { from: string; to: string }[] = [];

INITIAL_NODES.push({
  id: 'root', label: 'EDR: Plataforma Integral de Recaudación\ny Control de Paso UNJFSC',
  code: '1.0', type: 'root', color: '#1e3a5f', light: '#0f172a',
  icon: <Layers size={22} />,
});

function flattenTree(nodes: TreeNodeData[], parentId: string, depth: number, parentColor: string, parentLight: string) {
  nodes.forEach(n => {
    const color = n.color || parentColor;
    const light = n.light || parentLight;
    // Map depth 1 to phase, everything else to task
    const type: NodeType = depth === 1 ? 'phase' : 'task';
    
    INITIAL_NODES.push({
      id: n.id,
      label: n.title,
      code: n.code,
      type,
      color,
      light,
      icon: n.icon,
      tooltip: n.tooltip,
      parentId
    });
    
    INITIAL_EDGES.push({ from: parentId, to: n.id });

    if (n.children) {
      flattenTree(n.children, n.id, depth + 1, color, light);
    }
  });
}

flattenTree(EDR_TREE, 'root', 1, '#1e3a5f', '#0f172a');

// ─────────────────────────────────────────────────────────────
// NODE DIMENSIONS
// ─────────────────────────────────────────────────────────────
const ROOT_W = 400; const ROOT_H = 88;
const PHASE_W = 170; const PHASE_H = 82;
const TASK_W = 170;  const TASK_H = 66;

function nodeSize(type: NodeType) {
  if (type === 'root') return { w: ROOT_W, h: ROOT_H };
  if (type === 'phase') return { w: PHASE_W, h: PHASE_H };
  return { w: TASK_W, h: TASK_H };
}

// ─────────────────────────────────────────────────────────────
// INITIAL LAYOUT
// ─────────────────────────────────────────────────────────────
function buildInitialPositions(): Record<string, Pos> {
  const pos: Record<string, Pos> = {};
  pos['root'] = { x: -ROOT_W / 2, y: -ROOT_H / 2 };

  const level1 = INITIAL_NODES.filter(n => n.parentId === 'root');
  
  const colW = 200;
  const footprints = level1.map(n1 => {
    const l2 = INITIAL_NODES.filter(n => n.parentId === n1.id);
    const hasL3 = l2.some(n2 => INITIAL_NODES.some(n3 => n3.parentId === n2.id));
    if (hasL3) return Math.max(1, l2.length) * colW;
    return colW;
  });

  const totalW = footprints.reduce((acc, w) => acc + w, 0);
  let currentX = -totalW / 2;

  level1.forEach((nodeL1, i1) => {
    const fw = footprints[i1];
    const cxL1 = currentX + fw / 2;
    const s1 = nodeSize(nodeL1.type);
    pos[nodeL1.id] = { x: cxL1 - s1.w / 2, y: ROOT_H / 2 + 60 };

    const level2 = INITIAL_NODES.filter(n => n.parentId === nodeL1.id);
    const hasL3 = level2.some(n2 => INITIAL_NODES.some(n3 => n3.parentId === n2.id));

    if (hasL3) {
      let cxL2 = currentX + colW / 2;
      level2.forEach((nodeL2) => {
        const s2 = nodeSize(nodeL2.type);
        pos[nodeL2.id] = { x: cxL2 - s2.w / 2, y: ROOT_H / 2 + 60 + s1.h + 60 };
        
        const level3 = INITIAL_NODES.filter(n => n.parentId === nodeL2.id);
        level3.forEach((nodeL3, i3) => {
          const s3 = nodeSize(nodeL3.type);
          pos[nodeL3.id] = { x: cxL2 - s3.w / 2, y: ROOT_H / 2 + 60 + s1.h + 60 + s2.h + 40 + i3 * (s3.h + 10) };
        });
        cxL2 += colW;
      });
    } else {
      level2.forEach((nodeL2, i2) => {
        const s2 = nodeSize(nodeL2.type);
        pos[nodeL2.id] = { x: cxL1 - s2.w / 2, y: ROOT_H / 2 + 60 + s1.h + 60 + i2 * (s2.h + 10) };
      });
    }

    currentX += fw;
  });

  return pos;
}

// ─────────────────────────────────────────────────────────────
// SVG EDGE (bezier)
// ─────────────────────────────────────────────────────────────
function Edge({
  from, to, positions, color, nodes
}: {
  from: string; to: string; positions: Record<string, Pos>; color: string; nodes: FlatNode[]
}) {
  const fp = positions[from];
  const tp = positions[to];
  if (!fp || !tp) return null;

  const fromNode = nodes.find(n => n.id === from);
  const toNode = nodes.find(n => n.id === to);
  if (!fromNode || !toNode) return null;

  const fs = nodeSize(fromNode.type);
  const ts = nodeSize(toNode.type);

  const x1 = fp.x + fs.w / 2;
  const y1 = fp.y + fs.h;
  const x2 = tp.x + ts.w / 2;
  const y2 = tp.y;

  const midY = (y1 + y2) / 2;

  return (
    <path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeOpacity={0.5}
      strokeDasharray={fromNode.type === 'phase' ? '5 4' : '0'}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// NODE CARD (foreignObject inside SVG)
// ─────────────────────────────────────────────────────────────
interface NodeCardProps {
  node: FlatNode;
  pos: Pos;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  isDragging: boolean;
  onEditNode: (id: string, code: string, label: string) => void;
  onAddChild: (parentId: string, type: NodeType) => void;
  onDeleteNode: (id: string) => void;
}

function NodeCard({ node, pos, onPointerDown, isDragging, onEditNode, onAddChild, onDeleteNode }: NodeCardProps) {
  const { w, h } = nodeSize(node.type);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(node.code);
  const [editLabel, setEditLabel] = useState(node.label);

  const handlePD = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || isEditing) return;
    e.stopPropagation();
    onPointerDown(e, node.id);
  }, [node.id, onPointerDown, isEditing]);

  const handleSave = (e: React.PointerEvent) => {
    e.stopPropagation();
    onEditNode(node.id, editCode, editLabel);
    setIsEditing(false);
  };

  const handleCancel = (e: React.PointerEvent) => {
    e.stopPropagation();
    setEditCode(node.code);
    setEditLabel(node.label);
    setIsEditing(false);
  };

  const stopProp = (e: React.MouseEvent | React.PointerEvent | React.KeyboardEvent) => {
    e.stopPropagation();
  };

  const btnStyle = {
    background: '#1e293b', color: '#f8fafc', border: '1px solid #334155',
    borderRadius: '50%', width: 24, height: 24, display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    pointerEvents: 'auto' as const
  };

  // We use onPointerDown on buttons to intercept the event before handlePD fires.
  const actionButtons = isHovered && !isEditing && (
    <div style={{ position: 'absolute', top: -12, right: -12, display: 'flex', gap: 4, zIndex: 10 }}>
      {node.type !== 'task' && (
        <button title="Añadir hijo" style={btnStyle} onPointerDown={(e) => { e.stopPropagation(); onAddChild(node.id, node.type === 'root' ? 'phase' : 'task'); }}>
          <Plus size={14} color="#4ade80" />
        </button>
      )}
      <button title="Editar" style={btnStyle} onPointerDown={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        <Edit2 size={14} color="#60a5fa" />
      </button>
      {node.type !== 'root' && (
        <button title="Eliminar" style={btnStyle} onPointerDown={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}>
          <Trash2 size={14} color="#f87171" />
        </button>
      )}
    </div>
  );

  let cardStyle: React.CSSProperties = {
    width: w,
    height: h,
    borderRadius: node.type === 'root' ? 20 : 12,
    cursor: isEditing ? 'default' : (isDragging ? 'grabbing' : 'grab'),
    userSelect: 'none',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    boxSizing: 'border-box',
    transition: isDragging ? 'none' : 'box-shadow 0.15s',
    boxShadow: isDragging
      ? `0 20px 60px ${node.color}55, 0 4px 20px #00000040`
      : `0 4px 20px #00000030`,
    position: 'relative',
    pointerEvents: 'auto'
  };

  if (node.type === 'root') {
    cardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
      border: '2px solid #334155',
      padding: '0 24px',
    };
  } else if (node.type === 'phase') {
    cardStyle = {
      ...cardStyle,
      background: node.color,
      border: `2px solid ${node.color}`,
      padding: '10px 14px',
    };
  } else {
    cardStyle = {
      ...cardStyle,
      background: '#ffffff',
      border: `1.5px solid ${node.color}55`,
      padding: '8px 12px',
      alignItems: 'flex-start',
    };
  }

  return (
    <foreignObject 
      x={pos.x} y={pos.y} width={w} height={h} 
      style={{ overflow: 'visible', pointerEvents: 'none' }}
    >
      <div 
        style={cardStyle} 
        onPointerDown={handlePD}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        title={node.tooltip}
      >
        {actionButtons}
        
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', height: '100%', justifyContent: 'center' }} onPointerDown={stopProp} onClick={stopProp}>
            <input 
              value={editCode} onChange={e => setEditCode(e.target.value)} 
              style={{ fontSize: 10, padding: 2, borderRadius: 4, border: '1px solid #ccc', color: '#000', pointerEvents: 'auto' }}
              onKeyDown={stopProp}
            />
            <textarea 
              value={editLabel} onChange={e => setEditLabel(e.target.value)}
              style={{ fontSize: 11, padding: 2, borderRadius: 4, border: '1px solid #ccc', flex: 1, resize: 'none', color: '#000', pointerEvents: 'auto' }}
              onKeyDown={stopProp}
            />
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
              <button onPointerDown={handleCancel} style={{ padding: '2px 4px', background: '#f87171', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', pointerEvents: 'auto' }}><X size={12}/></button>
              <button onPointerDown={handleSave} style={{ padding: '2px 4px', background: '#4ade80', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', pointerEvents: 'auto' }}><Check size={12}/></button>
            </div>
          </div>
        ) : (
          <>
            {node.type === 'root' && (
              <>
                <div style={{ color: '#60a5fa' }}>{node.icon}</div>
                <span style={{ color: '#60a5fa', fontSize: 9, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 3, background: '#1e293b', padding: '2px 10px', borderRadius: 99, border: '1px solid #334155' }}>
                  {node.code}
                </span>
                <span style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 13, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'pre-line' }}>
                  {node.label}
                </span>
              </>
            )}
            {node.type === 'phase' && (
              <>
                <div style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{node.icon || <Flag size={16}/>}</div>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 9, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2 }}>
                  {node.code}
                </span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 1.2 }}>
                  {node.label}
                </span>
              </>
            )}
            {node.type === 'task' && (
              <>
                <span style={{ color: node.color, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1.5, background: node.light, padding: '1px 7px', borderRadius: 99, marginBottom: 4 }}>
                  {node.code}
                </span>
                <span style={{ color: '#1e293b', fontWeight: 600, fontSize: 11, lineHeight: 1.35 }}>
                  {node.label}
                </span>
              </>
            )}
          </>
        )}
      </div>
    </foreignObject>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────
export default function EdrDiagram() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [nodes, setNodes] = useState<FlatNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<{from: string, to: string}[]>(INITIAL_EDGES);
  const [positions, setPositions] = useState<Record<string, Pos>>(buildInitialPositions);
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.72);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const stateRef = useRef({
    pan: { x: 0, y: 0 },
    zoom: 0.72,
    positions: buildInitialPositions(),
    draggingId: null as string | null,
    isPanning: false,
    lastX: 0,
    lastY: 0,
    capturedPointerId: null as number | null,
  });

  useEffect(() => { stateRef.current.pan = pan; }, [pan]);
  useEffect(() => { stateRef.current.zoom = zoom; }, [zoom]);
  useEffect(() => { stateRef.current.positions = positions; }, [positions]);

  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const newPan = { x: vw / 2, y: vh / 2 - 30 };
    setPan(newPan);
    stateRef.current.pan = newPan;
  }, []);

  // ── Node interactions ──
  const handleEditNode = useCallback((id: string, newCode: string, newLabel: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, code: newCode, label: newLabel } : n));
  }, []);

  const handleAddChild = useCallback((parentId: string, type: NodeType) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newId = `node_${Date.now()}`;
    const parentPos = positions[parentId] || { x: 0, y: 0 };
    
    // Default styles for new nodes
    const color = type === 'phase' ? '#6366f1' : parentNode.color;
    const light = type === 'phase' ? '#e0e7ff' : parentNode.light;
    
    const newNode: FlatNode = {
      id: newId,
      parentId,
      type,
      code: 'Nuevo',
      label: 'Nueva Tarea',
      color,
      light
    };

    const newPos = {
      x: parentPos.x + 20,
      y: parentPos.y + (type === 'phase' ? 120 : 80)
    };

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, { from: parentId, to: newId }]);
    setPositions(prev => {
      const nextPos = { ...prev, [newId]: newPos };
      stateRef.current.positions = nextPos;
      return nextPos;
    });
  }, [nodes, positions]);

  const handleDeleteNode = useCallback((id: string) => {
    // Find all descendants
    const toDelete = new Set<string>([id]);
    let added = true;
    while(added) {
      added = false;
      nodes.forEach(n => {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          added = true;
        }
      });
    }

    setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
    setEdges(prev => prev.filter(e => !toDelete.has(e.from) && !toDelete.has(e.to)));
    setPositions(prev => {
      const nextPos = { ...prev };
      toDelete.forEach(did => delete nextPos[did]);
      stateRef.current.positions = nextPos;
      return nextPos;
    });
  }, [nodes]);


  // ── Dragging logic ──
  const handleNodePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const svg = svgRef.current;
    if (!svg) return;
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    stateRef.current.draggingId = id;
    stateRef.current.isPanning = false;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
    stateRef.current.capturedPointerId = e.pointerId;
    setDraggingId(id);
  }, []);

  const handleSVGPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 2 || (e.button === 0 && !stateRef.current.draggingId)) {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      svg.setPointerCapture(e.pointerId);
      stateRef.current.isPanning = true;
      stateRef.current.draggingId = null;
      stateRef.current.lastX = e.clientX;
      stateRef.current.lastY = e.clientY;
      stateRef.current.capturedPointerId = e.pointerId;
      setDraggingId(null);
    }
  }, []);

  const handleSVGPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const s = stateRef.current;
    if (!s.capturedPointerId) return;

    const dx = e.clientX - s.lastX;
    const dy = e.clientY - s.lastY;
    s.lastX = e.clientX;
    s.lastY = e.clientY;

    if (s.isPanning) {
      const newPan = { x: s.pan.x + dx, y: s.pan.y + dy };
      s.pan = newPan;
      setPan(newPan);
    } else if (s.draggingId) {
      const id = s.draggingId;
      const cur = s.positions[id];
      if (!cur) return;
      const newPos = { x: cur.x + dx / s.zoom, y: cur.y + dy / s.zoom };
      s.positions = { ...s.positions, [id]: newPos };
      setPositions({ ...s.positions });
    }
  }, []);

  const handleSVGPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (svg?.hasPointerCapture(e.pointerId)) {
      svg.releasePointerCapture(e.pointerId);
    }
    stateRef.current.isPanning = false;
    stateRef.current.draggingId = null;
    stateRef.current.capturedPointerId = null;
    setDraggingId(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    const s = stateRef.current;
    const newZoom = Math.min(3, Math.max(0.15, s.zoom * factor));

    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const newPan = {
        x: cx - (cx - s.pan.x) * (newZoom / s.zoom),
        y: cy - (cy - s.pan.y) * (newZoom / s.zoom),
      };
      s.pan = newPan;
      setPan(newPan);
    }

    s.zoom = newZoom;
    setZoom(newZoom);
  }, []);

  const resetView = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const newPan = { x: vw / 2, y: vh / 2 - 30 };
    setPan(newPan);
    setZoom(0.72);
    stateRef.current.pan = newPan;
    stateRef.current.zoom = 0.72;
  }, []);

  const cursorStyle = stateRef.current.isPanning
    ? 'grabbing'
    : draggingId
      ? 'grabbing'
      : 'default';

  return (
    <div
      style={{
        width: '100vw', height: '100vh', overflow: 'hidden',
        background: '#070d1a',
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% 0%, #1e3a5f22 0%, transparent 70%),
          radial-gradient(circle at 1px 1px, rgba(148,163,184,0.07) 1px, transparent 0)
        `,
        backgroundSize: 'auto, 28px 28px',
        cursor: cursorStyle,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onWheel={handleWheel as any}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg
        ref={svgRef}
        width="100%" height="100%"
        style={{ display: 'block', touchAction: 'none' }}
        onPointerDown={handleSVGPointerDown}
        onPointerMove={handleSVGPointerMove}
        onPointerUp={handleSVGPointerUp}
        onPointerCancel={handleSVGPointerUp}
      >
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {edges.map(({ from, to }, idx) => {
            const toNode = nodes.find(n => n.id === to);
            return (
              <Edge
                key={`${from}-${to}-${idx}`}
                from={from} to={to}
                positions={positions}
                color={toNode?.color ?? '#64748b'}
                nodes={nodes}
              />
            );
          })}

          {/* Nodes */}
          {[...nodes].reverse().map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            return (
              <NodeCard
                key={node.id}
                node={node}
                pos={pos}
                onPointerDown={handleNodePointerDown}
                isDragging={draggingId === node.id}
                onEditNode={handleEditNode}
                onAddChild={handleAddChild}
                onDeleteNode={handleDeleteNode}
              />
            );
          })}
        </g>
      </svg>

      {/* ── Controls ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 50,
      }}>
        {([
          { icon: <ZoomIn size={16} />, fn: () => { const nz = Math.min(3, stateRef.current.zoom * 1.2); setZoom(nz); stateRef.current.zoom = nz; }, label: 'Zoom In' },
          { icon: <ZoomOut size={16} />, fn: () => { const nz = Math.max(0.15, stateRef.current.zoom * 0.83); setZoom(nz); stateRef.current.zoom = nz; }, label: 'Zoom Out' },
          { icon: <RotateCcw size={16} />, fn: resetView, label: 'Centrar' },
        ] as const).map(({ icon, fn, label }) => (
          <button
            key={label}
            onClick={fn}
            title={label}
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,23,42,0.9)',
              backdropFilter: 'blur(10px)',
              color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              fontSize: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            {icon}
          </button>
        ))}
      </div>

      <div style={{
        position: 'fixed', bottom: 24, left: 24,
        color: '#475569', fontSize: 11, fontFamily: 'monospace',
        background: 'rgba(7,13,26,0.8)', padding: '4px 10px', borderRadius: 8,
        backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {Math.round(zoom * 100)}%
      </div>

      <div style={{
        position: 'fixed', top: 18, left: 20,
        color: '#64748b', fontSize: 12, fontWeight: 700, letterSpacing: 2,
        textTransform: 'uppercase',
      }}>
        EDR · Interactivo
      </div>

      <div style={{
        position: 'fixed', top: 18,
        left: '50%', transform: 'translateX(-50%)',
        color: '#475569', fontSize: 11,
        background: 'rgba(7,13,26,0.8)',
        padding: '5px 18px', borderRadius: 99,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 16, whiteSpace: 'nowrap',
      }}>
        <span>🖱️ <b style={{ color: '#64748b' }}>Arrastrar</b></span>
        <span>✨ <b style={{ color: '#64748b' }}>Hover para editar/añadir</b></span>
        <span>✥ <b style={{ color: '#64748b' }}>Click der pan</b></span>
      </div>


    </div>
  );
}