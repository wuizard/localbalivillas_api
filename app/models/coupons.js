module.exports = function(Schema, mongoose, deepPopulate) {
    const couponsSchema = new Schema({
      propertyId: [{
        type: Schema.ObjectId,
        ref: 'Properties'
      }],
      name: {
        type: String,
        required: true,
      },
      couponCode: {
        type: String,
        uppercase: true,
      },
      termsCondition: String,
      couponType: String, // percentage, nominal
      couponUsage: String, // total order, night
      minimumPurchase: Number,
      minimumDays: Number,
      paymentType: String, // VA, Bank Transfer
      startDate: Date,
      endDate: Date,
      limit: Number,
      limitUser: Number,
      amount: Number,
      user: [{
        type: Schema.ObjectId,
        ref: 'User'
      }],
      autoPopup: {
        type: Boolean,
        default: false,
      },
      isActive: {
        type: Boolean,
        default: false,
      },
      isUpdated: {
        type: Boolean,
        default: true
      },
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
  
    couponsSchema.plugin(deepPopulate);
  
    const couponsModel = mongoose.model('Coupons', couponsSchema);
  
    return couponsModel;
};