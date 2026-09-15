module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const activitiesSchema = new Schema({
      activityImage: [String],
      name: String,
      key: String,
      summary: String,
      description: String,
      highlights: {
        type: Array,
        default: null
      },
      category: String, // slug from the categories collection, managed in the CMS
      region: String,
      regionId: {
        type: Schema.ObjectId,
        ref: 'Region'
      },
      location: String,
      locationId: {
        type: Schema.ObjectId,
        ref: 'Location'
      },
      meetingPoint: String,
      mapInfo: String,
      durationMinutes: Number,
      // Base rates. Date and weekday overrides live in their own collection later,
      // the way PropertiesRooms.price sits alongside PropertiesPrices - the base
      // stays here so adding the rules collection is additive, not a migration.
      pricing: {
        basis: {
          type: String,
          default: 'per_person'
        }, // per_person | per_group
        adult: Number,
        child: Number,
        minPax: Number,
        maxPax: Number
      },
      childMaxAge: Number,
      capacityPerDay: Number,
      disabledDate: {
        type: Array,
        default: null
      },
      inclusions: {
        type: Array,
        default: null
      },
      exclusions: {
        type: Array,
        default: null
      },
      // Whether the website renders the "What's included" section at all. Some
      // activities are quoted per enquiry and listing an inclusion is misleading,
      // so ops can switch the block off without deleting the lines they wrote.
      // Defaults true so every activity written before this field keeps its section.
      showInclusions: {
        type: Boolean,
        default: true
      },
      whatToBring: {
        type: Array,
        default: null
      },
      cancellationPolicy: String,
      // Internal only. Stripped before anything reaches the public API.
      supplier: {
        name: String,
        phone: String,
        email: String
      },
      sortOrder: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      },
      // Activities carry orders once booking lands, so delete is a flag - the hard
      // delete on properties orphans every booking that referenced it.
      isDeleted: {
        type: Boolean,
        default: false
      },
      // 'draft' activities are CMS work in progress and never reach the public API.
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

    activitiesSchema.plugin(deepPopulate);

    const activitiesModel = mongoose.model('Activities', activitiesSchema);

    return activitiesModel;
};
