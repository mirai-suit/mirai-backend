import { Router } from 'express';
import * as organizationController from '../controllers/organization.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// All routes below require authentication
router.post('/create', verifyToken, organizationController.createOrganization);
router.post('/add-member', verifyToken, organizationController.addMemberToOrganization);
router.delete('/remove-member', verifyToken, organizationController.removeMemberFromOrganization);
router.patch('/change-role', verifyToken, organizationController.changeUserRoleInOrganization);
router.get('/:orgId/members', verifyToken, organizationController.getOrganizationMembers);
router.get('/my-organizations', verifyToken, organizationController.getUserOrganizations);
router.get('/:orgId', verifyToken, organizationController.getOrganizationDetails);

export default router;