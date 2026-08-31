module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const activityBookingSchema = new Schema({
      // `AB` prefix so an activity order is never mistaken for a villa booking id
      // in an email, a Xendit dashboard or a support conversation.
      activityBookingId: String,
      user: {
        type: Schema.ObjectId,
        ref: 'Users'
      },
      // Denormalised alongside the ref: an activity can be renamed or retired, and
      // an order has to stay readable exactly as it was sold.
      activityInfo: {
        activity: {
          type: Schema.ObjectId,
          ref: 'Activities'
        },
        name: String,
        key: String,
        image: [String],
        meetingPoint: String,
        durationMinutes: Number,
        category: String,
        region: String
      },
      // The single day it runs. Not a range - an activity is charged for the day it
      // happens, which is why it never touches the stay/nights maths.
      date: String,
      pax: {
        adult: Number,
        child: Number,
        childrenAge: [Number]
      },
      // The resolved rates, stored. A later price edit must never rewrite what
      // somebody already paid.
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
        country: String
      },
      pickupArea: String,
      specialRequest: String,
      voucherInfo: {
        voucherCode: String,
        nominal: Number,
        discountType: String,
        couponUsage: String
      },
      subtotal: Number,
      totalPrice: Number,
      paymentLink: String,
      lastStatus: String,
      status: [{
        _id: false,
        status: String, // waiting_payment, paid, confirmed, cancelled, refunded
        date: {
          type: Date,
          default: null
        }
      }],
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

    activityBookingSchema.plugin(deepPopulate);

    const activityBookingModel = mongoose.model('ActivityBookings', activityBookingSchema);

    return activityBookingModel;
};
