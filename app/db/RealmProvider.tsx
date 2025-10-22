import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Realm, createRealmContext } from '@realm/react';
import { objectModels, Preferences } from './realmSchemas';
import { getRealmEncryptionKey } from './keys';

const realmConfig: Realm.Configuration = {
  schema: objectModels,
  schemaVersion: 3,
  onMigration: (oldRealm, newRealm) => {
    if (oldRealm.schemaVersion < 2) {
      const newPreferences = newRealm.objects<Preferences>('Preferences');
      for (let index = 0; index < newPreferences.length; index += 1) {
        const target = newPreferences[index];
        if (target && typeof target.syncToken === 'undefined') {
          target.syncToken = null;
        }
      }
    }
    if (oldRealm.schemaVersion < 3) {
      const newPreferences = newRealm.objects<Preferences>('Preferences');
      for (let index = 0; index < newPreferences.length; index += 1) {
        const target = newPreferences[index];
        if (target && typeof target.currency === 'undefined') {
          target.currency = 'USD';
        }
      }
    }
  },
};

const { RealmProvider: BaseRealmProvider, useRealm, useObject, useQuery } = createRealmContext(realmConfig);

type RealmProviderProps = {
  children: React.ReactNode;
};

export const RealmProvider: React.FC<RealmProviderProps> = ({ children }) => {
  const [encryptionKey, setEncryptionKey] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    getRealmEncryptionKey()
      .then((key) => {
        if (isMounted) {
          setEncryptionKey(key);
        }
      })
      .catch((err) => {
        console.error('[Realm] Failed to resolve encryption key', err);
        if (isMounted) {
          setError(err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!encryptionKey) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <BaseRealmProvider encryptionKey={encryptionKey}>
      {children}
    </BaseRealmProvider>
  );
};

export { useRealm, useObject, useQuery };
