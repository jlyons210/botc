import { EventEmitter } from 'node:events';
import { EventMap } from './index.js';

/** Construct an EventEmitter using the singleton pattern */
class EventBus<T extends EventMap> {
  private static instance: EventBus<EventMap>;
  private emitter = new EventEmitter();

  /**
   * Return the singleton instance of EventBus
   * @template T EventMap
   * @returns {EventBus<T>} EventBus instance
   */
  static getInstance<T extends EventMap>(): EventBus<T> {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance as EventBus<T>;
  }

  /**
   * Emit an event on the EventBus
   * @template T EventMap
   * @template K EventMap key
   * @param {K} eventName Event name
   * @param {T[K]} data Event data
   */
  emit<K extends keyof T>(eventName: K, data: T[K]): void {
    this.emitter.emit(eventName as string, data);
  }

  /**
   * Register an event handler on the EventBus
   * @template T EventMap
   * @template K EventMap key
   * @param {K} eventName Event name
   * @param {(data: T[K]) => void} handler Event handler
   */
  on<K extends keyof T>(eventName: K, handler: (data: T[K]) => void): void {
    this.emitter.on(eventName as string, handler);
  }
}

export default EventBus;
