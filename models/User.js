import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is2FAEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  temp2FACode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  temp2FACodeExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // New fields for Stripe data
  stripeCustomerId: {
    type: DataTypes.STRING,  // Store the Stripe customer ID
    allowNull: true,
  },
  plan: {
    type: DataTypes.STRING,  // Store the selected plan
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default User;
