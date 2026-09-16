module.exports = function(Schema, mongoose, deepPopulate) {
    const reviewSchema = new Schema({
      propertyId: {
        type: Schema.ObjectId,
        ref: 'Properties'
      },
      rating: Number,
      user: {
        type: Schema.ObjectId,
        ref: 'Users'
      },
      review: String,
      images: [ String ],
      // Set only on reviews left through an admin-issued link. The website flow has
      // no booking in hand, which is why the CMS has to match one by guest+property.
      booking: {
        type: Schema.ObjectId,
        ref: 'Booking'
      },
      // 'invite' when it came from a review link, absent for the website form.
      source: String,
      // A stay booked without an account has no user document to take a name from.
      guestName: String,
      isUpdated: {
        type: Boolean,
        default: false
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
  
    reviewSchema.plugin(deepPopulate);
  
    const reviewsModel = mongoose.model('Reviews', reviewSchema);
  
    return reviewsModel;
};