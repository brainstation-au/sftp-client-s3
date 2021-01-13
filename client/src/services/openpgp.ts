import * as openpgp from 'openpgp';

export const encrypt = async (data: string, publicKeyArmored: string): Promise<string> => {
  const message = openpgp.message.fromText(data);
  const publicKeys = await openpgp.key.readArmored(publicKeyArmored).then(r => r.keys);

  return openpgp.encrypt({message, publicKeys}).then(r => r.data);
};

export const decrypt = async (data: string, privateKeyArmored: string, passphrase?: string): Promise<string> => {
  const message = await openpgp.message.readArmored(data);
  const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
  if (passphrase) {
    await privateKey.decrypt(passphrase);
  }

  return await openpgp.decrypt({
    message,
    privateKeys: [privateKey],
  }).then(r => r.data);
};
