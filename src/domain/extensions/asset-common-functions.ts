// Magic string to identify token created from MIN (or CIP68)
const TOKEN_NAME_MAGIC_STRING = '0014df10';

/**
 * Checks whether a given string is a valid Cardano policyId.
 *
 * A valid policyId:
 * - Consists of exactly 56 hexadecimal characters (0-9, a-f)
 * - Is case-insensitive
 */
export const isValidPolicyId = (policyId: string): boolean => {
  return /^[0-9a-f]{56}$/i.test(policyId);
};

/**
 * Extracts the assetName from a unit string (policyId + assetName).
 *
 * @param unit - A hex string consisting of a policyId (56 characters) followed by the assetName (hex-encoded)
 * @returns The assetName decoded as a UTF-8 string
 */
export const getAssetNameFromUnit = (unit: string): string => {
  try {
    const assetNameHex = removeMagicString(unit.slice(56));
    const bytes = Buffer.from(assetNameHex, 'hex');

    return bytes.toString('utf8');
  } catch (error) {
    console.error('Không thể decode assetName:', error);
    return '';
  }
};

/**
 * Decodes the assetName from a hex-encoded asset name string.
 *
 * @param assetHexName - A hex-encoded string representing the asset name
 * @returns The decoded assetName as a UTF-8 string
 */
export const getAssetNameFromAssetHexName = (assetHexName: string): string => {
  try {
    assetHexName = removeMagicString(assetHexName);
    const bytes = Buffer.from(assetHexName, 'hex');

    // Convert byte array to UTF-8 string
    return bytes.toString('utf8');
  } catch (error) {
    console.error('Failed to decode assetName:', error);
    return '';
  }
};

/**
 * Removes the magic string from the input string if it exists.
 *
 * @param input - The input string to process
 * @returns The input string without the magic string
 */
export const removeMagicString = (input: string): string => {
  return input.replace(TOKEN_NAME_MAGIC_STRING, '');
};
