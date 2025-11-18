# Web-Based 3D Platform - System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER (Browser)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   React App     │  │  Three.js/R3F   │  │  WebSocket      │             │
│  │   (UI/UX)       │  │  (3D Rendering) │  │  Client         │             │
│  │                 │  │                 │  │                 │             │
│  │  - File Upload  │  │  - WebGL/WebGPU │  │  - Real-time    │             │
│  │  - UI Controls  │  │  - Model Viewer │  │    Sync         │             │
│  │  - Dashboard    │  │  - CSG Ops      │  │  - Collab       │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                     │                      │
│           └────────────────────┴─────────────────────┘                      │
│                                │                                            │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 │ HTTPS/WSS
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                              EDGE LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │                    CloudFlare CDN                             │           │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │           │
│  │  │   DDoS      │  │  Edge Cache  │  │   WAF        │        │           │
│  │  │  Protection │  │  - 3D Models │  │  (Firewall)  │        │           │
│  │  │             │  │  - Textures  │  │              │        │           │
│  │  └─────────────┘  └──────────────┘  └──────────────┘        │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌────────▼────────┐   ┌──────────▼─────────┐   ┌────────▼────────┐
│  Static Assets  │   │   API Gateway      │   │  WebSocket      │
│  (Vercel/       │   │   Load Balancer    │   │  Load Balancer  │
│   Netlify)      │   │   (nginx/ALB)      │   │  (nginx)        │
│                 │   │                    │   │                 │
│  - React Build  │   │  - Rate Limiting   │   │  - Sticky       │
│  - Static HTML  │   │  - Auth Middleware │   │    Sessions     │
│  - Assets       │   │  - CORS            │   │  - Health Check │
└─────────────────┘   └──────────┬─────────┘   └────────┬────────┘
                                 │                       │
┌────────────────────────────────┴───────────────────────┴────────────────────┐
│                           APPLICATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   API Server 1   │  │   API Server 2   │  │   API Server N   │          │
│  │   (Node.js)      │  │   (Node.js)      │  │   (Node.js)      │          │
│  │                  │  │                  │  │                  │          │
│  │  - REST API      │  │  - REST API      │  │  - REST API      │          │
│  │  - Auth Service  │  │  - Auth Service  │  │  - Auth Service  │          │
│  │  - File Handler  │  │  - File Handler  │  │  - File Handler  │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                      │                    │
│           └─────────────────────┴──────────────────────┘                    │
│                                 │                                           │
│  ┌──────────────────┐  ┌────────▼─────────┐  ┌──────────────────┐          │
│  │  WS Server 1     │  │  WS Server 2     │  │  WS Server N     │          │
│  │  (Socket.io)     │  │  (Socket.io)     │  │  (Socket.io)     │          │
│  │                  │  │                  │  │                  │          │
│  │  - Real-time     │  │  - Real-time     │  │  - Real-time     │          │
│  │    Sync          │  │    Sync          │  │    Sync          │          │
│  │  - Collaboration │  │  - Collaboration │  │  - Collaboration │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                      │                    │
│           └─────────────────────┴──────────────────────┘                    │
│                                 │                                           │
│                       ┌─────────▼──────────┐                                │
│                       │   Redis Pub/Sub    │                                │
│                       │   (Message Broker) │                                │
│                       │                    │                                │
│                       │  - Channel Routing │                                │
│                       │  - Session Store   │                                │
│                       │  - Cache Layer     │                                │
│                       └─────────┬──────────┘                                │
│                                 │                                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                        PROCESSING LAYER (Optional)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │              GPU-Accelerated Rendering Cluster                │           │
│  │                                                               │           │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │           │
│  │  │  GPU Worker 1  │  │  GPU Worker 2  │  │  GPU Worker N  │ │           │
│  │  │  (H100/A100)   │  │  (H100/A100)   │  │  (H100/A100)   │ │           │
│  │  │                │  │                │  │                │ │           │
│  │  │  - Server-side │  │  - Server-side │  │  - Server-side │ │           │
│  │  │    Rendering   │  │    Rendering   │  │    Rendering   │ │           │
│  │  │  - Mesh        │  │  - Mesh        │  │  - Mesh        │ │           │
│  │  │    Processing  │  │    Processing  │  │    Processing  │ │           │
│  │  │  - G-code Gen  │  │  - G-code Gen  │  │  - G-code Gen  │ │           │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │           │
│  │                                                               │           │
│  │  Provider: IndiaAI Compute / Google Cloud GPU                │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                            DATA LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐       │
│  │   PostgreSQL      │  │  Object Storage   │  │   Redis Cache     │       │
│  │   (Cloud SQL)     │  │  (R2/GCS)         │  │                   │       │
│  │                   │  │                   │  │                   │       │
│  │  - Users          │  │  - 3D Models      │  │  - Session Data   │       │
│  │  - Projects       │  │  - Textures       │  │  - Query Cache    │       │
│  │  - Model Metadata │  │  - User Uploads   │  │  - Rate Limits    │       │
│  │  - Print Jobs     │  │  - Exports        │  │                   │       │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │
│  │   OctoPrint    │  │    Klipper     │  │   Bambu Lab    │                │
│  │   (REST API)   │  │   (Moonraker)  │  │   (Proprietary)│                │
│  └────────────────┘  └────────────────┘  └────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Model Upload and Processing Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. Upload STL file
     ▼
┌──────────────┐
│  API Server  │
└──────┬───────┘
       │
       │ 2. Validate file
       │ 3. Generate metadata
       ▼
┌────────────────┐
│ Object Storage │
└──────┬─────────┘
       │
       │ 4. Store original
       │ 5. Convert to GLB
       │ 6. Compress with Draco
       ▼
┌────────────────┐
│   PostgreSQL   │
└──────┬─────────┘
       │
       │ 7. Save metadata
       ▼
┌─────────────┐
│  CDN Cache  │
└──────┬──────┘
       │
       │ 8. Distribute globally
       ▼
┌─────────┐
│ Browser │ 9. Display model
└─────────┘
```

### 2. Real-Time Collaboration Flow

```
User A Browser          WebSocket Server         Redis Pub/Sub         User B Browser
      │                        │                        │                     │
      │ 1. Edit mesh           │                        │                     │
      ├───────────────────────>│                        │                     │
      │                        │                        │                     │
      │                        │ 2. Publish to channel  │                     │
      │                        ├───────────────────────>│                     │
      │                        │                        │                     │
      │                        │                        │ 3. Broadcast        │
      │                        │                        ├────────────────────>│
      │                        │                        │                     │
      │                        │ 4. Receive update      │                     │
      │                        │<───────────────────────┤                     │
      │                        │                        │                     │
      │ 5. Echo confirmation   │                        │                     │
      │<───────────────────────┤                        │                     │
      │                        │                        │                     │
```

### 3. 3D Printer Integration Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. Finalize model
     ▼
┌──────────────┐
│  API Server  │
└──────┬───────┘
       │
       │ 2. Generate G-code
       ▼
┌──────────────┐
│ GPU Worker   │ (Optional: complex slicing)
└──────┬───────┘
       │
       │ 3. G-code ready
       ▼
┌──────────────┐
│ OctoPrint/   │
│ Klipper API  │
└──────┬───────┘
       │
       │ 4. Upload file
       │ 5. Start print
       ▼
┌──────────────┐
│ 3D Printer   │
└──────┬───────┘
       │
       │ 6. WebSocket updates
       │    (temp, progress)
       ▼
┌──────────────┐
│   Browser    │ 7. Live monitoring
└──────────────┘
```

---

## Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── 3D/
│   │   ├── ModelViewer.tsx          # Main 3D canvas component
│   │   ├── SceneControls.tsx        # Camera, lighting controls
│   │   ├── TransformTools.tsx       # Move, rotate, scale tools
│   │   ├── CSGOperations.tsx        # Boolean operations UI
│   │   ├── MaterialEditor.tsx       # Texture/material editing
│   │   └── MeshInspector.tsx        # Mesh info, stats
│   │
│   ├── Editor/
│   │   ├── ParametricEditor.tsx     # Dimension editing
│   │   ├── PointCloudProcessor.tsx  # Point cloud to mesh
│   │   ├── FileConverter.tsx        # Format conversion UI
│   │   └── NodeEditor.tsx           # Shader node editor
│   │
│   ├── Printer/
│   │   ├── PrinterConnection.tsx    # Connect to printer
│   │   ├── GCodeGenerator.tsx       # Slicing settings
│   │   ├── PrintMonitor.tsx         # Live print status
│   │   └── PrinterSettings.tsx      # Printer configuration
│   │
│   ├── Collaboration/
│   │   ├── UserPresence.tsx         # Show active users
│   │   ├── ChatPanel.tsx            # Real-time chat
│   │   └── VersionHistory.tsx       # Model versions
│   │
│   └── UI/
│       ├── Toolbar.tsx              # Main toolbar
│       ├── Sidebar.tsx              # Settings panel
│       ├── ProgressIndicator.tsx    # Loading states
│       └── FileUploader.tsx         # Drag-drop upload
│
├── hooks/
│   ├── use3DScene.ts                # Three.js scene management
│   ├── useModelLoader.ts            # Model loading hook
│   ├── useWebSocket.ts              # Real-time connection
│   ├── useCSGOperation.ts           # Boolean operations
│   └── usePrinterAPI.ts             # Printer communication
│
├── services/
│   ├── api/
│   │   ├── modelService.ts          # Model CRUD operations
│   │   ├── authService.ts           # Authentication
│   │   └── printerService.ts        # Printer API calls
│   │
│   ├── 3d/
│   │   ├── meshProcessor.ts         # Mesh operations
│   │   ├── formatConverter.ts       # File conversion
│   │   ├── gcodeGenerator.ts        # G-code generation
│   │   └── surfaceReconstructor.ts  # Point cloud processing
│   │
│   └── websocket/
│       ├── socketClient.ts          # Socket.io client
│       └── collaborationSync.ts     # Sync logic
│
└── utils/
    ├── three/
    │   ├── geometryUtils.ts         # Geometry helpers
    │   ├── materialUtils.ts         # Material helpers
    │   └── exporters.ts             # Export utilities
    │
    └── validation/
        ├── fileValidator.ts         # File validation
        └── meshValidator.ts         # Mesh validation
```

### Backend Components

```
backend/
├── api/
│   ├── routes/
│   │   ├── models.ts                # Model endpoints
│   │   ├── users.ts                 # User management
│   │   ├── projects.ts              # Project CRUD
│   │   └── printers.ts              # Printer integration
│   │
│   ├── middleware/
│   │   ├── auth.ts                  # JWT authentication
│   │   ├── rateLimit.ts             # Rate limiting
│   │   ├── fileUpload.ts            # Multer config
│   │   └── errorHandler.ts          # Error handling
│   │
│   └── controllers/
│       ├── modelController.ts       # Model logic
│       ├── userController.ts        # User logic
│       └── printerController.ts     # Printer logic
│
├── websocket/
│   ├── server.ts                    # Socket.io server
│   ├── handlers/
│   │   ├── collaborationHandler.ts  # Collab events
│   │   ├── meshSyncHandler.ts       # Mesh updates
│   │   └── printerHandler.ts        # Printer events
│   │
│   └── middleware/
│       ├── socketAuth.ts            # Socket authentication
│       └── roomManager.ts           # Room management
│
├── services/
│   ├── storage/
│   │   ├── s3Service.ts             # Object storage
│   │   └── cacheService.ts          # Redis cache
│   │
│   ├── processing/
│   │   ├── meshProcessor.ts         # Server-side mesh ops
│   │   ├── formatConverter.ts       # Format conversion
│   │   └── gcodeService.ts          # G-code generation
│   │
│   └── external/
│       ├── octoprintClient.ts       # OctoPrint API
│       └── klipperClient.ts         # Klipper API
│
├── database/
│   ├── models/
│   │   ├── User.ts                  # User model
│   │   ├── Project.ts               # Project model
│   │   ├── Model3D.ts               # 3D model model
│   │   └── PrintJob.ts              # Print job model
│   │
│   └── migrations/
│       └── *.sql                    # Database migrations
│
└── config/
    ├── database.ts                  # DB config
    ├── redis.ts                     # Redis config
    └── storage.ts                   # Storage config
```

---

## Scaling Strategy

### Horizontal Scaling (100+ Users)

```yaml
# Kubernetes Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3                        # Start with 3 replicas
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      containers:
      - name: api
        image: your-registry/api-server:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        env:
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: url

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: api-server
  ports:
  - port: 80
    targetPort: 3000
```

### WebSocket Scaling

```javascript
// WebSocket server with Redis adapter
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

// Redis pub/sub for multi-instance sync
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter connected');
});

// Handle connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join project room
  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);

    // Notify others in room
    socket.to(`project:${projectId}`).emit('user-joined', {
      userId: socket.handshake.auth.userId,
      socketId: socket.id
    });
  });

  // Mesh update event
  socket.on('mesh-update', (data) => {
    socket.to(`project:${data.projectId}`).emit('mesh-update', {
      ...data,
      userId: socket.handshake.auth.userId,
      timestamp: Date.now()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

httpServer.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(512),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3D Models table
CREATE TABLE models_3d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_format VARCHAR(10),
    file_url VARCHAR(512) NOT NULL,
    glb_url VARCHAR(512),
    draco_url VARCHAR(512),
    thumbnail_url VARCHAR(512),
    file_size BIGINT,
    triangle_count INTEGER,
    vertex_count INTEGER,
    bounding_box JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Jobs table
CREATE TABLE print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models_3d(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    printer_id VARCHAR(255),
    gcode_url VARCHAR(512),
    status VARCHAR(50) DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress INTEGER DEFAULT 0,
    temperature JSONB,
    estimated_time INTEGER,
    actual_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration Sessions table
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    socket_id VARCHAR(255),
    cursor_position JSONB,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Version History table
CREATE TABLE model_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID REFERENCES models_3d(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_url VARCHAR(512) NOT NULL,
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_models_project_id ON models_3d(project_id);
CREATE INDEX idx_print_jobs_user_id ON print_jobs(user_id);
CREATE INDEX idx_print_jobs_status ON print_jobs(status);
CREATE INDEX idx_collaboration_project_id ON collaboration_sessions(project_id);
CREATE INDEX idx_model_versions_model_id ON model_versions(model_id);
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. Login request
     │    (email, password)
     ▼
┌──────────────┐
│  API Server  │
└──────┬───────┘
       │
       │ 2. Validate credentials
       │ 3. Hash comparison
       ▼
┌────────────────┐
│   PostgreSQL   │
└──────┬─────────┘
       │
       │ 4. User found
       ▼
┌──────────────┐
│  JWT Service │
└──────┬───────┘
       │
       │ 5. Generate tokens
       │    - Access token (15min)
       │    - Refresh token (7 days)
       ▼
┌─────────┐
│ Browser │ 6. Store tokens
└────┬────┘     (httpOnly cookies)
     │
     │ 7. Subsequent requests
     │    (Bearer token in header)
     ▼
┌──────────────┐
│  Middleware  │ 8. Verify JWT
└──────┬───────┘
       │
       │ 9. Authorized
       ▼
┌──────────────┐
│  Protected   │
│   Resource   │
└──────────────┘
```

### File Upload Security

```javascript
// Secure file upload middleware
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_FORMATS = ['.stl', '.obj', '.fbx', '.glb', '.gltf'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/uploads');
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${hash}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_FORMATS.includes(ext)) {
    return cb(new Error('Invalid file format'));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Virus scanning (optional but recommended)
import NodeClam from 'clamscan';

async function scanFile(filePath: string): Promise<boolean> {
  const clam = await new NodeClam().init();
  const { isInfected } = await clam.scanFile(filePath);
  return !isInfected;
}
```

---

## Monitoring and Observability

### Prometheus Metrics

```javascript
// metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// WebSocket metrics
export const wsConnectionsActive = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

export const wsMessagesTotal = new Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['event_type'],
  registers: [register]
});

// 3D model metrics
export const modelProcessingDuration = new Histogram({
  name: 'model_processing_duration_seconds',
  help: 'Duration of model processing operations',
  labelNames: ['operation', 'format'],
  registers: [register]
});

export const modelFileSize = new Histogram({
  name: 'model_file_size_bytes',
  help: 'Size of uploaded 3D model files',
  labelNames: ['format'],
  buckets: [1e5, 1e6, 1e7, 1e8, 1e9],
  registers: [register]
});

// GPU metrics (if applicable)
export const gpuUtilization = new Gauge({
  name: 'gpu_utilization_percent',
  help: 'GPU utilization percentage',
  registers: [register]
});

export default register;
```

### Health Check Endpoints

```javascript
// health.ts
import express from 'express';
import { createClient } from 'redis';
import { Pool } from 'pg';

const router = express.Router();

// Liveness probe (is the service running?)
router.get('/health/live', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Readiness probe (is the service ready to accept traffic?)
router.get('/health/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    storage: false
  };

  try {
    // Check database
    const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await dbPool.query('SELECT 1');
    checks.database = true;
    await dbPool.end();

    // Check Redis
    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    await redisClient.ping();
    checks.redis = true;
    await redisClient.disconnect();

    // Check storage (if applicable)
    // ... storage health check

    const allHealthy = Object.values(checks).every(check => check === true);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      checks,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      checks,
      error: error.message,
      timestamp: Date.now()
    });
  }
});

export default router;
```

---

## Deployment Checklist

### Pre-Production

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] CDN configured and tested
- [ ] Redis cluster deployed
- [ ] Monitoring dashboards set up
- [ ] Logging aggregation configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

### Security

- [ ] JWT secret rotation implemented
- [ ] Rate limiting configured
- [ ] CORS policies set
- [ ] File upload validation enabled
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Dependency security audit passed

### Performance

- [ ] CDN cache rules configured
- [ ] Database indexes created
- [ ] Redis caching strategy implemented
- [ ] Image/model compression enabled
- [ ] Gzip/Brotli compression enabled
- [ ] Browser caching headers set
- [ ] Load testing completed (100+ concurrent users)

### Monitoring

- [ ] Prometheus metrics exposed
- [ ] Grafana dashboards created
- [ ] Alert rules configured
- [ ] Error tracking (Sentry/Rollbar) set up
- [ ] Uptime monitoring enabled
- [ ] Log retention policy set

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Author:** AI Architecture Agent
