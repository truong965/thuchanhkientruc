const prisma = require('../prisma');

async function getUsers(req, res) {
  console.log('[Users] Get all users request');
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    return res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
}

async function getUserById(req, res) {
  console.log(`[Users] Get user by ID: ${req.params.id}`);
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({ message: 'Error fetching user' });
  }
}

async function getMe(req, res) {
  console.log(`[Users] Get me request for user: ${req.user && req.user.username}`);
  try {
    const userId = req.user && req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ message: 'Error fetching current user' });
  }
}

module.exports = { getUsers, getUserById, getMe };
