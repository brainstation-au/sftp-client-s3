import * as fs from 'fs';
import { decrypt, encrypt } from './openpgp';

describe('openpgp', () => {
  const content = 'Hello World!\n';

  describe('encrypt with passphrase', () => {
    const publicKeyArmored = fs.readFileSync('/opt/.gnupg/id_rsa.pub', 'utf-8');
    const privateKeyArmored = fs.readFileSync('/opt/.gnupg/id_rsa', 'utf-8');
    const passphrase = 'sftp-client-s3';
    let encrypted: string;

    beforeAll(async () => {
      encrypted = await encrypt(content, publicKeyArmored);
    });

    test('validate encrypted data', async () => {
      await expect(decrypt(encrypted, privateKeyArmored, passphrase)).resolves.toEqual(content);
    });
  });

  describe('encrypt without passphrase', () => {
    const publicKeyArmored = fs.readFileSync('/opt/.gnupg/id_rsa_nopass.pub', 'utf-8');
    const privateKeyArmored = fs.readFileSync('/opt/.gnupg/id_rsa_nopass', 'utf-8');
    let encrypted: string;

    beforeAll(async () => {
      encrypted = await encrypt(content, publicKeyArmored);
    });

    test('validate encrypted data', async () => {
      await expect(decrypt(encrypted, privateKeyArmored)).resolves.toEqual(content);
    });
  });
});
