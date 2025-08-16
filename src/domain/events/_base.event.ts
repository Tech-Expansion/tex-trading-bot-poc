type EventListener = (event: any) => void;

class EventDispatcher {
  private static instance: EventDispatcher;
  private listeners: Map<string, EventListener[]> = new Map();

  private constructor() {}

  public static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  public register(eventName: string, listener: EventListener): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  public dispatch(eventName: string, event: any): void {
    const listeners = this.listeners.get(eventName) || [];
    for (const listener of listeners) {
      listener(event);
    }
  }
}

export const eventDispatcher = EventDispatcher.getInstance();