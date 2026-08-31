module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const userSchema = new Schema({
      name: String,
      phoneNumber: String,
      email: String,
      title: String,
      firstName: String,
      lastName: String,
      country: {
        _id: false,
        iso2: String,
        name: String
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
  
    userSchema.plugin(deepPopulate);
  
    const userModel = mongoose.model('User', userSchema);
  
    return userModel;
};