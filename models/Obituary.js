
const mongoose = require('mongoose');

const obituarySchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    middleName: {
        type: String,
        trim: true,
        default: ''
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    birthDate: {
        type: Date,
        default: null
    },
    deathDate: {
        type: Date,
        default: null
    },
    age: {
        type: Number
    },
    photo: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: 'Unknown'
    },
    biography: {
        type: String,
        default: ''
    },
    videoUrl: {
        type: String,
        default: null
    },
    externalVideo: {
        type: String,
        default: null
    },
    embeddedVideo: {
        type: String,
        default: null
    },
    serviceType: {
        type: String,
        default: 'PRIVATE FAMILY SERVICE'
    },
    serviceDate: {
        type: Date,
        default: null
    },
    serviceLocation: {
        type: String,
        default: null
    },
    floralStoreLink: {
        type: String,
        default: null
    },
    treePlantingLink: {
        type: String,
        default: null
    },
    backgroundImage: {
        type: String,
        default: null
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

obituarySchema.pre('validate', function (next) {
    if (!this.age && this.birthDate && this.deathDate) {
        const birth = new Date(this.birthDate);
        const death = new Date(this.deathDate);
        const ageInMs = death - birth;
        this.age = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
    }
    next();
});

module.exports = mongoose.model('Obituary', obituarySchema);