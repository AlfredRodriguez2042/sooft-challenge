import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { CompanyEntity } from './company';

@EventSubscriber()
export class CompanySubscriber
  implements EntitySubscriberInterface<CompanyEntity>
{
  constructor(ds: DataSource) {
    ds.subscribers.push(this);
  }
  listenTo() {
    return CompanyEntity;
  }

  beforeUpdate(event: UpdateEvent<CompanyEntity>) {
    const prev = event.databaseEntity; // valores antiguos
    const curr = event.entity; // valores nuevos

    if (!prev || !curr) return;

    if (prev.status !== curr.status) {
      curr.statusChangedAt = new Date();

      if (curr.status === 'JOINED' && !curr.joinedAt) {
        curr.joinedAt = new Date();
      }
      if (curr.status === 'DISABLED' && !curr.disabledAt) {
        curr.disabledAt = new Date();
      }
    }
  }
}
