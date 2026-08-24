import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      liveModel: 'gemini-3.1-flash-live-preview',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Dedicated WebSocket Server for Gemini Live API
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP upgrade event cleanly
  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/api/live' || url.pathname === '/api/live/' || url.pathname.startsWith('/api/live')) {
        wss.handleUpgrade(request, socket, head, (clientWs) => {
          wss.emit('connection', clientWs, request);
        });
      }
    } catch (err) {
      console.error('[Live API] Upgrade error:', err);
      socket.destroy();
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    console.log('[Live API] Client connected');
    let geminiSession: any = null;
    let isConnected = true;

    clientWs.on('error', (wsErr) => {
      console.warn('[Live API] Client WebSocket error:', wsErr);
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Live API] GEMINI_API_KEY is not configured');
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: 'GEMINI_API_KEY is not configured in the server environment. Please set it in Settings > Secrets.',
          })
        );
      }
      setTimeout(() => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1008, 'GEMINI_API_KEY missing');
        }
      }, 500);
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Handle messages from client
    clientWs.on('message', async (data) => {
      try {
        const payload = JSON.parse(data.toString());

        // 1. Initial configuration & connection start
        if (payload.type === 'start') {
          const voiceName = payload.voiceName || 'Zephyr';
          const userPreferences = payload.preferences || {};
          let currentList = payload.currentList || [];

          const prefDetails = [
            userPreferences.dairyFree ? 'Dairy-Free' : null,
            userPreferences.organicFirst ? 'Organic-First' : null,
            userPreferences.vegan ? 'Vegan' : null,
            userPreferences.vegetarian ? 'Vegetarian' : null,
          ]
            .filter(Boolean)
            .join(', ');

          const calculateTotal = (list: any[]) =>
            list.reduce((acc: number, item: any) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

          const calculateUnits = (list: any[]) =>
            list.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0);

          const buildItemsSummary = (list: any[]) =>
            list.length > 0
              ? list
                  .map(
                    (i: any) =>
                      `${i.quantity}x ${i.name} (₹${i.price || 0} each, subtotal ₹${(
                        (Number(i.price) || 0) * (Number(i.quantity) || 1)
                      ).toFixed(2)})`
                  )
                  .join(', ')
              : 'Cart is empty (₹0.00 total)';

          const initialTotal = calculateTotal(currentList);
          const initialUnits = calculateUnits(currentList);
          const initialSummary = buildItemsSummary(currentList);

          const systemInstruction = `You are an intelligent voice grocery and shopping assistant.
You help the user manage their shopping list, find items, calculate cart totals, plan recipes, and suggest replacements.
Be friendly, concise, natural, and conversational.

User Dietary Preferences: ${prefDetails || 'None specified'}

CURRENT ACTIVE SHOPPING CART STATUS:
- Total Cart Price Value: ₹${initialTotal.toFixed(2)} INR
- Total Item Units: ${initialUnits}
- Unique Items: ${currentList.length}
- Current Items in Cart: ${initialSummary}

CRITICAL RULES:
1. When asked "what's the total price value of the cart?", "what is my cart total?", "how much is my bill?", or "what items are in my cart?", immediately tell the user the grand total in Indian Rupees (₹ / INR) and summarize the items, or call the getCartSummary tool.
2. Whenever the user asks to add, remove, change quantity, replace, or clear items, you MUST call the corresponding tool (addItem, removeItem, updateQuantity, replaceItem, clearList).
3. All prices and calculations must be stated in Indian Rupees (₹ / INR).
4. Keep spoken replies natural, conversational, and direct (1-2 sentences unless reciting a full requested recipe).`;

          try {
            geminiSession = await ai.live.connect({
              model: 'gemini-3.1-flash-live-preview',
              callbacks: {
                onmessage: async (message: LiveServerMessage) => {
                  if (!isConnected || clientWs.readyState !== WebSocket.OPEN) return;

                  // 1. Audio parts from model turn
                  const serverContent = message.serverContent;
                  if (serverContent?.modelTurn?.parts) {
                    for (const part of serverContent.modelTurn.parts) {
                      if (part.inlineData?.data) {
                        clientWs.send(
                          JSON.stringify({
                            type: 'audio',
                            audio: part.inlineData.data,
                          })
                        );
                      }
                      if (part.text) {
                        clientWs.send(
                          JSON.stringify({
                            type: 'assistantTranscript',
                            text: part.text,
                          })
                        );
                      }
                    }
                  }

                  // 2. Transcriptions (input and output)
                  const inputTxt = (serverContent as any)?.inputTranscription?.text || (serverContent as any)?.inputAudioTranscription?.text;
                  if (inputTxt) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'userTranscript',
                        text: inputTxt,
                      })
                    );
                  }

                  const outputTxt = (serverContent as any)?.outputTranscription?.text || (serverContent as any)?.outputAudioTranscription?.text;
                  if (outputTxt) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'assistantTranscript',
                        text: outputTxt,
                      })
                    );
                  }

                  // 3. User interruption
                  if (serverContent?.interrupted) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'interrupted',
                      })
                    );
                  }

                  // 4. Turn completion
                  if (serverContent?.turnComplete) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'turnComplete',
                      })
                    );
                  }

                  // 5. Tool Call execution
                  if (message.toolCall?.functionCalls) {
                    const functionResponses = [];

                    for (const call of message.toolCall.functionCalls) {
                      console.log('[Live API] Tool Call:', call.name, call.args);

                      // Forward tool call event to client UI so shopping list updates in real time
                      clientWs.send(
                        JSON.stringify({
                          type: 'toolCall',
                          id: call.id,
                          name: call.name,
                          args: call.args,
                        })
                      );

                      // Acknowledge execution back to Gemini
                      if (call.name === 'getCartSummary') {
                        const currentTotal = calculateTotal(currentList);
                        const currentUnits = calculateUnits(currentList);
                        const currentSummary = buildItemsSummary(currentList);
                        functionResponses.push({
                          id: call.id,
                          name: call.name,
                          response: {
                            output: {
                              success: true,
                              totalPriceInRupees: `₹${currentTotal.toFixed(2)}`,
                              totalItemUnits: currentUnits,
                              uniqueItemCount: currentList.length,
                              items: currentSummary,
                              message: `The active cart total is ₹${currentTotal.toFixed(2)} with ${currentUnits} units (${currentSummary}).`,
                            },
                          },
                        });
                      } else {
                        functionResponses.push({
                          id: call.id,
                          name: call.name,
                          response: {
                            output: {
                              success: true,
                              message: `Successfully executed ${call.name} with ${JSON.stringify(
                                call.args
                              )}`,
                            },
                          },
                        });
                      }
                    }

                    if (geminiSession && functionResponses.length > 0) {
                      await geminiSession.sendToolResponse({
                        functionResponses,
                      });
                    }
                  }
                },
                onclose: () => {
                  console.log('[Live API] Gemini session closed');
                  if (isConnected && clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(JSON.stringify({ type: 'sessionClosed' }));
                  }
                },
                onerror: (err: any) => {
                  console.error('[Live API] Gemini error:', err);
                  if (isConnected && clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'error',
                        error: err?.message || 'Gemini Live API error',
                      })
                    );
                  }
                },
              },
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction,
                tools: [
                  {
                    functionDeclarations: [
                      {
                        name: 'addItem',
                        description:
                          'Add a grocery or household item to the active shopping list with name, quantity, and unit',
                        parameters: {
                          type: Type.OBJECT,
                          properties: {
                            productName: {
                              type: Type.STRING,
                              description: 'The name of the item or product (e.g., Almond Milk, Honeycrisp Apples, Organic Eggs)',
                            },
                            quantity: {
                              type: Type.NUMBER,
                              description: 'Number of units (defaults to 1)',
                            },
                            unit: {
                              type: Type.STRING,
                              description: 'Unit of measurement if applicable (e.g. bottle, pack, lbs, gallon)',
                            },
                          },
                          required: ['productName'],
                        },
                      },
                      {
                        name: 'removeItem',
                        description: 'Remove an item from the active shopping list',
                        parameters: {
                          type: Type.OBJECT,
                          properties: {
                            productName: {
                              type: Type.STRING,
                              description: 'Name of the item to remove',
                            },
                          },
                          required: ['productName'],
                        },
                      },
                      {
                        name: 'updateQuantity',
                        description: 'Update the quantity of an item already in the shopping list',
                        parameters: {
                          type: Type.OBJECT,
                          properties: {
                            productName: {
                              type: Type.STRING,
                              description: 'Name of the item in the list',
                            },
                            quantity: {
                              type: Type.NUMBER,
                              description: 'The updated quantity number',
                            },
                          },
                          required: ['productName', 'quantity'],
                        },
                      },
                      {
                        name: 'replaceItem',
                        description: 'Swap or replace an item in the list with an alternative product',
                        parameters: {
                          type: Type.OBJECT,
                          properties: {
                            originalProduct: {
                              type: Type.STRING,
                              description: 'The item currently in the list to remove',
                            },
                            replacementProduct: {
                              type: Type.STRING,
                              description: 'The new product to put in its place',
                            },
                          },
                          required: ['originalProduct', 'replacementProduct'],
                        },
                      },
                      {
                        name: 'clearList',
                        description: 'Clear all items from the current shopping list',
                        parameters: {
                          type: Type.OBJECT,
                          properties: {},
                        },
                      },
                      {
                        name: 'getCartSummary',
                        description:
                          'Get the current shopping cart total price value in INR (₹), item count, and itemized breakdown',
                        parameters: {
                          type: Type.OBJECT,
                          properties: {},
                        },
                      },
                    ],
                  },
                ],
              },
            });

            if (isConnected && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'sessionReady',
                  model: 'gemini-3.1-flash-live-preview',
                  voice: voiceName,
                })
              );
            }
          } catch (initErr: any) {
            console.error('[Live API] Failed to connect to Gemini Live:', initErr);
            if (isConnected && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error: initErr?.message || 'Failed to initialize Gemini Live session',
                })
              );
            }
          }
        }

        // 2. Real-time Audio input from user microphone
        if (payload.type === 'audio' && payload.audio && geminiSession) {
          geminiSession.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }

        // 3. User manually interrupts or stops speaking
        if (payload.type === 'stop') {
          if (geminiSession) {
            try {
              geminiSession.close();
            } catch {
              // ignore
            }
            geminiSession = null;
          }
        }
      } catch (err) {
        console.error('[Live API] Error processing client message:', err);
      }
    });

    clientWs.on('close', () => {
      isConnected = false;
      console.log('[Live API] Client disconnected');
      if (geminiSession) {
        try {
          geminiSession.close();
        } catch {
          // ignore
        }
        geminiSession = null;
      }
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
