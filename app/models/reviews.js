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