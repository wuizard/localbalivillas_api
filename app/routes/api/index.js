'use strict';
module.exports = function(app) {

    // let token = require('../../helper/validation');

    let propertiesController = require('../../controllers/api/propertiesControllers/properties')
    let reviewController = require('../../controllers/api/propertiesControllers/reviews')
    let couponController = require('../../controllers/api/couponControllers/coupons')
    let bookingController = require('../../controllers/api/bookingControllers/booking')
    let regionController = require('../../controllers/api/regionControllers/location')
    let activityController = require('../../controllers/api/activityControllers/activities')
    let eventController = require('../../controllers/api/eventControllers/events')
    let enquiryController = require('../../controllers/api/enquiryControllers/enquiries')
    let activityBookingController = require('../../controllers/api/activityControllers/activityBookings')

    app.route('/region/location').get(regionController.getLocation);

    app.route('/activities/list').get(activityController.getActivities);
    // before '/activity/:id' or ':id' swallows the availability segment
    app.route('/activity/:id/availability').get(activityController.getActivityAvailability);
    app.route('/activity/quote').post(activityBookingController.quoteActivityBooking);
    app.route('/activity/booking').post(activityBookingController.submitActivityBooking);
    // after the fixed segments above, or ':id' swallows 'quote' and 'booking'
    app.route('/activity/:id').get(activityController.getActivityDetail);

    app.route('/event-packages').get(eventController.getEventPackages);
    app.route('/event-package/:id').get(eventController.getEventPackageDetail);

    app.route('/enquiry').post(enquiryController.submitEnquiry);
    app.route('/enquiry/handoff').post(enquiryController.markHandoff);
    app.route('/lookup').post(enquiryController.lookupByReference);
    app.route('/lookup/:token').get(enquiryController.lookupByToken);

    app.route('/coupon-list').get(couponController.getCoupons);

    app.route('/property/:id').get(propertiesController.getPropertyDetail);
    app.route('/properties/list').get(propertiesController.getProperties);

    app.route('/booking/coupon-check').post(bookingController.checkCoupon);
    app.route('/booking/stay-lookup').post(bookingController.lookupStay);
    app.route('/booking/submit').post(bookingController.submitBookings);

    app.route('/reviews/:propertyId').get(reviewController.getReviews);
    app.route('/reviews/create').post(reviewController.submitReview);
    app.route('/reviews/update').post(reviewController.updateReview);
}