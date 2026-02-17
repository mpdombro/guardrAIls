import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, getUserInfo } from '../middleware/auth.js';
import { asyncAuthService } from '../services/async-auth/AsyncAuthService.js';

const router = Router();

// Require authentication for all approval endpoints
router.use(requireAuth);
router.use(getUserInfo);

/**
 * Get pending approval requests for the current user
 */
router.get(
  '/pending',
  asyncHandler(async (req, res) => {
    const userId = req.user!.sub;

    const pendingRequests = asyncAuthService.getPendingRequestsForUser(userId);

    res.json({
      requests: pendingRequests,
      count: pendingRequests.length,
    });
  })
);

/**
 * Get a specific approval request
 */
router.get(
  '/:authReqId',
  asyncHandler(async (req, res) => {
    const { authReqId } = req.params;
    const request = asyncAuthService.getRequest(authReqId);

    if (!request) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    // Only allow user to see their own requests
    if (request.userId !== req.user!.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(request);
  })
);

/**
 * Approve a request (manual approval for simulated CIBA)
 */
router.post(
  '/:authReqId/approve',
  asyncHandler(async (req, res) => {
    const { authReqId } = req.params;

    const request = asyncAuthService.getRequest(authReqId);

    if (!request) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    // Only allow user to approve their own requests
    if (request.userId !== req.user!.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = asyncAuthService.approveRequest(authReqId);

    if (!success) {
      return res.status(400).json({ error: 'Failed to approve request' });
    }

    res.json({
      message: 'Request approved',
      request: asyncAuthService.getRequest(authReqId),
    });
  })
);

/**
 * Deny a request (manual denial for simulated CIBA)
 */
router.post(
  '/:authReqId/deny',
  asyncHandler(async (req, res) => {
    const { authReqId } = req.params;

    const request = asyncAuthService.getRequest(authReqId);

    if (!request) {
      return res.status(404).json({ error: 'Approval request not found' });
    }

    // Only allow user to deny their own requests
    if (request.userId !== req.user!.sub) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = asyncAuthService.denyRequest(authReqId);

    if (!success) {
      return res.status(400).json({ error: 'Failed to deny request' });
    }

    res.json({
      message: 'Request denied',
      request: asyncAuthService.getRequest(authReqId),
    });
  })
);

export default router;
