import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { EnviarCorreoContactoDto } from '../application/dto/enviar-correo-contacto.dto';
import { EnviarCorreoContactoUseCase } from '../application/use-cases/enviar-correo-contacto.use-case';

@ApiTags('Panel - Contacto')
@Controller('bosque-magico/contacto')
export class ContactoController {
  constructor(private readonly enviarCorreo: EnviarCorreoContactoUseCase) {}

  @Post('correo')
  @ApiOperation({
    summary:
      'Enviar correo de contacto (SMTP si está activo; si no, el panel abre mailto)',
  })
  @ApiConsumes('application/json', 'multipart/form-data')
  @ApiBody({ type: EnviarCorreoContactoDto })
  @UseInterceptors(
    FilesInterceptor('adjuntos', 5, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    }),
  )
  enviar(
    @Body() dto: EnviarCorreoContactoDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.enviarCorreo.ejecutar(dto, files ?? []);
  }
}
