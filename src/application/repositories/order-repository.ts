import { Order, Prisma, Token } from '@prisma/client';
import { BaseRepository } from './_base.repository';
import { OrderStatus } from '../types/enums';

export interface OrderRepository
  extends BaseRepository<Order, Prisma.OrderUncheckedCreateInput, Partial<Order>> {
  getPendingOrders(): Promise<Array<Order>>;
  updateOrderStatusAndMarketPrice(
    orderId: string,
    status: OrderStatus,
    marketPrice?: number | null
  ): Promise<Order | null>;
  getUserTelegramId(orderId: string): Promise<string>;
  findOrdersByUserId(userId: string): Promise<Order[]>;
  findByOrderCode(orderCode: string): Promise<(Order & { tokenpair: { tokenA: Token; tokenB: Token } }) | null>;
  getOrderStatusList(): Array<{ key: string; value: string }>;
}
