import { OrderType } from "./enums";

export const choices = [
  { name: 'Market', value: OrderType.Market },
  { name: 'Limit', value: OrderType.Limit },
  { name: 'StopLimit', value: OrderType.StopLimit },
];

export type TChoice = {
  name: string;
  value: OrderType;
};
