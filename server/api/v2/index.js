import morgan from 'morgan';
import swaggerUI from 'swagger-ui-express';
import { Router } from 'express';
import { MORGAN_FORMAT } from '../../constants';
import swaggerSpec from './docs';
import roomRoute from '../../components/room/room.route';
import teacherMembershipRoute from '../../components/teacherMembership/teacherMembership.route';
import teacherRoute from '../../components/teacher/teacher.route';
import edutekContactRoute from '../../components/edutekContact/edutekContact.route';

const router = new Router();

router.use('/rooms', [roomRoute]);
router.use('/teacher-memberships', [teacherMembershipRoute]);
router.use('/teachers', [teacherRoute]);
router.use('/edutek-contacts', [edutekContactRoute]);

// Docs
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging') {
  router.use(morgan(MORGAN_FORMAT, {
    skip: (req, res) => {
      if (req.originalUrl.includes('api-docs')) {
        return true;
      }
      return res.statusCode < 400;
    },
    stream: process.stderr,
  }));
  router.use(morgan(MORGAN_FORMAT, {
    skip: (req, res) => {
      if (req.originalUrl.includes('api-docs')) {
        return true;
      }
      return res.statusCode >= 400;
    },
    stream: process.stdout,
  }));
  router.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));
} else {
  router.use(morgan(MORGAN_FORMAT, {
    skip: (req, res) => res.statusCode < 400,
    stream: process.stderr,
  }));
  router.use(morgan(MORGAN_FORMAT, {
    skip: (req, res) => res.statusCode >= 400,
    stream: process.stdout,
  }));
}

export default router;
