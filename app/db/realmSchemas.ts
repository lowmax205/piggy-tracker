import Realm from 'realm';

export type TransactionType = 'expense' | 'income';
export type SyncStatus = 'local' | 'synced';

export class Transaction extends Realm.Object<Transaction> {
  id!: string;
  type!: TransactionType;
  amountCents!: number;
  categoryId!: string;
  timestamp!: Date;
  updatedAt!: Date;
  syncStatus!: SyncStatus;
  deleted!: boolean;

  static primaryKey = 'id';

  static schema: Realm.ObjectSchema = {
    name: 'Transaction',
    primaryKey: 'id',
    properties: {
      id: 'string',
      type: {
        type: 'string',
        default: 'expense',
        indexed: true,
      },
      amountCents: { type: 'int', indexed: true },
      categoryId: { type: 'string', indexed: true },
      timestamp: { type: 'date', indexed: true },
      updatedAt: { type: 'date', indexed: true },
      syncStatus: {
        type: 'string',
        default: 'local',
        indexed: true,
      },
      deleted: { type: 'bool', default: false, indexed: true },
    },
  };
}

export class Category extends Realm.Object<Category> {
  id!: string;
  name!: string;
  icon!: string;
  userDefined!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static primaryKey = 'id';

  static schema: Realm.ObjectSchema = {
    name: 'Category',
    primaryKey: 'id',
    properties: {
      id: 'string',
      name: { type: 'string', indexed: true },
      icon: 'string',
      userDefined: { type: 'bool', default: false },
      createdAt: 'date',
      updatedAt: 'date',
    },
  };
}

export class Preferences extends Realm.Object<Preferences> {
  id!: string;
  theme!: 'light' | 'dark';
  dashboardPeriod!: 'month-to-date';
  currency!: string;
  lastOpenedAt!: Date;
  lastSyncAt?: Date | null;
  syncToken?: string | null;

  static schema: Realm.ObjectSchema = {
    name: 'Preferences',
    primaryKey: 'id',
    properties: {
      id: 'string',
      theme: { type: 'string', default: 'light' },
      dashboardPeriod: { type: 'string', default: 'month-to-date' },
      currency: { type: 'string', default: 'USD' },
      lastOpenedAt: { type: 'date', default: () => new Date() },
      lastSyncAt: { type: 'date', optional: true },
      syncToken: { type: 'string', optional: true },
    },
  };
}

export const objectModels = [Transaction, Category, Preferences];
export const schemas: Realm.ObjectSchema[] = [Transaction.schema, Category.schema, Preferences.schema];
