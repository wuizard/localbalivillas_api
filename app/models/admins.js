module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const adminSchema = new Schema({
      name: String,
      username: String,
      phoneNumber: String,
      role: String, // superadmin, admin, cashier
      password: String,
      tokenList: [String],
      token: String,
      allowedPermission: [String],
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
  
    adminSchema.plugin(deepPopulate);
  
    adminSchema.pre('save', function(next) {
      this.updatedDate = new Date();
      let admin = this;
      admin.updatedDate = new Date();
      const SALT_FACTOR = 8;
      if (!admin.isModified('password')) {
          return next();
      } else {
          bcrypt.genSalt(SALT_FACTOR, function(err, salt) {
              if (err) return next(err);
              bcrypt.hash(admin.password, salt, null, function(err, hash) {
                  if (err) return next(err);
                  admin.password = hash;
                  next();
              });
          });
      }
    });
  
    const adminModel = mongoose.model('Admin', adminSchema);
  
    return adminModel;
};
  