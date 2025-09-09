import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

const App = () => {
  const networkRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const [nodes, setNodes] = useState([
    { id: 1, label: 'Load Balancer\n(HAProxy)', group: 'network', x: 0, y: -200 },
    { id: 2, label: 'Web Server\n(nginx)', group: 'server', x: -150, y: 0 },
    { id: 3, label: 'App Server\n(Node.js)', group: 'app', x: 150, y: 0 },
    { id: 4, label: 'Database\n(PostgreSQL)', group: 'database', x: 0, y: 200 },
    { id: 5, label: 'Cache\n(Redis)', group: 'cache', x: -200, y: 200 },
    { id: 6, label: 'Storage\n(S3)', group: 'storage', x: 200, y: 200 }
  ]);

  const [edges, setEdges] = useState([
    { from: 1, to: 2, label: 'HTTP' },
    { from: 1, to: 3, label: 'HTTP' },
    { from: 2, to: 3, label: 'Proxy' },
    { from: 3, to: 4, label: 'SQL' },
    { from: 3, to: 5, label: 'Cache' },
    { from: 3, to: 6, label: 'Files' }
  ]);

  useEffect(() => {
    if (networkRef.current) {
      const data = { nodes, edges };
      const options = {
        nodes: {
          shape: 'box',
          margin: 10,
          font: { size: 12, color: '#fff' },
          borderWidth: 2,
          shadow: true
        },
        edges: {
          font: { size: 10, align: 'middle' },
          arrows: { to: { enabled: true } },
          smooth: { type: 'continuous' }
        },
        groups: {
          server: { color: { background: '#4CAF50', border: '#2E7D32' } },
          app: { color: { background: '#2196F3', border: '#1565C0' } },
          database: { color: { background: '#FF9800', border: '#E65100' } },
          network: { color: { background: '#9C27B0', border: '#4A148C' } },
          cache: { color: { background: '#F44336', border: '#B71C1C' } },
          storage: { color: { background: '#795548', border: '#3E2723' } },
          api: { color: { background: '#607D8B', border: '#263238' } }
        },
        physics: { enabled: false },
        interaction: { dragNodes: true, selectConnectedEdges: false }
      };

      const net = new Network(networkRef.current, data, options);
      
      net.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.find(n => n.id === nodeId);
          setSelectedNode(node);
        } else {
          setSelectedNode(null);
        }
      });

      net.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.find(n => n.id === nodeId);
          setSelectedNode(node);
          setShowEditor(true);
        }
      });

      setNetwork(net);
    }
  }, [nodes, edges]);

  const addNode = () => {
    const newId = Math.max(...nodes.map(n => n.id)) + 1;
    const newNode = {
      id: newId,
      label: `Yeni Servis ${newId}`,
      group: 'app',
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200
    };
    setNodes([...nodes, newNode]);
  };

  const updateNode = (updatedNode) => {
    setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
    setSelectedNode(updatedNode);
    setShowEditor(false);
  };

  const deleteNode = (nodeId) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    setSelectedNode(null);
    setShowEditor(false);
  };

  const exportTopology = () => {
    const topology = { nodes, edges };
    const dataStr = JSON.stringify(topology, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'topology.json';
    link.click();
  };

  const importTopology = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const topology = JSON.parse(e.target.result);
          if (topology.nodes && topology.edges) {
            setNodes(topology.nodes);
            setEdges(topology.edges);
          }
        } catch (error) {
          alert('Geçersiz dosya formatı!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="topology-container">
      <div className="topology-main">
        <div className="topology-toolbar">
          <h2 className="topology-title">🗺️ İnfra Topoloji Haritası</h2>
          <button onClick={addNode} className="topology-btn add">
            + Servis Ekle
          </button>
          <button onClick={exportTopology} className="topology-btn export">
            📥 Dışa Aktar
          </button>
          <label className="topology-btn import">
            📤 İçe Aktar
            <input 
              type="file" 
              accept=".json" 
              onChange={importTopology}
              style={{ display: 'none' }}
            />
          </label>
          {selectedNode && (
            <button 
              onClick={() => setShowEditor(!showEditor)} 
              className={`topology-btn edit ${showEditor ? 'active' : ''}`}
            >
              {showEditor ? '📋 Haritayı Göster' : '✏️ Düzenle'}
            </button>
          )}
          {selectedNode && (
            <div className="selected-node-info">
              Seçili: {selectedNode.label.replace('\n', ' ')}
            </div>
          )}
        </div>
        
        <div ref={networkRef} className="topology-canvas" />
        
        <div className="topology-footer">
          💡 İpucu: Node'ları sürükleyebilir, tek tık ile seçebilir, çift tık ile düzenleyebilirsiniz
        </div>
      </div>
      
      {showEditor && selectedNode && (
        <div className="topology-sidebar">
          <NodeEditor 
            selectedNode={selectedNode}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
          />
        </div>
      )}
    </div>
  );
};

const NodeEditor = ({ selectedNode, onUpdateNode, onDeleteNode }) => {
  const [nodeData, setNodeData] = useState(selectedNode);

  const nodeTypes = [
    { value: 'server', label: '🖥️ Web Server' },
    { value: 'app', label: '⚙️ App Server' },
    { value: 'database', label: '🗄️ Database' },
    { value: 'network', label: '🌐 Network' },
    { value: 'cache', label: '⚡ Cache' },
    { value: 'storage', label: '💾 Storage' },
    { value: 'api', label: '🔌 API Gateway' }
  ];

  const handleSave = () => {
    if (onUpdateNode && nodeData.id) {
      onUpdateNode(nodeData);
    }
  };

  const handleDelete = () => {
    if (onDeleteNode && nodeData.id) {
      onDeleteNode(nodeData.id);
    }
  };

  return (
    <div className="node-editor">
      <h3>✏️ Node Düzenle</h3>
      
      <div className="editor-field">
        <label className="editor-label">📝 Node Adı:</label>
        <input
          type="text"
          value={nodeData.label || ''}
          onChange={(e) => setNodeData({...nodeData, label: e.target.value})}
          className="editor-input"
          placeholder="Örn: Web Server (nginx)"
        />
      </div>

      <div className="editor-field">
        <label className="editor-label">🎨 Node Tipi:</label>
        <select
          value={nodeData.group || 'server'}
          onChange={(e) => setNodeData({...nodeData, group: e.target.value})}
          className="editor-input"
        >
          {nodeTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="editor-actions">
        <button onClick={handleSave} className="editor-btn save">
          💾 Kaydet
        </button>
        <button onClick={handleDelete} className="editor-btn delete">
          🗑️ Sil
        </button>
      </div>
    </div>
  );
};

export default App;