/**
 * Mock y-websocket for Storybook
 * 
 * Provides a fake WebsocketProvider that behaves as if connected and synced
 * without opening real WebSocket connections.
 */

export class WebsocketProvider {
  constructor(serverUrl, roomname, doc, opts = {}) {
    this._listeners = {};
    this.awareness = opts.awareness || null;
    this.roomname = roomname;
    this.doc = doc;
    this.synced = false;
    this.wsconnected = false;

    // Emit connected + synced on next tick so listeners registered in the
    // constructor callback chain still receive the events.
    setTimeout(() => {
      this.wsconnected = true;
      this.synced = true;
      this._emit('status', { status: 'connected' });
      this._emit('sync', true);
    }, 0);
  }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  }

  off(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
  }

  _emit(event, ...args) {
    (this._listeners[event] || []).forEach(h => h(...args));
  }

  connect() {
    this.wsconnected = true;
    this._emit('status', { status: 'connected' });
    this._emit('sync', true);
  }

  disconnect() {
    this.wsconnected = false;
    this._emit('status', { status: 'disconnected' });
  }

  destroy() {
    this.disconnect();
    this._listeners = {};
  }
}
