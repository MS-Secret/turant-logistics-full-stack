const Role = require('../models/role.model');
const User = require('../models/user.model');


  // Create role
  const createRole=async(roleData)=> {
    const { name, description, permissions } = roleData;

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.toUpperCase() });
    if (existingRole) {
      throw new Error('Role already exists');
    }

    const role = new Role({
      name: name.toUpperCase(),
      description,
      permissions
    });

    await role.save();
    return role;
  }

  // Get all roles
 const getAllRoles = async (filters = {}) => {
    const { isActive, search } = filters;
    const query = {};

    if (isActive !== undefined) query.isActive = isActive;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const roles = await Role.find(query).sort({ createdAt: -1 });
    return roles;
  }

  // Get role by ID
  const getRoleById = async (roleId) => {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  // Get role by name
  const getRoleByName = async (name) => {
    const role = await Role.findOne({ name: name.toUpperCase(), isActive: true });
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  // Update role
  const updateRole = async (roleId, updateData) => {
    const role = await Role.findByIdAndUpdate(
      roleId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  // Delete role
  const deleteRole = async (roleId) => {
    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ 
      role: { $exists: true },
      isDeleted: false 
    });

    if (usersWithRole > 0) {
      throw new Error('Cannot delete role. Users are assigned to this role');
    }

    const role = await Role.findByIdAndDelete(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    return { message: 'Role deleted successfully' };
  }

  // Update role permissions
  const updateRolePermissions = async (roleId, permissions) => {
    const role = await Role.findByIdAndUpdate(
      roleId,
      { permissions },
      { new: true }
    );

    if (!role) {
      throw new Error('Role not found');
    }

    return role;
  }

  // Add permission to role
  const addPermissionToRole = async (roleId, permission) => {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if permission already exists
    const existingPermission = role.permissions.find(p => p.module === permission.module);
    if (existingPermission) {
      // Merge actions
      const newActions = [...new Set([...existingPermission.actions, ...permission.actions])];
      existingPermission.actions = newActions;
    } else {
      role.permissions.push(permission);
    }

    await role.save();
    return role;
  }

  // Remove permission from role
  const removePermissionFromRole = async (roleId, module) => {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    role.permissions = role.permissions.filter(p => p.module !== module);
    await role.save();
    return role;
  }

  // Get users by role
  const getUsersByRole = async (roleName) => {
    const users = await User.find({
      role: roleName.toUpperCase(),
      isDeleted: false
    }).select('userId username email phone status createdAt');

    return users;
  }

  // Check user permission
  const checkUserPermission = async (userId, module, action) => {
    const user = await User.findOne({ userId, isDeleted: false });
    if (!user) {
      throw new Error('User not found');
    }

    // Get role permissions
    const role = await Role.findOne({ name: user.role, isActive: true });
    let hasPermission = false;

    // Check role permissions
    if (role) {
      const rolePermission = role.permissions.find(p => p.module === module);
      if (rolePermission && rolePermission.actions.includes(action)) {
        hasPermission = true;
      }
    }

    // Check user-specific permissions
    if (!hasPermission && user.permissions) {
      const userPermission = user.permissions.find(p => p.module === module);
      if (userPermission && userPermission.actions.includes(action)) {
        hasPermission = true;
      }
    }

    return {
      hasPermission,
      user: {
        userId: user.userId,
        role: user.role
      }
    };
  }

  // Get default roles
  const getDefaultRoles = async () => {
    const defaultRoles = [
      {
        name: 'USER',
        description: 'Regular application user',
        permissions: [
          {
            module: 'ORDER',
            actions: ['CREATE', 'READ']
          },
          {
            module: 'USER',
            actions: ['READ', 'UPDATE']
          }
        ]
      },
      {
        name: 'DRIVER',
        description: 'Delivery driver',
        permissions: [
          {
            module: 'ORDER',
            actions: ['READ', 'UPDATE']
          },
          {
            module: 'DRIVER',
            actions: ['READ', 'UPDATE']
          },
          {
            module: 'LOCATION',
            actions: ['CREATE', 'READ', 'UPDATE']
          }
        ]
      },
      {
        name: 'ADMIN',
        description: 'System administrator',
        permissions: [
          {
            module: 'USER',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE']
          },
          {
            module: 'DRIVER',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT']
          },
          {
            module: 'ORDER',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ASSIGN']
          }
        ]
      },
      {
        name: 'SUPER_ADMIN',
        description: 'Super administrator with full access',
        permissions: [
          {
            module: 'USER',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT']
          },
          {
            module: 'DRIVER',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN']
          },
          {
            module: 'ORDER',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'ASSIGN']
          },
          {
            module: 'ADMIN',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE']
          }
        ]
      }
    ];

    return defaultRoles;
  }

  // Initialize default roles
  const initializeDefaultRoles = async () => {
    const defaultRoles = await getDefaultRoles();

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        await this.createRole(roleData);
      }
    }

    return { message: 'Default roles initialized successfully' };
  }

  // Get role statistics
  const getRoleStatistics = async () => {
    const roleStats = await User.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: '_id',
          foreignField: 'name',
          as: 'roleDetails'
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          activeCount: 1,
          description: { $arrayElemAt: ['$roleDetails.description', 0] }
        }
      }
    ]);

    return roleStats;
  }

module.exports = {
  getRoleById,
  getAllRoles,
  getRoleByName,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getUsersByRole,
  checkUserPermission,
  getDefaultRoles,
  initializeDefaultRoles,
  getRoleStatistics
};
