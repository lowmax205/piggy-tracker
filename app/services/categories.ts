import { useCallback, useEffect, useMemo, useRef } from 'react';
import Realm from 'realm';
import { useRealm } from '../db/RealmProvider';
import { Category, Transaction } from '../db/realmSchemas';
import { useCategoryRepository } from '../db/repository';

export const DEFAULT_CATEGORIES: Array<Pick<Category, 'id' | 'name' | 'icon'>> = [
  { id: 'cat-food', name: 'Food & Drink', icon: 'fast-food-outline' },
  { id: 'cat-transport', name: 'Transport', icon: 'bus-outline' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'game-controller-outline' },
  { id: 'cat-school', name: 'School', icon: 'book-outline' },
  { id: 'cat-shopping', name: 'Shopping', icon: 'cart-outline' },
  { id: 'cat-other', name: 'Other', icon: 'apps-outline' },
];

export const createCategoryId = () => new Realm.BSON.UUID().toString();

export const useCategoriesService = () => {
  const realm = useRealm();
  const { categories, upsertCategory, deleteCategory } = useCategoryRepository();
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) {
      return;
    }
    seededRef.current = true;
    realm.write(() => {
      DEFAULT_CATEGORIES.forEach((category) => {
        const existing = realm.objectForPrimaryKey(Category, category.id);
        if (!existing) {
          realm.create(Category, {
            id: category.id,
            name: category.name,
            icon: category.icon,
            userDefined: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    });
  }, [realm]);

  const allCategories = useMemo(() => categories.filtered('TRUEPREDICATE'), [categories]);

  const getTransactionCount = useCallback(
    (categoryId: string) =>
      realm.objects(Transaction).filtered('categoryId == $0 AND deleted == false', categoryId).length,
    [realm],
  );

  const addCategory = useCallback(
    (name: string, icon: string) => {
      const id = createCategoryId();
      upsertCategory({ id, name, icon, userDefined: true });
      return id;
    },
    [upsertCategory],
  );

  const renameCategory = useCallback(
    (id: string, name: string) => {
      const existing = realm.objectForPrimaryKey(Category, id);
      if (!existing) {
        return false;
      }
      upsertCategory({
        id,
        name,
        icon: existing.icon,
        userDefined: existing.userDefined,
        createdAt: existing.createdAt,
      });
      return true;
    },
    [realm, upsertCategory],
  );

  const removeCategory = useCallback(
    (id: string, replacementId?: string) => deleteCategory(id, replacementId),
    [deleteCategory],
  );

  return {
    categories: allCategories,
    addCategory,
    renameCategory,
    removeCategory,
    getTransactionCount,
  };
};
