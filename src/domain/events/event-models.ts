import { OrderStatus } from "../../application/types/enums";

export class BaseEvent<T> {
  constructor(
    public readonly eventType: string,
    public readonly timestamp: Date,
    public readonly data: T
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    public orderId: string,
    public telegramId: string,
    public status: OrderStatus,
  ) {}
}
