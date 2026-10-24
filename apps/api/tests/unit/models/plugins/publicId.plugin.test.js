const mongoose = require('mongoose');
const { publicId } = require('../../../../src/models/plugins');

describe('publicId plugin', () => {
  let connection;

  beforeEach(() => {
    connection = mongoose.createConnection();
  });

  it('should add publicId field with default size and index', () => {
    const schema = mongoose.Schema();
    schema.plugin(publicId);
    const Model = connection.model('Model1', schema);
    const doc = new Model();

    expect(doc.publicId).toBeDefined();
    expect(typeof doc.publicId).toBe('string');
    expect(doc.publicId.length).toBe(10);
    // BSON _id should still be an ObjectId
    expect(doc._id).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  it('should support custom prefix and size', () => {
    const schema = mongoose.Schema();
    schema.plugin(publicId, { prefix: 'usr', size: 12 });
    const Model = connection.model('Model2', schema);
    const doc = new Model();

    expect(doc.publicId).toBeDefined();
    expect(doc.publicId.startsWith('usr_')).toBe(true);
    expect(doc.publicId.length).toBe(4 + 12); // 'usr_' (4) + 12 chars
  });

  it('should support custom field name', () => {
    const schema = mongoose.Schema();
    schema.plugin(publicId, { fieldName: 'shortCode', size: 8 });
    const Model = connection.model('Model3', schema);
    const doc = new Model();

    expect(doc.shortCode).toBeDefined();
    expect(doc.shortCode.length).toBe(8);
  });
});
