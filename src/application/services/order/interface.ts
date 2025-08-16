import { Order, Prisma } from "@prisma/client";
export interface OrderServiceInterface {
  getOrder(orderId: string): Promise<Order | null>;
  createOrder(order: Prisma.OrderUncheckedCreateInput): Promise<Order>;
  updateOrder(orderId: string, order: Partial<Order>): Promise<Order | null>;
}