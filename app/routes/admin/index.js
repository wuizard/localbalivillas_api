'use strict';
module.exports = function(app) {

    const { requireAdmin, requireSuperAdmin } = require('../../helper/validation');

    let authController = require('../../controllers/admin/authControllers/auth');
    let adminController = require('../../controllers/admin/adminControllers/admin');
    let propertiesController = require('../../controllers/admin/propertiesControllers/properties');
    let bookingControllers = require('../../controllers/admin/bookingControllers/booking');
    let bookingEmailControllers = require('../../controllers/admin/emailControllers/booking');
    let regionControllers = require('../../controllers/admin/regionControllers/region');
    let userController = require('../../controllers/admin/userControllers/users');
    let couponControllers = require('../../controllers/admin/couponControllers/coupon');
    let currencyControllers = require('../../controllers/admin/currencyControllers/currency');
    let uploadControllers = require('../../controllers/admin/uploadControllers/upload');
    let activityControllers = require('../../controllers/admin/activityControllers/activities');
    let eventPackageControllers = require('../../controllers/admin/eventControllers/eventPackages');
    let enquiryControllers = require('../../controllers/admin/enquiryControllers/enquiries');
    let activityOrderControllers = require('../../controllers/admin/activityControllers/activityOrders');

    // The only route reachable without a token.
    app.route('/login').post(authController.login);

    // Everything declared below this line requires a valid, unrevoked admin token.
    // It is a gate rather than a per-route decorator on purpose: a new endpoint added
    // underneath is protected by default, and forgetting to opt in cannot expose it.
    app.use(requireAdmin);

    app.route('/logout').post(authController.logout);
    app.route('/me').get(authController.me);

    // presigned S3 upload - keeps AWS credentials out of the CMS bundle
    app.route('/upload/presign').post(uploadControllers.presignUpload);

    // Account management is superadmin-only, matching what the CMS already hides.
    app.route('/create-admin').post(requireSuperAdmin, adminController.createAdmin);
    app.route('/admins').get(requireSuperAdmin, adminController.getAdmins);
    app.route('/admin/:adminId').get(requireSuperAdmin, adminController.getAdmin);
    app.route('/update-admin').post(requireSuperAdmin, adminController.updateAdmin);
    app.route('/delete-admin/:adminId').delete(requireSuperAdmin, adminController.deleteAdmin);

    app.route('/users').get(userController.getUsers);
    app.route('/users/list-id').get(userController.getUsersId);

    app.route('/property/:id').get(propertiesController.getPropertyDetail);
    app.route('/properties/list').get(propertiesController.getProperties);
    app.route('/create-properties').post(propertiesController.createProperties);
    app.route('/update-properties').post(propertiesController.updateProperties);
    app.route('/delete-properties/:propertiesId').delete(propertiesController.deleteProperties);
    app.route('/hide-properties/:propertiesId').put(propertiesController.hideProperties);
    app.route('/properties/list-id').get(propertiesController.getPropertiesId);

    app.route('/activities').get(activityControllers.getActivities);
    app.route('/activity/:id').get(activityControllers.getActivityDetail);
    app.route('/create-activity').post(activityControllers.createActivity);
    app.route('/update-activity').post(activityControllers.updateActivity);
    app.route('/hide-activity/:activityId').put(activityControllers.hideActivity);
    app.route('/delete-activity/:activityId').delete(activityControllers.deleteActivity);

    app.route('/event-packages').get(eventPackageControllers.getEventPackages);
    app.route('/event-package/:id').get(eventPackageControllers.getEventPackageDetail);
    app.route('/create-event-package').post(eventPackageControllers.createEventPackage);
    app.route('/update-event-package').post(eventPackageControllers.updateEventPackage);
    app.route('/delete-event-package/:packageId').delete(eventPackageControllers.deleteEventPackage);

    app.route('/activity-orders').get(activityOrderControllers.getActivityOrders);
    app.route('/activity-order/status').post(activityOrderControllers.updateActivityOrderStatus);
    app.route('/activity-order/:id').get(activityOrderControllers.getActivityOrder);

    app.route('/enquiries').get(enquiryControllers.getEnquiries);
    app.route('/enquiry/:id').get(enquiryControllers.getEnquiryDetail);
    app.route('/enquiry/status').post(enquiryControllers.updateEnquiryStatus);

    app.route('/orders').get(bookingControllers.getBookings);
    app.route('/order/confirm-order').get(bookingControllers.confirmBooking);
    app.route('/order/reject-order').get(bookingControllers.rejectBooking);
    app.route('/order/refund-order').get(bookingControllers.refundBooking);
    app.route('/order/checkout-order').get(bookingControllers.checkoutBooking);
    app.route('/order/:id').get(bookingControllers.getBooking);

    app.route('/regions').get(regionControllers.getRegion);
    app.route('/create-region').post(regionControllers.createRegion);
    app.route('/update-region').post(regionControllers.updateRegion);
    app.route('/delete-region/:regionId').delete(regionControllers.deleteRegion);

    app.route('/coupons').get(couponControllers.getCoupons);
    app.route('/coupon/:id').get(couponControllers.getCoupon);
    app.route('/coupon/create').post(couponControllers.createCoupons)
    app.route('/coupon/update').post(couponControllers.updateCoupon)
    app.route('/coupon/delete/:id').delete(couponControllers.deleteCoupon)
    // createCoupons

    app.route('/locations').get(regionControllers.getLocation);
    app.route('/create-location').post(regionControllers.createLocation);
    app.route('/update-location').post(regionControllers.updateLocation);
    app.route('/delete-location/:locationId').delete(regionControllers.deleteLocation);

    // email - resend
    app.route('/email/resend-confirmation-email').get(bookingEmailControllers.resendConfirmationBookingEmail)

    // currency
    app.route('/currency/last-update').get(currencyControllers.getLastCurrency)

}