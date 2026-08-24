# SmartCart — Intelligent AI Voice Shopping & Kitchen Companion

<div align="center">

```
  ____                                    _          
 / ___|  __ ___   _____  _ ____   _____ (_) ___ ___ 
 \___ \ / _` \ \ / / _ \| '__\ \ / / _ \| |/ __/ _ \
  ___) | (_| |\ V / (_) | |   \ V / (_) | | (_|  __/
 |____/ \__,_| \_/ \___/|_|    \_/ \___/|_|\___\___|
```

**Next-Generation Multimodal Voice Shopping & Kitchen Inventory Companion**

[![Runtime](https://img.shields.io/badge/Runtime-Node.js%20%7C%20Express-003527?style=flat-square)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-006c49?style=flat-square)](https://react.dev)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%20Live%20API-6cf8bb?style=flat-square&logoColor=003527)](https://ai.google.dev)
[![Graphics](https://img.shields.io/badge/Graphics-Three.js%20%7C%20WebGL%20Shaders-2b6954?style=flat-square)](https://threejs.org)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-002117?style=flat-square)](https://tailwindcss.com)
[![Status](https://img.shields.io/badge/Build-Passing-006c49?style=flat-square)]()

[Architecture](#system-architecture) • [Voice Pipeline](#dual-engine-voice-pipeline) • [Living UI](#interactive-living-ui--visual-engine) • [Modules](#core-functional-modules) • [API Protocol](#gemini-live-api-websocket-protocol--function-calling) • [Getting Started](#installation--development-guide)

</div>

---

## Overview

**SmartCart** is a voice-first web application bridging real-time conversational intelligence with physically-based visual interfaces. Powered by the **Gemini Live API** (`gemini-3.1-flash-live-preview`) over WebSockets, the system enables continuous, natural dialogue for grocery cart orchestration, instant dietary swaps, AI-curated recipe procurement, and kitchen pantry tracking.

```
+-----------------------------------------------------------------------------------+
|                                 SmartCart Core                                   |
|                                                                                   |
|   +--------------------+     +---------------------+     +--------------------+   |
|   | 16kHz PCM Stream   | --> | Server WS Relay     | --> | Gemini Live Model  |   |
|   | AudioWorklet Input |     | /api/live           |     | Function Calling   |   |
|   +--------------------+     +---------------------+     +--------------------+   |
|            |                                                        |             |
|            v                                                        v             |
|   +--------------------+     +---------------------+     +--------------------+   |
|   | Three.js Audio Orb |     | Reactive Cart State | <-- | Live Action Exec   |   |
|   | 3D Mesh Squish     |     | Client Persistence  |     | (add, swap, clear) |   |
|   +--------------------+     +---------------------+     +--------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## Architectural Comparison: Conventional vs. SmartCart

| Dimension | Conventional E-Commerce Flow | SmartCart Ambient Flow |
| :--- | :--- | :--- |
| **Interaction Paradigm** | Click-search-filter loops with nested form steps | Fluid spoken dialogue with continuous turn-taking |
| **Response Latency** | Sequential HTTP round-trips per click | Sub-second full-duplex PCM audio streaming |
| **Dietary Defense** | Static badge filtering requiring manual checks | Autonomous conflict interception & instant replacement |
| **Inventory Linking** | Disconnected cart vs. separate inventory tools | Unified loop: Pantry depletion auto-populates cart |
| **Visual Response** | Static CSS boxes and rigid layout frames | Reactive 3D WebGL mesh deforming to audio dynamics |

---

## System Architecture

```text
+-------------------------------------------------------------------------------+
|                                CLIENT BROWSER                                 |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                         THREE.JS / WEBGL LAYER                          |  |
|  |   * Ambient Fluid Background Shader     * 3D Refractive Audio Orb       |  |
|  +-------------------------------------------------------------------------+  |
|  |                         REACT 19 INTERFACE                              |  |
|  |   * VoiceHero / LiveVoiceCard           * ShoppingListView (Bento)      |  |
|  |   * RecipeDiscoverySection (Kits)       * SmartPantryView (Depletion)   |  |
|  +-------------------------------------------------------------------------+  |
|                       |                                   |                   |
|       [16kHz PCM Audio Stream]                 [Deterministic Fallback]       |
|                       |                                   |                   |
+-----------------------|-----------------------------------|-------------------+
                        |                                   |
                        v                                   v
+---------------------------------------+   +-----------------------------------+
|        EXPRESS BACKEND SERVER         |   |    BROWSER WEB SPEECH ENGINE      |
|  * WS Proxy: /api/live                |   |  * Native continuous recognition  |
|  * Tool Dispatcher & Execution Hub    |   |  * Multilingual (en-US / hi-IN)   |
|  * Secure API Key Encapsulation       |   +-----------------+-----------------+
+-------------------+-------------------+                     |
                    |                                         v
                    v                       +-----------------------------------+
+---------------------------------------+   |    DETERMINISTIC REGEX NLP        |
|        GOOGLE GEMINI LIVE API         |   |  * Token normalization            |
|  * gemini-3.1-flash-live-preview      |   |  * Quantity & unit extraction     |
|  * Bidirectional Audio Streaming      |   +-----------------+-----------------+
|  * Native Tool Declarations           |                     |
+---------------------------------------+                     v
                                            +-----------------------------------+
                                            |      LOCAL STATE REPOSITORY       |
                                            |  * 120+ Item Product Catalog      |
                                            |  * Client LocalStorage Snapshot   |
                                            +-----------------------------------+
```

---

## Dual-Engine Voice Pipeline

```
                     [ User Speaks Into Microphone ]
                                    |
            +-----------------------+-----------------------+
            |                                               |
     [Mode: Live API]                               [Mode: Fast Commands]
            |                                               |
            v                                               v
  Capture 16kHz PCM                               Web Speech SpeechRecognition
            |                                               |
            v                                               v
  WebSocket -> /api/live                          Continuous Transcript Output
            |                                               |
            v                                               v
  Gemini Live Model Evaluates                     Deterministic Regex Parser
            |                                               |
      +-----+-----+                                   +-----+-----+
      |           |                                   |           |
[Audio Chunk] [Tool Call]                       [Matched Intent] [Fallback Search]
      |           |                                   |           |
      v           v                                   v           v
Speaker Play  Executes Cart Action               App State Action Prompt
```

### Engine Specifications

```
+---------------------+---------------------------------------------------------+
| Feature             | Specification Details                                   |
+---------------------+---------------------------------------------------------+
| Protocol            | WebSocket (ws://host:3000/api/live)                     |
| Audio Input Format  | Linear PCM, 16,000 Hz, 1-channel, 16-bit Little-Endian |
| Audio Output Format | 24,000 Hz PCM AudioBuffer via Web Audio API Context     |
| Live Model ID       | gemini-3.1-flash-live-preview                           |
| Interruption Model  | Real-time barge-in detection with buffer flush           |
| Function Calling    | addItem, removeItem, updateQuantity, replaceItem, clear |
+---------------------+---------------------------------------------------------+
```

---

## Interactive Living UI & Visual Engine

### Three.js Squishy Audio Orb

```
           Dynamic Vertex Deformation Mesh
                     _____
                  .-'     `-.
                .'   _..._   `.
               /   .'     `.   \   <--- Icosahedron Geometry (1.4 radius, detail: 32)
              :   /    *    \   :  <--- MeshPhysicalMaterial (transmission: 0.85)
              :   |  ( x )  |   :  <--- Perlin harmonic squish: f(x, y, z, t, vol)
               \   `.     .'   /
                `.   `'''`   .'
                  `-.......-'
```

#### Vertex Mathematical Formula

$$\vec{P}' = \vec{P} \cdot \left[1.0 + A \cdot \sin(2x + \omega t) \cdot \cos(2y + \omega t) \cdot \sin(2z + \omega t)\right]$$

```
+---------------------+-----------------------+---------------------------------+
| System State        | Amplitude Factor (A)  | Visual Characteristics          |
+---------------------+-----------------------+---------------------------------+
| Idle / Standby      | A = 0.08              | Calm organic breathing rhythm   |
| User Mic Active     | A = 0.20 + 0.90(Vol)  | High-frequency dynamic squish   |
| Model Synthesizing  | A = 0.45 + 0.30(Osc)  | Bright Electric Sage resonance  |
+---------------------+-----------------------+---------------------------------+
```

### Atmospheric Fluid Background Shader

```glsl
// Embedded WebGL Shader Excerpt (AtmosphericBackground.tsx)
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;

void main() {
    vec2 uv = v_texCoord;
    float noise = sin(uv.x * 2.8 + u_time * 0.35) * 0.5 + 0.5;
    noise += cos(uv.y * 2.2 - u_time * 0.25) * 0.5 + 0.5;
    noise += sin((uv.x + uv.y) * 3.0 + u_time * 0.2) * 0.3;
    noise *= 0.45;
    
    vec3 warmCream    = vec3(0.984, 0.972, 0.960);
    vec3 forestGreen  = vec3(0.000, 0.423, 0.286);
    vec3 electricSage = vec3(0.424, 0.973, 0.733);
    
    vec3 mixed = mix(warmCream, forestGreen, noise * 0.45);
    mixed = mix(mixed, electricSage, pow(noise, 3.5) * 0.25);
    gl_FragColor = vec4(mixed, 1.0);
}
```

---

## Core Functional Modules

```
+-------------------------------------------------------------------------------+
|                             SAVORVOICE MODULES                                |
+-----------------------+-----------------------+-------------------------------+
| [1] Cart Management   | [2] Recipe Discovery  | [3] Smart Pantry Tracker      |
|                       |                       |                               |
| * Price aggregation   | * Dietary meal kits   | * Depletion forecast gauges   |
| * Quantity steppers   | * Ingredient mapping  | * Expiration date tracking    |
| * Dietary indicators  | * 1-click batch cart  | * 1-tap Auto-Replenish loop   |
+-----------------------+-----------------------+-------------------------------+
```

### 1. Voice Cart & Item Management
- Dynamic basket total calculations with tax and unit breakdown.
- Immediate substitute trigger when items violate active dietary profiles.
- Swipe gestures and stepper controls for manual adjustments.

### 2. AI Recipe Discovery Bento
- Pre-assembled meal kits (**Herb-Seared Salmon**, **Avocado Greens Bowl**, **Tuscan Butter Chicken**).
- Batch cart resolution matching recipe components to in-stock grocery items.

### 3. Smart Kitchen Pantry & Depletion Forecasting
- Visual indicators flagging depleted household essentials.
- Autonomous calculation of items nearing runout based on typical consumption intervals.

### 4. Dietary Profile & Conflict Defense
- Active enforcement across: `dairy-free`, `gluten-free`, `vegan`, `vegetarian`, `keto`, `nut-free`.
- Auto-substitution prompt suggesting compliant brand alternatives.

---

## Voice Command Matrix

| Operation | English Command (`en-US`) | Hindi / Hinglish Command (`hi-IN`) | Target Action |
| :--- | :--- | :--- | :--- |
| **Add** | `"Add 3 organic avocados"` | `"Teen seb dalo"` | Inserts item with quantity `3` |
| **Quantity** | `"Change avocados to 5"` | `"Seb ki quantity paanch karo"` | Updates item quantity to `5` |
| **Replace** | `"Swap whole milk for oat milk"` | `"Doodh ko oat milk se badlo"` | Atomic remove + insert replacement |
| **Delete** | `"Remove the peanut butter"` | `"Makkhan hatao"` | Removes item from cart |
| **Search** | `"Find gluten-free bread under $6"` | `"Gluten-free bread dhoondo"` | Opens search with filters applied |
| **Clear** | `"Clear shopping list"` | `"Puri list delete karo"` | Resets active cart collection |
| **Halt** | `"Stop listening"` | `"Ruk jao"` | Suspends active speech session |

---

## Gemini Live API WebSocket Protocol & Function Calling

The backend server (`server.ts`) registers declarative function tools with Gemini Live:

```typescript
// Tool Declarations for Live Function Calling
const liveTools = [
  {
    functionDeclarations: [
      {
        name: 'addItem',
        description: 'Add an item to the shopping cart with specified quantity.',
        parameters: {
          type: 'OBJECT',
          properties: {
            item: { type: 'STRING', description: 'Product name or query' },
            quantity: { type: 'NUMBER', description: 'Quantity (defaults to 1)' },
          },
          required: ['item'],
        },
      },
      {
        name: 'replaceItem',
        description: 'Swap an item for a healthier, cheaper, or dietary-compliant alternative.',
        parameters: {
          type: 'OBJECT',
          properties: {
            oldItem: { type: 'STRING', description: 'Current item to replace' },
            newItem: { type: 'STRING', description: 'New alternative to insert' },
          },
          required: ['oldItem', 'newItem'],
        },
      },
      {
        name: 'updateQuantity',
        description: 'Update the quantity of an item present in the cart.',
        parameters: {
          type: 'OBJECT',
          properties: {
            item: { type: 'STRING', description: 'Target item name' },
            quantity: { type: 'NUMBER', description: 'Updated quantity' },
          },
          required: ['item', 'quantity'],
        },
      },
    ],
  },
];
```

---

## Design System & Color Palette

```
+-------------------+-----------+-----------------------------------------------+
| Token Name        | Hex Value | Functional Role                               |
+-------------------+-----------+-----------------------------------------------+
| Primary           | #003527   | Deep brand contrast, major headers, buttons   |
| Secondary         | #006c49   | Interactive states, active pills, accents     |
| Electric Sage     | #6cf8bb   | Audio orb highlights, glowing indicators      |
| Viewport Base     | #fff8f5   | Warm canvas surface                           |
| Card Surface      | #f4ece8   | Bento card containers, secondary backgrounds  |
| Structural Border | #bfc9c3   | Container outline accents (30% opacity)       |
| Primary Text      | #1e1b19   | High-contrast body typography                 |
+-------------------+-----------+-----------------------------------------------+
```

---

## Installation & Development Guide

### Prerequisites
- Node.js >= 18.0.0
- Gemini API Key ([Google AI Studio](https://aistudio.google.com))

### 1. Repository Setup
```bash
git clone <repository-url>
cd savorvoice
npm install
```

### 2. Environment Configuration
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Development Server
```bash
npm run dev
```
The server will bind to `http://localhost:3000` with hot TypeScript execution and Vite middleware.

---

## Production Build & Verification

```bash
# Execute static type checking
npm run lint

# Build client assets and compile backend bundle
npm run build

# Launch production server
npm start
```

```
+-------------------------------------------------------------------------------+
| PRODUCTION ARTIFACT VERIFICATION                                              |
|                                                                               |
|   dist/                                                                       |
|   |-- assets/              <- Bundled and minified frontend scripts and CSS   |
|   |-- index.html           <- Optimized SPA entry point                       |
|   `-- server.cjs           <- Standalone CommonJS bundle compiled via esbuild |
+-------------------------------------------------------------------------------+
```

---

## Security, Privacy & Performance

- **Zero Client-Side Keys**: API keys are isolated exclusively within server-side execution boundaries (`process.env.GEMINI_API_KEY`).
- **In-Memory Audio Processing**: PCM audio streams are buffered in RAM during active turns and immediately disposed upon synthesis completion.
- **Client-Side State Storage**: Personal shopping lists and pantry logs remain in browser storage without mandatory third-party database syncing.

---

<div align="center">

**SmartCart** • Built with Google Gemini Live API, React 19, Three.js, and Express.

</div>
