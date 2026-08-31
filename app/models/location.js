module.exports = function(Schema, mongoose, deepPopulate) {
    const locationSchema = new Schema({
      locationName: String,
      locationId: String,
      region: {
        type: Schema.ObjectId,
        ref: 'Location'
      },
      regionId: String,
      isActive: {
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
  
    locationSchema.plugin(deepPopulate);
  
    const locationModel = mongoose.model('Location', locationSchema);
  
    return locationModel;
};