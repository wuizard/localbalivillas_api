module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const propertiesPriceSchema = new Schema({
      properties: {
        type: Schema.ObjectId,
        ref: 'Properties'
      },
      roomType: {
        type: Schema.ObjectId,
        ref: 'PropertiesRooms'
      },
      date: {
        type: Array,
        default: null
      },
      day: {
        type: Array,
        default: null
      },
      price: Number,
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
  
    propertiesPriceSchema.plugin(deepPopulate);
  
    const propertiesPriceModel = mongoose.model('PropertiesPrices', propertiesPriceSchema);
  
    return propertiesPriceModel;
};

//     {
//         date: null,
//         day: null,
//         price: 2500000
//     },
//     {
//         date: ['16-08-2024', '17-08-2024', '18-08-2024'],
//         day: null,
//         price: 16800000
//     },
//     {
//         date: null,
//         day: ['Saturday'],
//         price: 3850000
//     },
//     {
//         date: null,
//         day: ['Sunday'],
//         price: 4500000
//     },