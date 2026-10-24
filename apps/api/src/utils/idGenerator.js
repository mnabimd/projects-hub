const crypto = require('crypto');

// URL-safe alphabet (64 characters: A-Z, a-z, 0-9, _, -)
const URL_SAFE_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict';

/**
 * Generate a cryptographically secure URL-safe short identifier.
 * Uses Node.js native crypto module (avoids ESM compatibility issues with nanoid v5+).
 *
 * @param {number} [size=10] - Number of random characters to generate.
 * @param {string} [prefix=''] - Optional entity prefix (e.g. 'usr', 'prj').
 * @returns {string} The generated public identifier.
 */
const generatePublicId = (size = 10, prefix = '') => {
  const bytes = crypto.randomBytes(size);
  let id = '';
  for (let i = 0; i < size; i += 1) {
    id += URL_SAFE_ALPHABET[bytes[i] % URL_SAFE_ALPHABET.length];
  }
  return prefix ? `${prefix}_${id}` : id;
};

module.exports = {
  generatePublicId,
};
