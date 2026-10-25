import { EventEmitter } from "node:events";
import type { EventMap } from "./index.ts";

/**
 * Construct an EventEmitter singleton for event handling
 * @typeParam T - Event map handled by this bus.
 */
class EventBus<T extends EventMap> {
  private static instance: EventBus<EventMap>;
  private emitter = new EventEmitter();

  /**
   * Return the singleton instance of EventBus
   * @typeParam T - Event map handled by the returned bus.
   * @returns The singleton EventBus instance.
   */
  static attach<T extends EventMap>(): EventBus<T> {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance as EventBus<T>;
  }

  /**
   * Emit an event on the EventBus
   * @typeParam K - Event map key to emit.
   * @param eventName - Event name
   * @param data - Event data
   */
  emit<K extends keyof T>(eventName: K, data: T[K]): void {
    this.emitter.emit(eventName as string, data);
  }

  /**
   * Register an event handler on the EventBus
   * @typeParam K - Event map key to handle.
   * @param eventName - Event name
   * @param handler - Event handler
   */
  on<K extends keyof T>(eventName: K, handler: (data: T[K]) => void): void {
    this.emitter.on(eventName as string, handler);
  }

  /**
   * Register an event handler on the EventBus that will only be called once
   * @typeParam K - Event map key to handle.
   * @param eventName - Event name
   * @param handler - Event handler
   */
  once<K extends keyof T>(eventName: K, handler: (data: T[K]) => void): void {
    this.emitter.once(eventName as string, handler);
  }
}

export default EventBus;
