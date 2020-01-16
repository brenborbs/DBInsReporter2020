const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const reportSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32
    },
    project: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32
    },
    author: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32
    },
    subject: {
      type: String,
      required: true,
      maxlength: 2000
    },
    remarks: {
      type: String,
      required: true,
      maxlength: 2000
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000
    },
    action: {
      type: String,
      required: true,
      maxlength: 2000
    },
    status: {
      required: false,
      type: Boolean
    },
    contractor: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32
    },
    category: {
      type: ObjectId,
      ref: "Category",
      required: true
    },
    photo: {
      data: Buffer,
      contentType: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
