module.exports = function(Schema, mongoose, deepPopulate) {
    const reviewInviteSchema = new Schema({
      // The only credential. Long and random because anyone holding it can post a
      // review against this booking without proving anything else.
      token: {
        type: String,
        index: true
      },
      booking: {
        type: Schema.ObjectId,
        ref: 'Booking'
      },
      // Snapshots taken when the link is issued, so the CMS can list a link without
      // loading the booking, and so a later edit to the booking cannot move the
      // review to a different property than the guest was invited to review.
      bookingId: String,
      propertyId: {
        type: Schema.ObjectId,
        ref: 'Properties'
      },
      propertyName: String,
      // Snapshot too: the guest's page leads with it, and a later gallery edit should
      // not swap the photo under a link already sent.
      propertyImage: String,
      user: {
        type: Schema.ObjectId,
        ref: 'Users'
      },
      guestName: String,
      guestEmail: String,
      dates: [ String ],
      createdBy: {
        _id: Schema.ObjectId,
        name: String,
        username: String
      },
      expiresAt: Date,
      usedAt: Date,
      review: {
        type: Schema.ObjectId,
        ref: 'Reviews'
      },
      isRevoked: {
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

    reviewInviteSchema.plugin(deepPopulate);

    const reviewInvitesModel = mongoose.model('ReviewInvites', reviewInviteSchema);

    return reviewInvitesModel;
};
