import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

const App = () => {
  const networkRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showServiceLibrary, setShowServiceLibrary] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionMode, setConnectionMode] = useState(false);
  const [sourceNode, setSourceNode] = useState(null);

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
          margin: 8,
          font: { size: 11, color: '#24292f', face: 'Helvetica Neue' },
          borderWidth: 1,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.1)',
            size: 3,
            x: 1,
            y: 1
          }
        },
        edges: {
          font: { size: 9, color: '#656d76', face: 'Helvetica Neue' },
          arrows: { to: { enabled: true, scaleFactor: 0.8 } },
          color: { color: '#8c959f', highlight: '#0969da' },
          width: 1,
          smooth: { type: 'continuous', roundness: 0.2 }
        },
        groups: {
          server: { color: { background: '#dcfce7', border: '#16a34a' } },
          app: { color: { background: '#dbeafe', border: '#2563eb' } },
          database: { color: { background: '#fef3c7', border: '#d97706' } },
          network: { color: { background: '#f3e8ff', border: '#9333ea' } },
          cache: { color: { background: '#fee2e2', border: '#dc2626' } },
          storage: { color: { background: '#f1f5f9', border: '#64748b' } },
          api: { color: { background: '#ecfdf5', border: '#059669' } },
          devops: { color: { background: '#ede9fe', border: '#7c3aed' } }
        },
        physics: { enabled: false },
        interaction: { 
          dragNodes: true, 
          selectConnectedEdges: false,
          hover: true
        }
      };

      const net = new Network(networkRef.current, data, options);
      
      net.on('click', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.find(n => n.id === nodeId);
          
          if (!sourceNode) {
            // İlk node seçimi - bağlantı başlat
            setSourceNode(node);
            setSelectedNode(node);
            setConnectionMode(true);
            
            // Cursor değiştir
            const canvas = net.canvas.frame.canvas;
            canvas.style.cursor = 'crosshair';
          } else if (sourceNode.id !== nodeId) {
            // İkinci node - bağlantı oluştur
            createConnection(sourceNode.id, nodeId);
            
            // Kilitlenme efekti
            const canvas = net.canvas.frame.canvas;
            canvas.style.cursor = 'grab';
            setTimeout(() => {
              canvas.style.cursor = 'default';
              setConnectionMode(false);
              setSourceNode(null);
              setSelectedNode(node);
            }, 300);
          } else {
            // Aynı node - iptal
            cancelConnection();
          }
        } else {
          // Boş alan - iptal
          cancelConnection();
        }
      });

      net.on('doubleClick', (params) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const node = nodes.find(n => n.id === nodeId);
          setSelectedNode(node);
          setShowEditor(true);
        } else if (params.edges.length > 0) {
          // Edge'e çift tıklandı, sil
          const edgeId = params.edges[0];
          if (confirm('Bağlantıyı silmek istiyor musunuz?')) {
            setEdges(edges.filter((_, index) => index !== edgeId));
          }
        }
      });

      setNetwork(net);
    }
  }, [nodes, edges]);

  const serviceLibrary = [
    // Development & CI/CD
    { name: 'GitLab', logo: '🦊', category: 'devops', color: '#FC6D26' },
    { name: 'GitHub', logo: '🐙', category: 'devops', color: '#181717' },
    { name: 'Jenkins', logo: '👷', category: 'devops', color: '#D33833' },
    { name: 'Docker', logo: '🐳', category: 'devops', color: '#2496ED' },
    { name: 'Kubernetes', logo: '☸️', category: 'network', color: '#326CE5' },
    
    // Databases
    { name: 'PostgreSQL', logo: '🐘', category: 'database', color: '#336791' },
    { name: 'MySQL', logo: '🐬', category: 'database', color: '#4479A1' },
    { name: 'MongoDB', logo: '🍃', category: 'database', color: '#47A248' },
    { name: 'Redis', logo: '🔴', category: 'cache', color: '#DC382D' },
    { name: 'Elasticsearch', logo: '🔍', category: 'database', color: '#005571' },
    
    // Web Servers
    { name: 'nginx', logo: '🌐', category: 'server', color: '#009639' },
    { name: 'Apache', logo: '🪶', category: 'server', color: '#D22128' },
    { name: 'Traefik', logo: '🚦', category: 'network', color: '#24A1C1' },
    
    // Cloud Services
    { name: 'AWS S3', logo: '☁️', category: 'storage', color: '#FF9900' },
    { name: 'AWS Lambda', logo: '⚡', category: 'app', color: '#FF9900' },
    { name: 'AWS RDS', logo: '🗄️', category: 'database', color: '#FF9900' },
    
    // Monitoring
    { name: 'Prometheus', logo: '🔥', category: 'network', color: '#E6522C' },
    { name: 'Grafana', logo: '📊', category: 'network', color: '#F46800' },
    { name: 'Jaeger', logo: '🔍', category: 'network', color: '#60D0E4' },
    
    // Message Queues
    { name: 'RabbitMQ', logo: '🐰', category: 'network', color: '#FF6600' },
    { name: 'Apache Kafka', logo: '📨', category: 'network', color: '#231F20' },
    
    // Programming Languages
    { name: 'Node.js', logo: '💚', category: 'app', color: '#339933' },
    { name: 'Python', logo: '🐍', category: 'app', color: '#3776AB' },
    { name: 'Java', logo: '☕', category: 'app', color: '#007396' },
    { name: 'Go', logo: '🐹', category: 'app', color: '#00ADD8' },
    { name: 'PHP', logo: '🐘', category: 'app', color: '#777BB4' }
  ];

  const filteredServices = serviceLibrary.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addNode = (service = null) => {
    const newId = Math.max(...nodes.map(n => n.id)) + 1;
    const newNode = {
      id: newId,
      label: service ? `${service.logo} ${service.name}` : `Yeni Servis ${newId}`,
      group: service ? service.category : 'app',
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200
    };
    setNodes([...nodes, newNode]);
    if (service) {
      setShowServiceLibrary(false);
      setSearchTerm('');
    }
  };

  const createConnection = (fromId, toId) => {
    // Aynı bağlantı var mı kontrol et
    const existingEdge = edges.find(e => 
      (e.from === fromId && e.to === toId) || 
      (e.from === toId && e.to === fromId)
    );
    
    if (!existingEdge) {
      const newEdge = {
        from: fromId,
        to: toId,
        label: 'Bağlantı'
      };
      setEdges([...edges, newEdge]);
    }
  };

  const cancelConnection = () => {
    setConnectionMode(false);
    setSourceNode(null);
    setSelectedNode(null);
    
    if (network) {
      const canvas = network.canvas.frame.canvas;
      canvas.style.cursor = 'default';
    }
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
          <div className="toolbar-left">
            <h2 className="topology-title">🗺️ İnfra Topoloji Haritası</h2>
          </div>
          
          <div className="toolbar-center">
            <div className="service-library-container">
              <button 
                onClick={() => setShowServiceLibrary(!showServiceLibrary)}
                className={`topology-btn library ${showServiceLibrary ? 'active' : ''}`}
              >
                📚 Servis Kütüphanesi
              </button>
              
              {showServiceLibrary && (
                <div className="service-library-dropdown">
                  <div className="service-search-container">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="service-search-input"
                      placeholder="🔍 Servis ara... (gitlab, docker, nginx)"
                    />
                  </div>
                  <div className="service-grid-advanced">
                    {filteredServices.map((service, index) => (
                      <div 
                        key={index}
                        className="service-card"
                        onClick={() => addNode(service)}
                        style={{ '--service-color': service.color }}
                      >
                        <div className="service-icon">{service.logo}</div>
                        <div className="service-info">
                          <span className="service-name">{service.name}</span>
                          <span className="service-category">{service.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="toolbar-right">
            <button onClick={() => addNode()} className="topology-btn add">
              + Manuel Ekle
            </button>
            {connectionMode && (
              <button 
                onClick={cancelConnection}
                className="topology-btn cancel"
              >
                ❌ Bağlantıyı İptal Et
              </button>
            )}
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
                {showEditor ? '📋 Harita' : '✏️ Düzenle'}
              </button>
            )}
          </div>
        </div>
        
        {(selectedNode || connectionMode) && (
          <div className="selected-node-bar">
            {connectionMode && sourceNode ? (
              <>
                <span className="selected-label">🔗 Bağlantı Modu:</span>
                <span className="selected-name">
                  {sourceNode.label.replace('\n', ' ')} → Hedef node'a tıklayın
                </span>
              </>
            ) : selectedNode ? (
              <>
                <span className="selected-label">Seçili Node:</span>
                <span className="selected-name">{selectedNode.label.replace('\n', ' ')}</span>
                <span className="selected-type">{selectedNode.group}</span>
                <span className="connection-hint">💡 Bağlantı için tekrar tıklayın</span>
              </>
            ) : null}
          </div>
        )}
        
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

  useEffect(() => {
    setNodeData(selectedNode);
  }, [selectedNode]);

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
          value={nodeData?.label || ''}
          onChange={(e) => setNodeData({...nodeData, label: e.target.value})}
          className="editor-input-clean"
          placeholder="Örn: 🐳 Docker veya Web Server (nginx)"
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