import {Router} from 'express';
import * as CategoryController from '../controllers/category.controller.js';
import isAdmin from '../libs/Auth/isAdmin.js';

const router = new Router();

router.route('/getCategories').get(CategoryController.getCategories);
router.route('/getDepartment').get(CategoryController.getDepartment);
//router.route('/getDepartmentUser').get(CategoryController.getDepartmentUser);
router.route('/getDepartmentRequest').get(CategoryController.getCategories);
router.route('/getCategoriesByParentID/:catID').get(CategoryController.getCategoriesByParentID);
router.route('/getCategoryByID/:catID').get(CategoryController.getCategoriesByID);
router.route('/category/add').post(CategoryController.addCategory);
router.route('/category/delete').post(CategoryController.deleteCategory);
router.route('/category/get-all').get(isAdmin.auth(), CategoryController.getAllCategoriesAdmin);
router.route('/category/export-all').get( CategoryController.exportAllCategories);
router.route('/category/addV2').post(isAdmin.auth(), CategoryController.addCategoryV2);
router.route('/category/update').post(isAdmin.auth(), CategoryController.updateCategory);

// Use for feed
router.route('/category/get-all-department').get(CategoryController.getAllDepartment);

router.get('/category/all', CategoryController.getAllCategories);

export default router;
