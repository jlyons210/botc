import { EventEmitter } from "node:events";
import type { EventMap } from "./index.ts";

class EventBus<T extends EventMap> {
  private static instance: EventBus<EventMap>;
  private emitter = new EventEmitter();

  static attach<T extends EventMap>(): EventBus<T> {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance as EventBus<T>;
  }

  emit<K extends keyof T>(eventName: K, data: T[K]): void {
    this.emitter.emit(eventName as string, data);
  }

  on<K extends keyof T>(eventName: K, handler: (data: T[K]) => void): void {
    this.emitter.on(eventName as string, handler);
  }

  once<K extends keyof T>(eventName: K, handler: (data: T[K]) => void): void {
    this.emitter.once(eventName as string, handler);
  }
}

export default EventBus;
