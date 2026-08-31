module.exports = function(Schema, mongoose, deepPopulate) {
    const regionSchema = new Schema({
      regionName: String,
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
  
    regionSchema.plugin(deepPopulate);
  
    const regionModel = mongoose.model('Region', regionSchema);
  
    return regionModel;
};