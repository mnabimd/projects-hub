const { generatePublicId } = require('../../utils/idGenerator');

/**
 * A mongoose schema plugin that adds a unique public-facing identifier (publicId)
 * while preserving the native MongoDB BSON ObjectId for internal references and indexing.
 *
 * @param {import('mongoose').Schema} schema
 * @param {Object} [options]
 * @param {string} [options.fieldName='publicId'] - Name of the field to add
 * @param {string} [options.prefix=''] - Optional prefix for the generated identifier
 * @param {number} [options.size=10] - Length of random characters
 */
const publicId = (schema, options = {}) => {
  const fieldName = options.fieldName || 'publicId';
  const prefix = options.prefix || '';
  const size = options.size || 10;

  schema.add({
    [fieldName]: {
      type: String,
      unique: true,
      sparse: true,
      default: () => generatePublicId(size, prefix),
      index: true,
    },
  });
};

module.exports = publicId;
