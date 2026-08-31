module.exports = function(Schema, mongoose, deepPopulate) {
    const currencySchema = new Schema({
      currency: String,
      currencyList: Object,
      createdDate: {
        type: Date,
        default: Date.now,
      },
      lastUpdatedDate: {
        type: Date,
        default: Date.now,
      },
    });
  
    currencySchema.plugin(deepPopulate);
  
    const currencyModel = mongoose.model('Currency', currencySchema);
  
    return currencyModel;
};