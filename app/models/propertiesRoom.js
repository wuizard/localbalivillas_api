module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const propertiesRoomSchema = new Schema({
      propertyImage: [String],
      name: String,
      room: Number,
      bed: Number,
      price: Number,
      index: Number,
      maximumGuest: {
        adult: Number,
        child: Number,
        total: Number
      },
      roomSize: String,
      poolSize: String,
      facilities: {
        swimmingPool: Boolean,
        publicPool: Boolean,
        privatePool: Boolean,
        airportShuttle: Boolean,
        restaurant: Boolean,
        breakfast: Boolean,
        freeParking: Boolean
      },
      amenities: {
        type: Array,
        default: null
      }, // title (String), listFeature (Array)
      disabledDate: {
        type: Array,
        default: null
      },
      properties: {
        type: Schema.ObjectId,
        ref: 'Properties'
      },
      isActive: {
        type: Boolean,
        default: true
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
  
    propertiesRoomSchema.plugin(deepPopulate);
  
    const propertiesRoomModel = mongoose.model('PropertiesRooms', propertiesRoomSchema);
  
    return propertiesRoomModel;
};