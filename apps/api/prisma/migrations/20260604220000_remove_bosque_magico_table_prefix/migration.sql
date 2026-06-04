-- Quitar prefijo redundante bosque_magico_ en tablas (schema ya es el namespace del proyecto).
ALTER TABLE "bosque_magico_configuraciones" RENAME TO "configuraciones";
ALTER TABLE "bosque_magico_solicitudes" RENAME TO "solicitudes";
ALTER TABLE "bosque_magico_clientes" RENAME TO "clientes";
ALTER TABLE "bosque_magico_cumpleaneros" RENAME TO "cumpleaneros";
ALTER TABLE "bosque_magico_productos" RENAME TO "productos";
ALTER TABLE "bosque_magico_cotizaciones" RENAME TO "cotizaciones";
ALTER TABLE "bosque_magico_items_cotizacion" RENAME TO "items_cotizacion";
ALTER TABLE "bosque_magico_eventos" RENAME TO "eventos";
ALTER TABLE "bosque_magico_logs_mensajes" RENAME TO "logs_mensajes";
ALTER TABLE "bosque_magico_auditorias" RENAME TO "auditorias";
ALTER TABLE "bosque_magico_usuarios" RENAME TO "usuarios";
