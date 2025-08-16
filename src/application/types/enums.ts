export enum Step {
  _1 = 1,
  _2,
  _3,
  _4,
  _5,
  _6,
}

export enum OrderType {
  Market = 1,
  Limit = 2,
  StopLimit = 3, //for future
}

export enum OrderStatus {
  PENDING = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  FAILED = 5,
  EXPIRED = 6,
}