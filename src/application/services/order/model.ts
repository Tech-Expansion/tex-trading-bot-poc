export interface OrderHistoryDto {
  id: string;
  orderCode: string;
  status: string;
  createdAt: Date;
  tokenPair: string;
  amount: string;
}
