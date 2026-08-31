module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const eventPackageSchema = new Schema({
      packageImage: [String],
      name: String,
      key: String,
      summary: String,
      description: String,
      // What the team typically arranges for this occasion. Not a contract - the
      // quote follows the conversation, so nothing here is priced per line.
      typicallyIncludes: {
        type: Array,
        default: null
      },
      // Shown as a range with "typically". Never marked up as an Offer: the real
      // number comes out of the conversation, not this field.
      indicativeFrom: Number,
      indicativeTo: Number,
      suitableGuestsMin: Number,
      suitableGuestsMax: Number,
      sortOrder: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      },
      isDeleted: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
      },
      createdDate: {
        type: Date,
        default: Date.now,
      },
      updatedDate: {
        type: Date,
        default: Date.now,
      },
    });

    eventPackageSchema.plugin(deepPopulate);

    const eventPackageModel = mongoose.model('EventPackages', eventPackageSchema);

    return eventPackageModel;
};
