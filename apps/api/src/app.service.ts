import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return { status: 'ok', servicio: 'bosque-magico-api', version: '0.1' };
  }
}
