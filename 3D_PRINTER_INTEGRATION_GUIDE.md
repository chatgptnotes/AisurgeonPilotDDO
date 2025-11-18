# 3D Printer Integration Implementation Guide

## Overview

Complete guide for integrating 3D printer control, monitoring, and G-code generation into your web-based 3D platform. Supports OctoPrint, Klipper/Moonraker, and direct printer communication.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [OctoPrint Integration](#2-octoprint-integration)
3. [Klipper/Moonraker Integration](#3-klippermoonraker-integration)
4. [G-code Generation](#4-g-code-generation)
5. [Real-Time Monitoring](#5-real-time-monitoring)
6. [Print Job Management](#6-print-job-management)
7. [Security Considerations](#7-security-considerations)

---

## 1. Architecture Overview

```
┌──────────────┐
│   Browser    │
│   (Client)   │
└──────┬───────┘
       │
       │ WebSocket + HTTP
       ▼
┌──────────────────┐
│   Your Server    │
│   (Relay/Proxy)  │
└──────┬───────────┘
       │
       │ REST API / WebSocket
       ▼
┌──────────────────────────────┐
│   Printer Interface Layer    │
│  ┌────────────┐ ┌──────────┐ │
│  │ OctoPrint  │ │ Klipper  │ │
│  │  REST API  │ │ Moonraker│ │
│  └────────────┘ └──────────┘ │
└──────┬───────────────────────┘
       │
       │ Serial / USB / Network
       ▼
┌──────────────────┐
│   3D Printer     │
│   (Hardware)     │
└──────────────────┘
```

---

## 2. OctoPrint Integration

### 2.1 OctoPrint API Client

```typescript
// services/octoprintClient.ts
import axios, { AxiosInstance } from 'axios';

export interface OctoPrintConfig {
  baseUrl: string;
  apiKey: string;
}

export interface PrinterState {
  state: {
    text: string;
    flags: {
      operational: boolean;
      printing: boolean;
      paused: boolean;
      ready: boolean;
      error: boolean;
    };
  };
  temperature: {
    bed: {
      actual: number;
      target: number;
    };
    tool0: {
      actual: number;
      target: number;
    };
  };
}

export interface JobProgress {
  completion: number;
  printTime: number;
  printTimeLeft: number;
  file: {
    name: string;
    size: number;
  };
}

export class OctoPrintClient {
  private client: AxiosInstance;

  constructor(config: OctoPrintConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'X-Api-Key': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Get printer state
   */
  async getPrinterState(): Promise<PrinterState> {
    const response = await this.client.get('/api/printer');
    return response.data;
  }

  /**
   * Get current job information
   */
  async getJobProgress(): Promise<JobProgress> {
    const response = await this.client.get('/api/job');
    return response.data;
  }

  /**
   * Upload file to OctoPrint
   */
  async uploadFile(file: File, select: boolean = true, print: boolean = false): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('select', select.toString());
    formData.append('print', print.toString());

    await this.client.post('/api/files/local', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Select file for printing
   */
  async selectFile(filename: string, print: boolean = false): Promise<void> {
    await this.client.post(`/api/files/local/${filename}`, {
      command: 'select',
      print
    });
  }

  /**
   * Start print job
   */
  async startPrint(): Promise<void> {
    await this.client.post('/api/job', {
      command: 'start'
    });
  }

  /**
   * Pause print job
   */
  async pausePrint(): Promise<void> {
    await this.client.post('/api/job', {
      command: 'pause',
      action: 'pause'
    });
  }

  /**
   * Resume print job
   */
  async resumePrint(): Promise<void> {
    await this.client.post('/api/job', {
      command: 'pause',
      action: 'resume'
    });
  }

  /**
   * Cancel print job
   */
  async cancelPrint(): Promise<void> {
    await this.client.post('/api/job', {
      command: 'cancel'
    });
  }

  /**
   * Send G-code command
   */
  async sendGCode(commands: string[]): Promise<void> {
    await this.client.post('/api/printer/command', {
      commands
    });
  }

  /**
   * Set bed temperature
   */
  async setBedTemperature(target: number): Promise<void> {
    await this.client.post('/api/printer/bed', {
      command: 'target',
      target
    });
  }

  /**
   * Set tool temperature
   */
  async setToolTemperature(target: number, tool: number = 0): Promise<void> {
    await this.client.post(`/api/printer/tool`, {
      command: 'target',
      targets: { [`tool${tool}`]: target }
    });
  }

  /**
   * Home axes
   */
  async homeAxes(axes: ('x' | 'y' | 'z')[]): Promise<void> {
    await this.client.post('/api/printer/printhead', {
      command: 'home',
      axes
    });
  }

  /**
   * Jog printer head
   */
  async jog(x: number = 0, y: number = 0, z: number = 0, speed: number = 6000): Promise<void> {
    await this.client.post('/api/printer/printhead', {
      command: 'jog',
      x,
      y,
      z,
      speed
    });
  }

  /**
   * Get list of files
   */
  async getFiles(location: 'local' | 'sdcard' = 'local'): Promise<any> {
    const response = await this.client.get(`/api/files/${location}`);
    return response.data;
  }

  /**
   * Delete file
   */
  async deleteFile(filename: string, location: 'local' | 'sdcard' = 'local'): Promise<void> {
    await this.client.delete(`/api/files/${location}/${filename}`);
  }
}
```

### 2.2 OctoPrint WebSocket Client

```typescript
// services/octoprintWebSocket.ts
export interface OctoPrintMessage {
  current?: PrinterState;
  history?: any;
  event?: {
    type: string;
    payload: any;
  };
}

export class OctoPrintWebSocket {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, Function[]> = new Map();

  constructor(private baseUrl: string, private apiKey: string) {}

  connect(): void {
    const wsUrl = this.baseUrl.replace('http', 'ws') + '/sockjs/websocket';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('OctoPrint WebSocket connected');
      // Authenticate
      this.send({ auth: this.apiKey });
    };

    this.ws.onmessage = (event) => {
      const data: OctoPrintMessage = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('OctoPrint WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('OctoPrint WebSocket disconnected');
      // Attempt reconnection after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(eventType: string, handler: Function): void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
  }

  off(eventType: string, handler: Function): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private handleMessage(data: OctoPrintMessage): void {
    // Handle current state updates
    if (data.current) {
      this.emit('state', data.current);
    }

    // Handle events
    if (data.event) {
      this.emit('event', data.event);
      this.emit(data.event.type, data.event.payload);
    }
  }

  private emit(eventType: string, data: any): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }
}
```

---

## 3. Klipper/Moonraker Integration

### 3.1 Moonraker API Client

```typescript
// services/moonrakerClient.ts
import axios, { AxiosInstance } from 'axios';

export interface MoonrakerConfig {
  baseUrl: string;
}

export interface KlipperStatus {
  state: string;
  state_message: string;
}

export class MoonrakerClient {
  private client: AxiosInstance;
  private ws: WebSocket | null = null;

  constructor(config: MoonrakerConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000
    });
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(): Promise<any> {
    const response = await this.client.get('/printer/info');
    return response.data.result;
  }

  /**
   * Get printer objects (temperature, position, etc.)
   */
  async getPrinterObjects(objects: string[]): Promise<any> {
    const response = await this.client.get('/printer/objects/query', {
      params: {
        ...objects.reduce((acc, obj) => ({ ...acc, [obj]: null }), {})
      }
    });
    return response.data.result.status;
  }

  /**
   * Send G-code script
   */
  async sendGCode(script: string): Promise<void> {
    await this.client.post('/printer/gcode/script', null, {
      params: { script }
    });
  }

  /**
   * Emergency stop
   */
  async emergencyStop(): Promise<void> {
    await this.client.post('/printer/emergency_stop');
  }

  /**
   * Restart firmware
   */
  async restartFirmware(): Promise<void> {
    await this.client.post('/printer/firmware_restart');
  }

  /**
   * Print file
   */
  async printFile(filename: string): Promise<void> {
    await this.client.post('/printer/print/start', null, {
      params: { filename }
    });
  }

  /**
   * Pause print
   */
  async pausePrint(): Promise<void> {
    await this.client.post('/printer/print/pause');
  }

  /**
   * Resume print
   */
  async resumePrint(): Promise<void> {
    await this.client.post('/printer/print/resume');
  }

  /**
   * Cancel print
   */
  async cancelPrint(): Promise<void> {
    await this.client.post('/printer/print/cancel');
  }

  /**
   * Upload file
   */
  async uploadFile(file: File, path: string = 'gcodes'): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('root', path);

    await this.client.post('/server/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(): void {
    const wsUrl = this.client.defaults.baseURL!.replace('http', 'ws') + '/websocket';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Moonraker WebSocket connected');

      // Subscribe to printer updates
      this.ws!.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'printer.objects.subscribe',
        params: {
          objects: {
            print_stats: null,
            heater_bed: null,
            extruder: null,
            toolhead: null
          }
        },
        id: 1
      }));
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Moonraker update:', data);
      // Handle updates
    };

    this.ws.onerror = (error) => {
      console.error('Moonraker WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Moonraker WebSocket disconnected');
      setTimeout(() => this.connectWebSocket(), 5000);
    };
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

---

## 4. G-code Generation

### 4.1 Simple Slicer (JavaScript)

```typescript
// services/gcodeGenerator.ts
export interface SlicerSettings {
  layerHeight: number;
  firstLayerHeight: number;
  nozzleDiameter: number;
  filamentDiameter: number;
  extrusionMultiplier: number;
  printSpeed: number;
  travelSpeed: number;
  bedTemperature: number;
  nozzleTemperature: number;
  retractDistance: number;
  retractSpeed: number;
}

export class GCodeGenerator {
  private gcode: string[] = [];
  private position: { x: number; y: number; z: number; e: number };
  private settings: SlicerSettings;

  constructor(settings: SlicerSettings) {
    this.settings = settings;
    this.position = { x: 0, y: 0, z: 0, e: 0 };
  }

  /**
   * Generate start G-code
   */
  generateStart(): void {
    this.addComment('Generated by Web 3D Platform');
    this.addComment(`Layer Height: ${this.settings.layerHeight}mm`);
    this.addComment(`Nozzle Temp: ${this.settings.nozzleTemperature}°C`);
    this.addComment(`Bed Temp: ${this.settings.bedTemperature}°C`);

    // Set units to millimeters
    this.addLine('G21 ; set units to millimeters');

    // Use absolute positioning
    this.addLine('G90 ; absolute positioning');

    // Home all axes
    this.addLine('G28 ; home all axes');

    // Set bed temperature
    this.addLine(`M140 S${this.settings.bedTemperature} ; set bed temp`);

    // Set nozzle temperature
    this.addLine(`M104 S${this.settings.nozzleTemperature} ; set nozzle temp`);

    // Wait for bed temperature
    this.addLine(`M190 S${this.settings.bedTemperature} ; wait for bed temp`);

    // Wait for nozzle temperature
    this.addLine(`M109 S${this.settings.nozzleTemperature} ; wait for nozzle temp`);

    // Prime nozzle
    this.addLine('G92 E0 ; reset extruder');
    this.addLine('G1 Z2.0 F3000 ; move Z up');
    this.addLine('G1 X10.1 Y20 Z0.28 F5000.0 ; move to start position');
    this.addLine('G1 X10.1 Y200.0 Z0.28 F1500.0 E15 ; draw first line');
    this.addLine('G1 X10.4 Y200.0 Z0.28 F5000.0 ; move to side');
    this.addLine('G1 X10.4 Y20 Z0.28 F1500.0 E30 ; draw second line');
    this.addLine('G92 E0 ; reset extruder');
    this.addLine('G1 Z2.0 F3000 ; move Z up');
  }

  /**
   * Generate end G-code
   */
  generateEnd(): void {
    this.addLine('M104 S0 ; turn off nozzle');
    this.addLine('M140 S0 ; turn off bed');
    this.addLine('G91 ; relative positioning');
    this.addLine('G1 Z10 F3000 ; move Z up 10mm');
    this.addLine('G90 ; absolute positioning');
    this.addLine('G28 X Y ; home X and Y');
    this.addLine('M84 ; disable motors');
  }

  /**
   * Move to position (travel move)
   */
  moveTo(x: number, y: number, z: number): void {
    // Retract before travel
    this.retract();

    this.addLine(
      `G0 X${x.toFixed(3)} Y${y.toFixed(3)} Z${z.toFixed(3)} F${this.settings.travelSpeed}`
    );

    this.position = { ...this.position, x, y, z };

    // Unretract after travel
    this.unretract();
  }

  /**
   * Extrude to position
   */
  extrudeTo(x: number, y: number, z: number): void {
    // Calculate extrusion amount
    const distance = Math.sqrt(
      Math.pow(x - this.position.x, 2) +
      Math.pow(y - this.position.y, 2) +
      Math.pow(z - this.position.z, 2)
    );

    const extrusionVolume = this.calculateExtrusionVolume(distance);
    const e = this.position.e + extrusionVolume;

    this.addLine(
      `G1 X${x.toFixed(3)} Y${y.toFixed(3)} Z${z.toFixed(3)} E${e.toFixed(5)} F${this.settings.printSpeed}`
    );

    this.position = { x, y, z, e };
  }

  /**
   * Calculate extrusion volume
   */
  private calculateExtrusionVolume(distance: number): number {
    const lineWidth = this.settings.nozzleDiameter;
    const layerHeight = this.settings.layerHeight;
    const filamentRadius = this.settings.filamentDiameter / 2;

    const lineArea = lineWidth * layerHeight;
    const volume = lineArea * distance;
    const filamentArea = Math.PI * filamentRadius * filamentRadius;
    const filamentLength = volume / filamentArea;

    return filamentLength * this.settings.extrusionMultiplier;
  }

  /**
   * Retract filament
   */
  private retract(): void {
    const e = this.position.e - this.settings.retractDistance;
    this.addLine(`G1 E${e.toFixed(5)} F${this.settings.retractSpeed * 60}`);
    this.position.e = e;
  }

  /**
   * Unretract filament
   */
  private unretract(): void {
    const e = this.position.e + this.settings.retractDistance;
    this.addLine(`G1 E${e.toFixed(5)} F${this.settings.retractSpeed * 60}`);
    this.position.e = e;
  }

  /**
   * Add comment
   */
  addComment(comment: string): void {
    this.gcode.push(`; ${comment}`);
  }

  /**
   * Add raw G-code line
   */
  addLine(line: string): void {
    this.gcode.push(line);
  }

  /**
   * Get generated G-code
   */
  getGCode(): string {
    return this.gcode.join('\n');
  }

  /**
   * Export as file
   */
  exportFile(filename: string): void {
    const blob = new Blob([this.getGCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
```

### 4.2 Slice 3D Model to G-code

```typescript
// utils/slicer.ts
import * as THREE from 'three';
import { GCodeGenerator, SlicerSettings } from './gcodeGenerator';

export class SimpleSlicer {
  /**
   * Slice a 3D mesh into G-code
   */
  static slice(mesh: THREE.Mesh, settings: SlicerSettings): string {
    const generator = new GCodeGenerator(settings);

    // Generate start G-code
    generator.generateStart();

    // Get mesh geometry
    const geometry = mesh.geometry as THREE.BufferGeometry;
    geometry.computeBoundingBox();

    const boundingBox = geometry.boundingBox!;
    const minZ = boundingBox.min.z;
    const maxZ = boundingBox.max.z;

    // Calculate number of layers
    const numLayers = Math.ceil((maxZ - minZ) / settings.layerHeight);

    // Slice each layer
    for (let layer = 0; layer < numLayers; layer++) {
      const z = minZ + layer * settings.layerHeight;

      generator.addComment(`Layer ${layer + 1} / ${numLayers}`);

      // Get intersection of mesh at this Z height
      const contours = this.getLayerContours(geometry, z);

      // Generate toolpath for this layer
      contours.forEach((contour, index) => {
        if (index === 0 && contour.length > 0) {
          // Move to start of contour
          generator.moveTo(contour[0].x, contour[0].y, z);
        }

        // Extrude along contour
        contour.forEach((point) => {
          generator.extrudeTo(point.x, point.y, z);
        });
      });
    }

    // Generate end G-code
    generator.generateEnd();

    return generator.getGCode();
  }

  /**
   * Get contours at specific Z height
   * Simplified version - for production use proper slicing algorithm
   */
  private static getLayerContours(
    geometry: THREE.BufferGeometry,
    z: number
  ): THREE.Vector2[][] {
    const contours: THREE.Vector2[][] = [];
    const positions = geometry.attributes.position;
    const indices = geometry.index;

    if (!indices) return contours;

    const epsilon = 0.001; // Tolerance for Z comparison
    const points: THREE.Vector2[] = [];

    // Check each triangle
    for (let i = 0; i < indices.count; i += 3) {
      const i1 = indices.getX(i);
      const i2 = indices.getX(i + 1);
      const i3 = indices.getX(i + 2);

      const v1 = new THREE.Vector3(
        positions.getX(i1),
        positions.getY(i1),
        positions.getZ(i1)
      );
      const v2 = new THREE.Vector3(
        positions.getX(i2),
        positions.getY(i2),
        positions.getZ(i2)
      );
      const v3 = new THREE.Vector3(
        positions.getX(i3),
        positions.getY(i3),
        positions.getZ(i3)
      );

      // Check if triangle intersects with Z plane
      const intersections = this.getTriangleIntersections([v1, v2, v3], z, epsilon);

      if (intersections.length === 2) {
        points.push(intersections[0], intersections[1]);
      }
    }

    // Sort points into contours (simplified)
    if (points.length > 0) {
      contours.push(points);
    }

    return contours;
  }

  /**
   * Get triangle intersections with Z plane
   */
  private static getTriangleIntersections(
    vertices: THREE.Vector3[],
    z: number,
    epsilon: number
  ): THREE.Vector2[] {
    const intersections: THREE.Vector2[] = [];

    for (let i = 0; i < 3; i++) {
      const v1 = vertices[i];
      const v2 = vertices[(i + 1) % 3];

      // Check if edge crosses Z plane
      if ((v1.z <= z + epsilon && v2.z >= z - epsilon) ||
          (v2.z <= z + epsilon && v1.z >= z - epsilon)) {

        if (Math.abs(v1.z - v2.z) < epsilon) continue;

        // Calculate intersection point
        const t = (z - v1.z) / (v2.z - v1.z);
        const x = v1.x + t * (v2.x - v1.x);
        const y = v1.y + t * (v2.y - v1.y);

        intersections.push(new THREE.Vector2(x, y));
      }
    }

    return intersections;
  }
}
```

---

## 5. Real-Time Monitoring

### 5.1 Print Monitor Component

```tsx
// components/printer/PrintMonitor.tsx
import { useEffect, useState } from 'react';
import { OctoPrintClient, PrinterState, JobProgress } from '@/services/octoprintClient';
import { OctoPrintWebSocket } from '@/services/octoprintWebSocket';

export function PrintMonitor() {
  const [client] = useState(() => new OctoPrintClient({
    baseUrl: process.env.REACT_APP_OCTOPRINT_URL!,
    apiKey: process.env.REACT_APP_OCTOPRINT_KEY!
  }));

  const [ws] = useState(() => new OctoPrintWebSocket(
    process.env.REACT_APP_OCTOPRINT_URL!,
    process.env.REACT_APP_OCTOPRINT_KEY!
  ));

  const [printerState, setPrinterState] = useState<PrinterState | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null);

  useEffect(() => {
    // Connect WebSocket
    ws.connect();

    // Listen for state updates
    ws.on('state', (state: PrinterState) => {
      setPrinterState(state);
    });

    // Poll for job progress
    const interval = setInterval(async () => {
      try {
        const progress = await client.getJobProgress();
        setJobProgress(progress);
      } catch (error) {
        console.error('Failed to get job progress:', error);
      }
    }, 2000);

    return () => {
      ws.disconnect();
      clearInterval(interval);
    };
  }, [client, ws]);

  const handlePause = async () => {
    await client.pausePrint();
  };

  const handleResume = async () => {
    await client.resumePrint();
  };

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this print?')) {
      await client.cancelPrint();
    }
  };

  if (!printerState || !jobProgress) {
    return <div>Connecting to printer...</div>;
  }

  return (
    <div className="print-monitor">
      <h2>Print Monitor</h2>

      {/* Status */}
      <div className="status-section">
        <h3>Status</h3>
        <div className="status-indicator">
          <span className={`status-badge ${printerState.state.flags.printing ? 'printing' : 'idle'}`}>
            {printerState.state.text}
          </span>
        </div>
      </div>

      {/* Temperature */}
      <div className="temperature-section">
        <h3>Temperature</h3>
        <div className="temp-display">
          <div className="temp-item">
            <span>Nozzle:</span>
            <span className="temp-value">
              {printerState.temperature.tool0.actual.toFixed(1)}°C / {printerState.temperature.tool0.target}°C
            </span>
          </div>
          <div className="temp-item">
            <span>Bed:</span>
            <span className="temp-value">
              {printerState.temperature.bed.actual.toFixed(1)}°C / {printerState.temperature.bed.target}°C
            </span>
          </div>
        </div>
      </div>

      {/* Progress */}
      {printerState.state.flags.printing && (
        <div className="progress-section">
          <h3>Progress</h3>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${jobProgress.completion}%` }}
            />
          </div>
          <div className="progress-info">
            <span>{jobProgress.completion.toFixed(1)}%</span>
            <span>
              {Math.floor(jobProgress.printTime / 60)}m / {Math.floor(jobProgress.printTimeLeft / 60)}m left
            </span>
          </div>

          <div className="file-info">
            <span>File: {jobProgress.file.name}</span>
          </div>

          {/* Controls */}
          <div className="control-buttons">
            {printerState.state.flags.paused ? (
              <button onClick={handleResume} className="btn-resume">Resume</button>
            ) : (
              <button onClick={handlePause} className="btn-pause">Pause</button>
            )}
            <button onClick={handleCancel} className="btn-cancel">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Print Job Management

### 6.1 Print Job Service

```typescript
// services/printJobService.ts
import { OctoPrintClient } from './octoprintClient';
import { SimpleSlicer } from '@/utils/slicer';
import * as THREE from 'three';

export interface PrintJob {
  id: string;
  modelName: string;
  status: 'preparing' | 'uploading' | 'ready' | 'printing' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  estimatedTime?: number;
}

export class PrintJobService {
  private octoPrint: OctoPrintClient;
  private jobs: Map<string, PrintJob> = new Map();

  constructor(octoPrintConfig: { baseUrl: string; apiKey: string }) {
    this.octoPrint = new OctoPrintClient(octoPrintConfig);
  }

  /**
   * Submit print job from 3D mesh
   */
  async submitPrintJob(mesh: THREE.Mesh, modelName: string): Promise<string> {
    const jobId = this.generateJobId();

    const job: PrintJob = {
      id: jobId,
      modelName,
      status: 'preparing',
      progress: 0
    };

    this.jobs.set(jobId, job);

    try {
      // Slice model to G-code
      job.status = 'preparing';
      const gcode = SimpleSlicer.slice(mesh, {
        layerHeight: 0.2,
        firstLayerHeight: 0.3,
        nozzleDiameter: 0.4,
        filamentDiameter: 1.75,
        extrusionMultiplier: 1.0,
        printSpeed: 60 * 60, // mm/min
        travelSpeed: 120 * 60,
        bedTemperature: 60,
        nozzleTemperature: 200,
        retractDistance: 5,
        retractSpeed: 40
      });

      // Create file from G-code
      const file = new File([gcode], `${modelName}.gcode`, {
        type: 'text/plain'
      });

      // Upload to OctoPrint
      job.status = 'uploading';
      await this.octoPrint.uploadFile(file, true, false);

      job.status = 'ready';
      this.jobs.set(jobId, job);

      return jobId;
    } catch (error) {
      job.status = 'failed';
      this.jobs.set(jobId, job);
      throw error;
    }
  }

  /**
   * Start print job
   */
  async startPrint(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    job.status = 'printing';
    job.startTime = new Date();

    await this.octoPrint.startPrint();

    this.jobs.set(jobId, job);
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): PrintJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List all jobs
   */
  listJobs(): PrintJob[] {
    return Array.from(this.jobs.values());
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 7. Security Considerations

### 7.1 Secure Printer Connection

```typescript
// services/securePrinterProxy.ts
import express from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

// JWT authentication middleware
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Proxy endpoint for OctoPrint
app.use('/api/printer', authenticateJWT, async (req, res) => {
  // Forward request to OctoPrint with stored API key
  // Never expose OctoPrint API key to client
  const octoPrintUrl = process.env.OCTOPRINT_URL;
  const octoPrintKey = process.env.OCTOPRINT_API_KEY;

  // ... proxy implementation
});

app.listen(3001, () => {
  console.log('Secure printer proxy running on port 3001');
});
```

---

## Conclusion

This guide provides a complete implementation for integrating 3D printers with your web platform. Key features:

- OctoPrint and Klipper support
- Real-time monitoring via WebSocket
- Browser-based G-code generation
- Print job management
- Secure proxy architecture

For production deployment:
- Use HTTPS/WSS for all connections
- Implement proper authentication
- Add comprehensive error handling
- Consider printer access control
- Monitor resource usage
- Add backup/recovery mechanisms

---

**Version:** 1.0
**Last Updated:** 2025-11-17
