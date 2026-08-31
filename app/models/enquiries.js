module.exports = function(Schema, mongoose, enumList, bcrypt, deepPopulate) {
    const enquirySchema = new Schema({
      // Short and readable, because guests read it back over WhatsApp.
      reference: {
        type: String,
        unique: true,
        index: true
      },
      // The magic link in the confirmation email uses this, never the reference -
      // a short reference ends up in browser history and shared screenshots.
      lookupToken: {
        type: String,
        index: true
      },
      // Polymorphic from the start. Events is the first user; a custom tour request
      // wants the same record, and a generic subject costs one field today against
      // a migration later.
      subject: {
        kind: {
          type: String,
          enum: ['event', 'activity', 'custom'],
          default: 'event'
        },
        ref: Schema.ObjectId,
        name: String
      },
      guest: {
        firstName: String,
        lastName: String,
        name: String,
        email: String,
        phoneNumber: String,
        country: String
      },
      user: {
        type: Schema.ObjectId,
        ref: 'Users'
      },
      // Set when the enquiry was raised from a booking confirmation. These are the
      // valuable ones: villa, dates and party size are already known.
      booking: {
        type: Schema.ObjectId,
        ref: 'Booking'
      },
      bookingId: String,
      eventDate: Date,
      dateFlexible: {
        type: Boolean,
        default: false
      },
      guestCount: Number,
      propertyRef: {
        type: Schema.ObjectId,
        ref: 'Properties'
      },
      propertyName: String,
      // Banded, never a free number - "flexible" and "as cheap as possible" route
      // nowhere, and a band is answerable by someone who genuinely does not know.
      budgetBand: String,
      occasionNote: String,
      handoff: {
        channel: String, // whatsapp | email
        // The guest opened WhatsApp. NOT proof they sent anything - never surface
        // this as "chatted" or the team stops following up on real leads.
        clickedAt: Date
      },
      quote: {
        amount: Number,
        sentAt: Date,
        validUntil: Date
      },
      // Which entry point produced this. After 90 days it says which of the five is
      // worth building more of.
      source: {
        type: String,
        default: 'direct'
      },
      internalNote: String,
      lastStatus: {
        type: String,
        default: 'new'
      },
      status: [{
        _id: false,
        status: String, // new | in_conversation | quoted | won | lost | closed
        date: {
          type: Date,
          default: null
        }
      }],
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

    enquirySchema.plugin(deepPopulate);

    const enquiryModel = mongoose.model('Enquiries', enquirySchema);

    return enquiryModel;
};
