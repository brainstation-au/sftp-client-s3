import { Container, interfaces } from 'inversify';

export const containerOptions: interfaces.ContainerOptions = {
  autoBindInjectable: true,
  skipBaseClassChecks: true,
  defaultScope: 'Singleton',
};

export const container = new Container(containerOptions);
