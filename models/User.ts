import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

// Define the attributes for the User
interface UserAttributes {
  id: number;
  username: string;
  email: string;
  password: string;
  twoFactorSecret?: string | null;
  is2FAEnabled: boolean;
  temp2FACode?: string | null;
  temp2FACodeExpiry?: Date | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  stripeCustomerId?: string | null;
  plan?: string | null;
  maxStorage: number;
  currentStorage: number;
  storage_quota_gb: number;  // Add storage_quota_gb here
}

// Define the fields that are optional when creating a new user (e.g., auto-increment fields)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'twoFactorSecret' | 'temp2FACode' | 'temp2FACodeExpiry' | 'resetPasswordToken' | 'resetPasswordExpires' | 'stripeCustomerId' | 'plan'> {}

// Extend the Sequelize Model class to accept UserAttributes and UserCreationAttributes
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public email!: string;
  public password!: string;
  public twoFactorSecret!: string | null;
  public is2FAEnabled!: boolean;
  public temp2FACode!: string | null;
  public temp2FACodeExpiry!: Date | null;
  public resetPasswordToken!: string | null;
  public resetPasswordExpires!: Date | null;
  public stripeCustomerId!: string | null;
  public plan!: string | null;
  public maxStorage!: number;
  public currentStorage!: number;
  public storage_quota_gb!: number;  // Now storage_quota_gb is here

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to check if storage limit is exceeded
  public hasExceededStorageLimit(): boolean {
    return this.currentStorage > this.maxStorage;
  }

}

// Define the User model with the appropriate fields
User.init({
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
  stripeCustomerId: {
    type: DataTypes.STRING,  // Store the Stripe customer ID
    allowNull: true,
  },
  plan: {
    type: DataTypes.STRING,  // Store the selected plan
    allowNull: true,
  },
  maxStorage: {
    type: DataTypes.BIGINT,  // Store the maximum allowed storage in bytes
    allowNull: false,
    defaultValue: 100 * 1024 * 1024 * 1024,  // Default to 100 GB for basic plan
  },
  currentStorage: {
    type: DataTypes.BIGINT,  // Store the currently used storage in bytes
    defaultValue: 0,
    allowNull: false,
  },
  storage_quota_gb: {
    type: DataTypes.INTEGER,  // Add the storage_quota_gb field to store quota in GB
    allowNull: false,
    defaultValue: 100,  // Default to 100 GB
  }
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
});

export default User;
