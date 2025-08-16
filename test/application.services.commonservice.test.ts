import { PoolV2 } from "@minswap/sdk";

describe('PoolV2.calculateAmountOut', () => {
  const pool = PoolV2; // Use PoolV2 as a static utility or module

  (PoolV2 as any).DEFAULT_TRADING_FEE_DENOMINATOR = 1000n;

  it('should calculate the correct amountOut', () => {
    const result = (pool as any).calculateAmountOut({
      reserveIn: 1000n,
      reserveOut: 1000n,
      amountIn: 100n,
      tradingFeeNumerator: 3n, // represents a 0.3% fee
    });

    // Manually compute expected value using same formula
    const inWithFee = (1000n - 3n) * 100n; // 99700
    const numerator = inWithFee * 1000n;
    const denominator = 1000n * 1000n + inWithFee;
    const expected = numerator / denominator;

    expect(result).toBe(expected);
  });

  it('should return 0 if amountIn is 0', () => {
    const result = (pool as any).calculateAmountOut({
      reserveIn: 1000n,
      reserveOut: 1000n,
      amountIn: 0n,
      tradingFeeNumerator: 3n,
    });

    expect(result).toBe(0n);
  });

  it('should handle high trading fee', () => {
    const result = (pool as any).calculateAmountOut({
      reserveIn: 1000n,
      reserveOut: 1000n,
      amountIn: 100n,
      tradingFeeNumerator: 999n, // nearly 100% fee
    });

    expect(result).toBeLessThan(1n);
  });
});
