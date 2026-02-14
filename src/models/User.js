'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // User has one Donor profile
      User.hasOne(models.Donor, {
        foreignKey: 'user_id',
        as: 'donorProfile'
      });

      // User has many BloodRequests as requester
      User.hasMany(models.BloodRequest, {
        foreignKey: 'requester_id',
        as: 'bloodRequests'
      });

      // User has many DonationHistory as requester
      User.hasMany(models.DonationHistory, {
        foreignKey: 'requester_id',
        as: 'requestedDonations'
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    full_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'full_name'
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [18],
          msg: 'Age must be at least 18 years'
        },
        max: {
          args: [60],
          msg: 'Age must not exceed 60 years'
        }
      }
    },
    gender: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    mobile_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'mobile_number'
    },
    mobile_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'mobile_verified'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    blood_group: {
      type: DataTypes.STRING(5),
      allowNull: false,
      field: 'blood_group',
      validate: {
        isIn: {
          args: [['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']],
          msg: 'Invalid blood group'
        }
      }
    },
    medical_history: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'medical_history'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    notification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'notification_enabled'
    },
    quiet_hours_start: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'quiet_hours_start'
    },
    quiet_hours_end: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'quiet_hours_end'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return User;
};
