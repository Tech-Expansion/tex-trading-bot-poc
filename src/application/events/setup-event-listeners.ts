import { eventDispatcher } from "../../domain/events/_base.event";
import { OrderStatusChangedEvent } from "../../domain/events/event-models";
import { sendOrderStatusNotification } from "./update-order-status";

export const setupEventListeners = () => {
    eventDispatcher.register(OrderStatusChangedEvent.name, sendOrderStatusNotification);
};