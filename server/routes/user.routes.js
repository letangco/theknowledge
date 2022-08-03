import { Router } from 'express';
import * as UserController from '../controllers/user.controller.js';
import {getKnowledgesByUser} from '../controllers/knowledge.controller.js';
import {getUserUseInviteCode} from "../controllers/userUseInviteCode.controller";
import isAdmin from '../libs/Auth/isAdmin.js';
import authen from '../libs/Auth/Auth.js';
import {postRatingV2, getUserComment, getCriterias} from '../controllers/rating.controller';
import * as DashboardController from "../controllers/dashboard.controller";
import * as AdminValidator from '../virtual_agent/validator/admin.validator';
import * as AgentValidator from '../virtual_agent/validator/agent.validator';
import * as UserValidator from '../virtual_agent/validator/user.validator';
import { isUser } from '../virtual_agent/auth/jwt.js';
const router = new Router();

// Get user by token
router.route('/user/tracking-video/:id').get(authen.auth(), UserController.trackingVideo);
router.route('/login/get-user-by-token/:token').get(UserController.getUserByToken);
// Get user by cuid
router.route('/user/get-user-by-cuid/:cuid').get(UserController.getUserByCuid);
router.route('/user/get-user-by-username/:username').get(UserController.getUserByUsername);
router.route('/user/get-user-by-token/:token').get(UserController.getUserByToken);
// Add User
router.route('/users').post(UserController.addUser);
// Update User
router.route('/user/update').post(UserController.updateUserInfo);
// Update Avatar
router.route('/user/upload-avatar').post(UserController.updateAvatar);
// Registry Account
router.route('/registry').post(UserController.registryAccount);
// resend email active
router.route('/resendEmail').post(UserController.resendEmailRegistry);
// Confirm account
router.route('/confirmAccount').post(UserController.confirmAccount);
// Check Username
router.route('/registry/checkphonenumber/:phoneNumber').get(UserController.checkPhoneNumber);
// Check Username
router.route('/registry/checkemail/:email').get(UserController.checkEmail);

router.route('/login').post(UserController.loginUser);

router.route('/forgot-password/:email').get(UserController.forgotPassword);

router.route('/check-token-reset/:token').get(UserController.checkTokenReset);
router.route('/reset-password').post(UserController.resetPassword);

router.route('/loginSocial').post(UserController.loginSocial);

router.route('/login-by-phone').post(UserController.userLoginByPhone);
router.route('/create-user-by-phone').post(UserController.createUserByPhone);
router.route('/verify-phone').post(authen.auth(), UserController.verifyPhone);

router.route('/joinCollection').get(UserController.testJoinCollection);


//get Countries
router.route('/getcountries').get(UserController.getCountries);

//update categories
router.route('/user/updateIndustry').post(UserController.updateIndustry);
router.route('/user/remove-industry/:id').post(authen.auth(), UserController.removeIndustry);

//update workExperience
router.route('/user/updateWorkExperience').post(UserController.updateWorkExperience);

//update education
router.route('/user/updateEducation').post(UserController.updateEducation);

//update Award
router.route('/user/updateAward').post(UserController.updateAward);

//update Expert
router.route('/user/updateExpert').post(UserController.updateExpertInfo);
router.route('/user/joinExpert').post(UserController.updateExpert);

//update LanguageSupport
router.route('/user/updateLanguageSupport').post(UserController.updateLanguageSupport);
//add new Rating
router.route('/user/addrating').post(authen.auth(), postRatingV2);
router.route('/user/getcriterias').get(getCriterias);
//get all comment info by array of cuid
router.route('/user/fetchUserCmtInfo/:cuidArray').get(UserController.getUserCmtInfo);

//Change password
router.route('/user/subscription-newsletter').post(UserController.subscriptionNewsletter);
router.route('/user/change-password').post(UserController.changePassword);
router.route('/user/check-password').post(UserController.checkPassword);
router.route('/user/delete-account/:token').get(UserController.deleteAccount);
router.route('/user/deactivate-account/:token').get(UserController.deactivateAccount);
router.route('/user/reactivate-account/:token').get(UserController.reactivateAccount);

//Send mail
router.route('/user/forgot-password/:userID').get(UserController.forgotPassword);

// Get user support state (Ready support / busy)
router.route('/user/get-support-state/:userID').get(UserController.getSupportState);
router.route('/user/:userId/session-ready').get(UserController.getIsUserSessionReady);
// Get user payment history
router.route('/user/get-payment-history/:token').get(UserController.getPaymentHistory);
// Get duration time able to call and chat
router.route('/user/get-available-time-call-chat/:token/:expert').get(UserController.getAvailableTimeCallChat);
// Check emailf
router.route('/user/check-email-edit/:email/:userID').get(UserController.checkEmailEdit);
router.route('/user/send-email-verification-code/:email/:userID').get(UserController.sendEmailVerification);
router.route('/user/send-verification-code/:code/:userID').get(UserController.sendVerificationCode);

router.route('/user/check-username-edit/:username/:userID').get(UserController.checkUserNameEdit);

router.route('/user/check-avatar/:userID').get(UserController.checkAvatar);
// Check phone number
router.route('/user/check-phone-edit/:phoneNumber/:userID').get(UserController.checkPhoneEdit);
//Update categories become expert.
router.route('/user/become-expert-update-categories').post(UserController.becomeExpertUpdateIndustries);
//Update work experience become expert.
router.route('/user/become-expert-update-work-experience').post(UserController.becomeExpertUpdateWorkExperience);
//Update education become expert.
router.route('/user/become-expert-update-education').post(UserController.becomeExpertUpdateEducation);
//Update awards become expert.
router.route('/user/become-expert-update-award').post(UserController.becomeExpertUpdateAwards);
//Update language support become expert.
router.route('/user/become-expert-update-language-support').post(UserController.becomeExpertUpdateLanguageSupport);
//Update information become expert.
router.route('/user/become-expert-update-information').post(UserController.becomeExpertUpdateInformation);
//Update expert become expert.
router.route('/user/become-expert-update-expert').post(UserController.becomeExpertUpdateExpert);
router.route('/get-expert-approved').get(UserController.expertApproved);
router.route('/approved-expert').post(UserController.approvedExpert);
//fetch meta seo profile page
router.route('/user-meta-by-username/:username')
  .get(UserController.getUserMetaByUsername);
router.route('/user-meta-by-cuid/:cuid')
  .get(UserController.getUserMetaByCuid);
// Get user's knowledge
router.route('/user/:userId/knowledges')
    .get(getKnowledgesByUser);

router.route('/user/update-auto-withdrawl')
    .put(authen.auth(), UserController.upadteAutoWithdrawlInfo);

router.route('/user/:userId/comments')
  .get(getUserComment);

// getUser by token
router.route('/user/get-profile-token')
  .get(
    isUser.auth(),
    UserController.getProfileByToken
  );

// Admin
router.route('/admin/login')
    .post(UserController.adminLogin);

router.route('/admin/users')
    .get(isAdmin.auth(), UserController.adminGetUsers);

router.route('/admin/users/approve_expert')
    .post(isAdmin.auth(), UserController.adminApproveExpert);

router.route('/admin/users/active_user')
    .post(isAdmin.auth(), UserController.adminActiveUser);

router.route('/admin/users/reject_expert')
  .post(isAdmin.auth(), UserController.adminRejectExpert);

router.route('/admin/users/unset_expert')
  .post(isAdmin.auth(), UserController.adminUnsetExpert);

router.route('/admin/users/ban')
    .post(isAdmin.auth(), UserController.adminBanUser);

router.route('/admin/users/unban')
    .post(isAdmin.auth(), UserController.adminUnBanUser);

router.route('/admin/users/delete')
    .delete(isAdmin.auth(), UserController.adminDeleteUser);

router.route('/admin/users/swap')
    .put(isAdmin.auth(), UserController.adminSwapRoleUser);

router.route('/admin/me')
        .get(isAdmin.auth(), UserController.adminGetOwnInfo);

router.route('/admin/permission-group/:url')
        .get(isAdmin.auth(), UserController.adminGetOwnPermission);

router.route('/admin/users/getUsers/:textSearch')
        .get(isAdmin.auth(),UserController.adminGetUsersByTextSearch);

router.route('/admin/users/resetMembership/:id')
        .get(isAdmin.auth(),UserController.adminResetMemberShip);

router.route('/admin/users/getUsers')
        .get(isAdmin.auth(),UserController.adminGetUsersByTextSearch);

router.route('/admin/users/sendEmailOrNotify')
        .post(isAdmin.auth(),UserController.adminSendEmailOrNotify);

router.route('/admin/users/historyMemberShip/:userId')
  .get(isAdmin.auth(),UserController.getHistoryMemberShip);

router.route('/admin/membership')
  .get(isAdmin.auth(),UserController.adminGetMembership);

router.route('/admin/membership/search')
  .get(isAdmin.auth(),UserController.adminSearchMembership);

router.route('/admin/user/search')
  .get(isAdmin.auth(),UserController.adminSearchUser);

router.route('/admin/user/update-membership')
  .get(UserController.updateMembership);

// Admin news

router.route('/admin/agents/news')
  .get(
    isAdmin.auth(),
    UserController.getListNewsAgentByAdmin
  )
  .post(
    isAdmin.auth(),
    AgentValidator.createNewsAgent,
    UserController.createNewsByAdmin
  );

router.route('/admin/agents/news/:id')
  .get(
    isAdmin.auth(),
    AgentValidator.deleteNewsAgentByAuthor,
    UserController.getDetailNewsByAdmin
  )
  .put(
    isAdmin.auth(),
    AgentValidator.updateNewsAgentByAuthor,
    UserController.updateNewsByAdmin
  )
  .delete(
    isAdmin.auth(),
    AgentValidator.deleteNewsAgentByAuthor,
    UserController.deleteNewsByAdmin
  );

// Point test page admin
router.route('/admin/point-test')
  .post(
    isAdmin.auth(),
    AdminValidator.createQuestionPointTest,
    UserController.createQuestionPointTest
  )
  .get(
    isAdmin.auth(),
    UserController.getListQuestionPointTest
  );

router.route('/admin/point-test/:id')
  .delete(
    isAdmin.auth(),
    AdminValidator.deleteQuestionPointTest,
    UserController.deleteQuestionPointTest
  )
  .get(
    isAdmin.auth(),
    AdminValidator.getDetailQuestionPointTest,
    UserController.getDetailQuestionPointTest
  )
  .put(
    isAdmin.auth(),
    AdminValidator.updateQuestionPointTest,
    UserController.updateQuestionPointTest
  );

// Tags Management to become agent/university
router.route('/admin/agents/tags')
  .post(
    isAdmin.auth(),
    AdminValidator.createTagsAgent,
    UserController.createTagsAgentByAdmin
  )
  .get(
    isAdmin.auth(),
    UserController.getListTagsAgentByAdmin
  );

router.route('/admin/agents/tags/:id')
  .get(
    isAdmin.auth(),
    AdminValidator.getDetailById,
    UserController.getDetailTagsAgentByAdmin
  )
  .put(
    isAdmin.auth(),
    AdminValidator.getDetailById,
    AdminValidator.editTagsAgent,
    UserController.updateTagsAgentByAdmin
  )
  .delete(
    isAdmin.auth(),
    AdminValidator.getDetailById,
    UserController.deleteTagsAgentsByAdmin
  );

// User news list
router.route('/news')
  .get(
    UserController.getListNewest
  );

router.route('/news/:id')
  .get(
    UserValidator.getDetailById,
    UserController.getDetailNews
  );

router.route('/news-carousel')
  .get(
    UserController.getListNewsCarousel
  );

// User management agent page
router.route('/admin/agents/user-management')
  .get(
    // isAdmin.auth(),
    AdminValidator.getUsersAgentPageByAdmin,
    UserController.getUserManagementByAdmin
  );

router.route('/admin/agents/user-management/:id')
  .get(
    // isAdmin.auth(),
    AdminValidator.getDetailById,
    UserController.getDetailUserManagementByAdmin
  );

router.route('/admin/agents/user-management/update-status/:id/:status')
  .put(
    // isAdmin.auth(),
    AdminValidator.updateStatusUserVirtualAgentByAdmin,
    UserController.updateStatusUserVirtualAgentByAdmin
  );

// Feed
/**
 * author: ntnhan
 * Use to check user had choose skills for get feeds
 */
router.route('/user/pre-feed-info').get(authen.auth(), UserController.preFeedInfo);
router.route('/user/skip-pre-feed').post(authen.auth(), UserController.skipPreFeed);
router.route('/user/dismiss-tour').get(authen.auth(), UserController.isDismissTour);
router.route('/user/dismiss-tour').post(authen.auth(), UserController.dismissTour);
router.route('/interested-skills')
  .get(authen.auth(), UserController.getInterestedSkills);

router.route('/reset-unread-messages/:groupCuid')
  .post(authen.auth(), UserController.resetUnreadMessages);


router.route('/user/add-device-token')
  .post(authen.auth(), UserController.addDeviceTokens);

router.route('/user/update-point-goal')
  .post(authen.auth(), UserController.updatePointGoal);


router.route('/user/update-point')
  .post(authen.auth(), UserController.updatePoint);

router.route('/user/add-device-aws-token')
  .post(authen.auth(), UserController.addDeviceAWSTokens);


// Invitation
router.route('/user/invited').get(authen.auth(), getUserUseInviteCode);

// Invitation
router.route('/user/contact-us').post(UserController.sendContactUs);
router.route('/user/test-mail').get(UserController.testmail);

router.route('/user/sendMailInvite').post(authen.auth(), UserController.sendMailInvite);
router.route('/user/editInviteCode/:code').get(authen.auth(), UserController.editInviteCode);
router.route('/meta-by-catslug/:slug').get(UserController.getMetaCatBySlug);
router.route('/user/get-all-user-base').get(UserController.getAllUserInfoBase);
router.route('/user/test-cache-image').get(UserController.testCacheImage);
router.route('/user/check-buy-membership/:memberShip').get(authen.auth(), UserController.checkBuyMemberShip);
router.route('/user/join-membership/:memberShip').post(authen.auth(), UserController.joinMembership);
router.route('/user/trial-membership/:memberShip').post(UserController.trialMembership);
router.route('/user/get-user-membership/').get(authen.auth(), UserController.getUserMembership);
router.route('/user/active-code-membership/:code').get(authen.auth(), UserController.activeCodeMemberShip);
router.route('/user/check-promotion-membership/:inviteCode').get(UserController.checkPromotionMemberShip);
router.route('/user/exchange/points')
  .post(authen.auth(), UserController.sellPoint);

router.route('/adminGeneralCodeUser')
  .get(UserController.adminGeneralCodeUser);

router.route('/user/update-profile-user')
  .post(authen.auth(), UserController.updateProfileUser);

router.route('/setting/send-mini-game')
  .post(authen.auth(), DashboardController.sendMiniGame);
router.route('/admin/mini-game')
  .delete(isAdmin.auth(), DashboardController.resetCandyUser)
  .get(isAdmin.auth(), DashboardController.getReportCandy);

export default router;
