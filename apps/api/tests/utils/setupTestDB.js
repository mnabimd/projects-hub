const mongoose = require('mongoose');
const config = require('../../src/config/config');
const systemConfigService = require('../../src/services/systemConfig.service');

const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect(config.mongoose.url, config.mongoose.options);
  });

  beforeEach(async () => {
    systemConfigService.invalidateCache();
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    systemConfigService.invalidateCache();
    await mongoose.disconnect();
  });
};

module.exports = setupTestDB;
