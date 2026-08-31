module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const bookingSchema = new Schema({
      bookingId: String,
      user: {
        type: Schema.ObjectId,
        ref: 'Users'
      },
      propertiesInfo: {
        properties: {
          type: Schema.ObjectId,
          ref: 'Properties'
        },
        room: {
          type: Schema.ObjectId,
          ref: 'PropertiesRooms'
        },
        placeImage: [String],
        roomImage: [String],
        propertiesName: String,
        roomName: String,
        detail: Object,
        price: {
          type: Array,
          default: []
        }
      },
      dates: [String],
      priceDetails: {
        type: Array,
        default: []
      },
      guestInfo: {
        name: String,
        firstName: String,
        lastName: String,
        phoneNumber: String,
        email: String,
        adult: Number,
        kids: Number,
        childrenAge: Number,
      },
      totalRooms: Number,
      arrivalTime: String, 
      specialRequest: String,
      voucherInfo: {
        voucherCode: String,
        nominal: Number,
        discountType: String,
        couponUsage: String
      },
      subtotal: Number,
      totalPrice: Number,
      uniqueCode: String,
      description: String,
      paymentLink: String,
      lastStatus: String,
      checkOutDate: Date,
      isCheckOut: {
        type: Boolean,
        default: false
      },
      status: [{
        _id: false,
        status: String,
        date: {
          type: Date,
          default: null
        }
      }], // waiting payment, confirmed, checkout, paid, refund
      createdDate: {
        type: Date,
        default: Date.now,
      },
      updatedDate: {
        type: Date,
        default: Date.now,
      },
    });
  
    bookingSchema.plugin(deepPopulate);
  
    const bookingModel = mongoose.model('Booking', bookingSchema);
  
    return bookingModel;
};