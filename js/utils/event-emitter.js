export default class EventEmitter {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return this;
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);

        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, ...args) {
        if (!this.listeners.has(event)) return false;

        const callbacks = this.listeners.get(event).slice();
        for (const callback of callbacks) {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        }
        return true;
    }

    once(event, callback) {
        const onceWrapper = (...args) => {
            this.off(event, onceWrapper);
            callback(...args);
        };
        return this.on(event, onceWrapper);
    }

    removeAllListeners(event = null) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }
}
