// pages/api/admin/someAdminRoute.js

const checkRole = require('../../../middleware/checkRole');

export default function handler(req, res) {
  checkRole('admin')(req, res, () => {
    res.status(200).json({ msg: 'Welcome, admin!' });
  });
}
