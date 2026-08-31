module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const propertiesSchema = new Schema({
      propertyImage: [String],
      name: String,
      region: String,
      regionId: {
        type: Schema.ObjectId,
          ref: 'Region'
      },
      location: String, // Bali or Lombok
      locationId: {
        type: Schema.ObjectId,
          ref: 'Location'
      },
      key: String,
      type: String,
      bedRooms: [String],
      roomType: [
        {
            type: Schema.ObjectId,
            ref: 'PropertiesRooms'
        }
      ],
      description: String,
      houseRules: String,
      mapInfo: String,
      features: {
        type: Array,
        default: null
      }, // title (String), listFeature (Array)
      isActive: {
        type: Boolean,
        default: true
      },
      // 'draft' properties are work in progress: they are hidden from the public
      // API and listed under the CMS Drafts menu. Existing records have no status
      // field, so the default must stay 'published' or they would all disappear.
      status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
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
  
    propertiesSchema.plugin(deepPopulate);
  
    const propertiesModel = mongoose.model('Properties', propertiesSchema);
  
    return propertiesModel;
};