import Session from "../Session"
import TransactionType from "../util/TransactionType"

export type SessionOptions = {
  timeoutMs: number,
  keepaliveMs: number,
}

export const defaultSessionOptions: SessionOptions = {
  timeoutMs: 5000,
  keepaliveMs: 50000,
}

export type StoreState = {
  session?: Session,
  sessionOptions?: SessionOptions,
  transactions?: any,
  members?: any[]
}

class Store {

  state: StoreState = {
    sessionOptions: defaultSessionOptions,
    transactions: {
      [TransactionType.Video]: {},
      [TransactionType.ScreenShare]: {},
      [TransactionType.Session]: {},
      [TransactionType.Member]: {},
      [TransactionType.Default]: {},
    },
    members: [],
  }
  constructor() {}

  setState(initialState: StoreState) {
    this.state = {
      ...this.state,
      ...initialState,
    }
  }

  get session() {
    return this.state?.session
  }

  get members() {
    return this.state?.members
  }

  get sessionOptions() {
    return this.state?.sessionOptions
  }

  recordTransaction(type: TransactionType, id, payload) {
    this.state.transactions[type][id] = payload
  }

  deleteTransaction(type: TransactionType, id) {
    delete this.state.transactions[type][id]
  }
}

export default new Store()
