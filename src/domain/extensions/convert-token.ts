
export function lovelaceToAda(lovelace: number, policyId: string): number {
  const ADA_PER_LOVELACE = 1_000_000; // 1 ADA = 1,000,000 Lovelace

  if (policyId === '') {
    return lovelace / ADA_PER_LOVELACE;
  }
  return lovelace;
}

export function adaToLovelace(ada: number, policyId: string): number {
  const ADA_PER_LOVELACE = 1_000_000; // 1 ADA = 1,000,000 Lovelace

  if (policyId === '') {
    return Math.floor(ada * ADA_PER_LOVELACE);
  }
  return ada;
}