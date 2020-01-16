const express = require("express");
const router = express.Router();

const {
  create,
  reportById,
  read,
  remove,
  update,
  list,
  listRelated,
  listCategories,
  listBySearch,
  photo,
  listSearch
} = require("../controllers/report");
const { requireSignin, isAuth, isAdmin } = require("../controllers/auth");
const { userById } = require("../controllers/user");

router.get("/report/:reportId", read);
router.post("/report/create/:userId", requireSignin, isAuth, create);
router.delete(
  "/report/:reportId/:userId",
  requireSignin,
  isAuth,
  isAdmin,
  remove
);
router.put("/report/:reportId/:userId", requireSignin, isAuth, isAdmin, update);

router.get("/reports", list);
router.get("/reports/search", listSearch);
router.get("/reports/related/:reportId", listRelated);
router.get("/reports/categories", listCategories);
router.post("/reports/by/search", listBySearch);
router.get("/report/photo/:reportId", photo);

router.param("userId", userById);
router.param("reportId", reportById);

module.exports = router;
