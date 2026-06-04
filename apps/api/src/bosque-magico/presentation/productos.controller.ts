import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CategoriaProducto } from '@prisma/client';
import { ActualizarProductoDto } from '../application/dto/actualizar-producto.dto';
import { CrearProductoDto } from '../application/dto/crear-producto.dto';
import { ActualizarProductoUseCase } from '../application/use-cases/actualizar-producto.use-case';
import { CrearProductoUseCase } from '../application/use-cases/crear-producto.use-case';
import { ListarProductosPanelUseCase } from '../application/use-cases/listar-productos-panel.use-case';
import { EliminarImagenProductoUseCase } from '../application/use-cases/eliminar-imagen-producto.use-case';
import { SubirImagenProductoUseCase } from '../application/use-cases/subir-imagen-producto.use-case';

@ApiTags('Panel - Catálogo')
@Controller('bosque-magico/productos')
export class ProductosController {
  constructor(
    private readonly listar: ListarProductosPanelUseCase,
    private readonly crear: CrearProductoUseCase,
    private readonly actualizar: ActualizarProductoUseCase,
    private readonly subirImagen: SubirImagenProductoUseCase,
    private readonly eliminarImagen: EliminarImagenProductoUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos del catálogo' })
  @ApiQuery({ name: 'soloActivos', required: false, type: Boolean })
  @ApiQuery({ name: 'categoria', required: false, enum: CategoriaProducto })
  listarProductos(
    @Query('soloActivos') soloActivos?: string,
    @Query('categoria') categoria?: CategoriaProducto,
  ) {
    return this.listar.ejecutar(
      soloActivos === 'true'
        ? true
        : soloActivos === 'false'
          ? false
          : undefined,
      categoria,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  crearProducto(@Body() dto: CrearProductoDto) {
    return this.crear.ejecutar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto o activar/desactivar' })
  patch(@Param('id') id: string, @Body() dto: ActualizarProductoDto) {
    return this.actualizar.ejecutar(id, dto);
  }

  @Post(':id/imagen')
  @ApiOperation({
    summary: 'Subir imagen del producto (JPG/PNG/WebP, máx. 2 MB)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { imagen: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  subirImagenProducto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.subirImagen.ejecutar(id, file);
  }

  @Delete(':id/imagen')
  @ApiOperation({ summary: 'Quitar imagen del producto' })
  quitarImagenProducto(@Param('id') id: string) {
    return this.eliminarImagen.ejecutar(id);
  }
}
