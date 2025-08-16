import { Order, Prisma, Token } from '@prisma/client';
import { PrismaOrderRepository } from '../../../persistence/repositories/order-repository';
import { OrderRepository } from '../../repositories/order-repository';
import { OrderServiceInterface } from './interface';
import { OrderStatus } from '../../types/enums';
import { OrderStatusChangedEvent } from '../../../domain/events/event-models';
import { eventDispatcher } from '../../../domain/events/_base.event';
import { OrderHistoryDto } from './model';

class OrderServiceClass implements OrderServiceInterface {
  constructor(private orderRepository: OrderRepository) {}

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orderRepository.get(orderId);
  }

  async getOrderByCode(orderCode: string): Promise<(Order & { tokenpair: { tokenA: Token; tokenB: Token } }) | null> {
    return await this.orderRepository.findByOrderCode(orderCode);
  }

  async createOrder(order: Prisma.OrderUncheckedCreateInput): Promise<Order> {
    order.orderCode = await this.generateOrderCode();
    return this.orderRepository.create(order);
  }

  async updateOrder(orderId: string, order: Partial<Order>): Promise<Order | null> {
    return this.orderRepository.update(orderId, order);
  }

  async updateOrderStatusAndMarketPrice(
    orderId: string,
    status: OrderStatus,
    marketPrice?: number | null
  ): Promise<Order | null> {
    const telegramId = await this.orderRepository.getUserTelegramId(orderId);
    eventDispatcher.dispatch(
      OrderStatusChangedEvent.name,
      new OrderStatusChangedEvent(orderId, telegramId, status)
    );

    return this.orderRepository.updateOrderStatusAndMarketPrice(orderId, status, marketPrice);
  }

  getOrderStatusList(): Array<{ key: string; value: string }> {
    return Object.entries(OrderStatus)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        key: String(key),
        value: String(value),
      }));
  }

  async getOrderHistoryByUser(userId: string): Promise<OrderHistoryDto[]> {
    const orders = await this.orderRepository.findOrdersByUserId(userId);

    return orders.map((order) => ({
      id: order.id,
      orderCode: order.orderCode ?? 'Unknown',
      status: OrderStatus[order.status] ?? `Unknown (${order.status})`,
      createdAt: order.createdAt,
      tokenPair: `${(order as any).tokenpair?.tokenA?.tokenName ?? 'Unknown'} / ${(order as any).tokenpair?.tokenB?.tokenName ?? 'Unknown'}`,
      amount: order.amount.toString(),
    }));
  }

  async generateOrderCode(): Promise<string> {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');

    let code: string;
    let exists = true;

    do {
      const randomPart = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      code = `OR${datePart}${randomPart}`;

      const existingOrder = await this.orderRepository.findByOrderCode(code);
      exists = !!existingOrder;
    } while (exists);

    return code;
  }
}

const orderRepository = new PrismaOrderRepository();
export const OrderService = new OrderServiceClass(orderRepository);
