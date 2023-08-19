declare class EventEmitter {
    #private;
    constructor();
    /**
     * Emits an event
     * @param {string} event name
     * @param {object} payload
     */
    emit(event: any, payload?: any): void;
    /**
     * Listens for a given event
     * @param {string} event name
     * @param {function} fn
     */
    on(event: any, fn: any): void;
    once(event: any, fn: any): void;
    off(event: any, fn: any): void;
}
export default EventEmitter;
