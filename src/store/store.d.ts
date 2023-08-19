import Session from "../Session";
import TransactionType from "../util/TransactionType";
export declare type SessionOptions = {
    timeoutMs: number;
    keepaliveMs: number;
};
export declare const defaultSessionOptions: SessionOptions;
export declare type StoreState = {
    session?: Session;
    sessionOptions?: SessionOptions;
    transactions?: any;
    members?: any[];
};
declare class Store {
    state: StoreState;
    constructor();
    setState(initialState: StoreState): void;
    get session(): Session;
    get members(): any[];
    get sessionOptions(): SessionOptions;
    recordTransaction(type: TransactionType, id: any, payload: any): void;
    deleteTransaction(type: TransactionType, id: any): void;
}
declare const _default: Store;
export default _default;
