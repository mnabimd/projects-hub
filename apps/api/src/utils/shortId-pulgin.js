const { nanoid } = require('nanoid');

module.exports = function shortIdPlugin(schema) {
  schema.add({
    _id: { type: String, default: () => nanoid(10) },
  });

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  });
};
