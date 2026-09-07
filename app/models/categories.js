module.exports = function(Schema, mongoose, deepPopulate) {
    const categorySchema = new Schema({
      // What the CMS and the public site show.
      name: String,
      // The value stored on an activity and used in public URLs. Generated from
      // the name, and regenerated when the name changes - the update endpoint
      // rewrites the activities in the same request so none are left behind.
      slug: {
        type: String,
        index: true
      },
      description: String,
      // Display order in the CMS picker and on the website's filter bar.
      sortOrder: {
        type: Number,
        default: 0
      },
      // An inactive category stays on its existing activities but is not
      // offered for new ones and is hidden from the public filter.
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

    categorySchema.plugin(deepPopulate);

    const categoryModel = mongoose.model('Category', categorySchema);

    return categoryModel;
};
