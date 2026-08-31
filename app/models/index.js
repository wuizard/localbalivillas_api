const mongoose = require('mongoose');
const uuid = require('uuid').v4;
const deepPopulate = require('mongoose-deep-populate')(mongoose);
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const UUID = mongoose.Types.UUID;
const mongoDBURL = CONFIG.mongoDBURL;

const mongooseOptions = {
    connectTimeoutMS: 30000,
};

const DB = mongoose.createConnection(mongoDBURL, mongooseOptions);
const activitiesModel = require('./activities')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const activityBookingModel = require('./activityBookings')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const activityPriceModel = require('./activityPrices')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const adminModel = require('./admins')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const bookingModel = require('./bookings')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
)
const couponModel = require('./coupons')(
    Schema,
    DB,
    deepPopulate,
)
const currencyModel = require('./currency')(
    Schema,
    DB,
    deepPopulate,
)
const enquiryModel = require('./enquiries')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
)
const eventPackageModel = require('./eventPackages')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
)
const locationModel = require('./location')(
    Schema,
    DB,
    deepPopulate,
)
const propertiesModel = require('./properties')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const propertiesRoomModel = require('./propertiesRoom')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const propertiesRoomPriceModel = require('./propertiesRoomPrice')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
);
const regionModel = require('./region')(
    Schema,
    DB,
    deepPopulate,
);
const reviewsModel = require('./reviews')(
    Schema,
    DB,
    deepPopulate,
)
const userModel = require('./users')(
    Schema,
    DB,
    [],
    bcrypt,
    deepPopulate,
)

exports.Activity = activitiesModel;
exports.ActivityBooking = activityBookingModel;
exports.ActivityPrice = activityPriceModel;
exports.Admin = adminModel;
exports.Booking = bookingModel;
exports.Coupon = couponModel;
exports.Currency = currencyModel;
exports.Enquiry = enquiryModel;
exports.EventPackage = eventPackageModel;
exports.Location = locationModel;
exports.Properties = propertiesModel;
exports.PropertyRoomPrices = propertiesRoomPriceModel;
exports.PropertyRooms = propertiesRoomModel;
exports.Region = regionModel;
exports.Reviews = reviewsModel;
exports.User = userModel;
