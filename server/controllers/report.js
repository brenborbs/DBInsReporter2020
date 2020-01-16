const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");
const Report = require("../models/report");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.reportById = (req, res, next, id) => {
  Report.findById(id)
    .populate("category")
    .exec((err, report) => {
      if (err || !report) {
        return res.status(400).json({
          error: "Report not found"
        });
      }
      req.report = report;
      next();
    });
};

exports.read = (req, res) => {
  req.report.photo = undefined;
  return res.json(req.report);
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded"
      });
    }
    // check for all fields
    const {
      item,
      project,
      author,
      subject,
      remarks,
      description,
      action,
      status,
      contractor,
      category
    } = fields;

    if (
      !item ||
      !project ||
      !author ||
      !subject ||
      !remarks ||
      !description ||
      !action ||
      !status ||
      !contractor ||
      !category
    ) {
      return res.status(400).json({
        error: "All fields are required"
      });
    }

    let report = new Report(fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size"
        });
      }
      report.photo.data = fs.readFileSync(files.photo.path);
      report.photo.contentType = files.photo.type;
    }

    report.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(result);
    });
  });
};

exports.remove = (req, res) => {
  let report = req.report;
  report.remove((err, deletedReport) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({
      message: "Report deleted successfully"
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded"
      });
    }

    let report = req.report;
    report = _.extend(report, fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size"
        });
      }
      report.photo.data = fs.readFileSync(files.photo.path);
      report.photo.contentType = files.photo.type;
    }

    report.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(result);
    });
  });
};

/**
 * sell / arrival
 * by sell = /reports?sortBy=sold&order=desc&limit=4
 * by arrival = /reports?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all reports are returned
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Report.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, reports) => {
      if (err) {
        return res.status(400).json({
          error: "Reports not found"
        });
      }
      res.json(reports);
    });
};

/**
 * it will find the reports based on the req report category
 * other reports that has the same category, will be returned
 */

exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Report.find({ _id: { $ne: req.report }, category: req.report.category })
    .limit(limit)
    .populate("category", "_id item")
    .exec((err, reports) => {
      if (err) {
        return res.status(400).json({
          error: "Reports not found"
        });
      }
      res.json(reports);
    });
};

exports.listCategories = (req, res) => {
  Report.distinct("category", {}, (err, reports) => {
    if (err) {
      return res.status(400).json({
        error: "Reports not found"
      });
    }
    res.json(reports);
  });
};

/**
 * list reports by search
 * we will implement report search in react frontend
 * we will show categories in checkbox
 * as the user clicks on those checkbox
 * we will make api request and show the reports to users based on what he wants
 */

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      findArgs[key] = req.body.filters[key];
      // if (key === "price") {
      //   // gte -  greater than price [0-10]
      //   // lte - less than
      //   findArgs[key] = {
      //     $gte: req.body.filters[key][0],
      //     $lte: req.body.filters[key][1]
      //   };
      // } else {
      //   findArgs[key] = req.body.filters[key];
      // }
    }
  }

  Report.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Reports not found"
        });
      }
      res.json({
        size: data.length,
        data
      });
    });
};

exports.photo = (req, res, next) => {
  if (req.report.photo.data) {
    res.set("Content-Type", req.report.photo.contentType);
    return res.send(req.report.photo.data);
  }
  next();
};

exports.listSearch = (req, res) => {
  // create query object to hold search value and category value
  const query = {};
  // assign search value to query.item
  if (req.query.search) {
    query.item = { $regex: req.query.search, $options: "i" };
    // assigne category value to query.category
    if (req.query.category && req.query.category != "All") {
      query.category = req.query.category;
    }
    // find the report based on query object with 2 properties
    // search and category
    Report.find(query, (err, reports) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(reports);
    }).select("-photo");
  }
};
