import { Order, Prisma, PrismaClient, Token } from '@prisma/client';
import { OrderRepository } from '../../application/repositories/order-repository';
import { PrismaBaseRepository } from './_base.repository';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { OrderStatus } from '../../application/types/enums';

export class PrismaOrderRepository
  extends PrismaBaseRepository<Order, Prisma.OrderUncheckedCreateInput, Partial<Order>>
  implements OrderRepository
{
  private readonly _prismaClient: Prisma.OrderDelegate<DefaultArgs, Prisma.PrismaClientOptions>;

  constructor() {
    const currPrisma = new PrismaClient().order;
    super(currPrisma);
    this._prismaClient = currPrisma;
  }

  async getPendingOrders(): Promise<Array<Order>> {
    return await this._prismaClient.findMany({
      where: {
        status: OrderStatus.PENDING,
        expirationTime: {
          gt: new Date(),
        },
      },
    });
  }

  async updateOrderStatusAndMarketPrice(
    orderId: string,
    status: OrderStatus,
    marketPrice?: number | null
  ): Promise<Order | null> {
    return await this._prismaClient.update({
      where: { id: orderId },
      data: {
        status,
        updatedAt: new Date(),
        ...(marketPrice !== undefined && { marketPrice }),
      },
    });
  }

  async getUserTelegramId(orderId: string): Promise<string> {
    const result = await this._prismaClient.findUnique({
      where: { id: orderId },
      select: {
        wallet: {
          select: {
            user: {
              select: {
                telegramId: true,
              },
            },
          },
        },
      },
    });

    if (!result?.wallet?.user?.telegramId) {
      throw new Error(`Order with ID ${orderId} does not have a valid telegramId.`);
    }

    return result.wallet.user.telegramId;
  }

  async findOrdersByUserId(userId: string): Promise<Order[]> {
    return await this._prismaClient.findMany({
      where: {
        wallet: { userId },
      },
      include: {
        tokenpair: {
          include: {
            tokenA: true,
            tokenB: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByOrderCode(
    orderCode: string
  ): Promise<(Order & { tokenpair: { tokenA: Token; tokenB: Token } }) | null> {
    return await this._prismaClient.findFirst({
      where: { orderCode },
      include: {
        tokenpair: {
          include: {
            tokenA: true,
            tokenB: true,
          },
        },
      },
    });
  }

  getOrderStatusList(): Array<{ key: string; value: string }> {
    return Object.entries(OrderStatus)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => ({
        key,
        value: String(value),
      }));
  }

  getOrderStatusListFormatted(): string {
    return this.getOrderStatusList()
      .map((s) => `${s.key} (${s.value})`)
      .join('\n');
  }
}
