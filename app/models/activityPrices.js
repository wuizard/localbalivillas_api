module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const activityPriceSchema = new Schema({
      activity: {
        type: Schema.ObjectId,
        ref: 'Activities'
      },
      // Same rule shape as PropertiesPrices: a row with both null is the base rate,
      // a `day` row is a weekday override, a `date` row is an exact-date override.
      date: {
        type: Array,
        default: null
      },
      day: {
        type: Array,
        default: null
      },
      // An activity is priced per head, so one row carries both rates - a weekend
      // surcharge applies to adults and children at once rather than being entered
      // twice and drifting apart.
      adultPrice: Number,
      childPrice: Number,
      isDeleted: {
        type: Boolean,
        default: false
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

    activityPriceSchema.plugin(deepPopulate);

    const activityPriceModel = mongoose.model('ActivityPrices', activityPriceSchema);

    return activityPriceModel;
};

//     {
//         date: null,
//         day: null,
//         adultPrice: 850000, childPrice: 500000        // base
//     },
//     {
//         date: null,
//         day: ['Saturday', 'Sunday'],
//         adultPrice: 950000, childPrice: 550000        // weekend
//     },
//     {
//         date: ['2026-12-24', '2026-12-25'],
//         day: null,
//         adultPrice: 1400000, childPrice: 800000       // specific dates
//     },
