-- CreateTable
CREATE TABLE "public"."auditoria" (
    "auditoria_id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "tabla_afectada" VARCHAR(100) NOT NULL,
    "registro_id" BIGINT NOT NULL,
    "accion" VARCHAR(20) NOT NULL,
    "datos_antes" JSON,
    "datos_despues" JSON,
    "descripcion_cambio" TEXT,
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("auditoria_id")
);

-- CreateTable
CREATE TABLE "public"."detallepedido" (
    "detalle_id" BIGSERIAL NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "personalizacion_id" BIGINT,
    "cantidad" INTEGER NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detallepedido_pkey" PRIMARY KEY ("detalle_id")
);

-- CreateTable
CREATE TABLE "public"."envios" (
    "envio_id" BIGSERIAL NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "domiciliario_id" BIGINT NOT NULL,
    "direccion_envio" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(6) NOT NULL,
    "fecha_entrega" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_envio" VARCHAR(20) DEFAULT 'pendiente',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "envios_pkey" PRIMARY KEY ("envio_id")
);

-- CreateTable
CREATE TABLE "public"."historialpedidos" (
    "historial_id" BIGSERIAL NOT NULL,
    "pedido_id" BIGINT NOT NULL,
    "estado" VARCHAR(30),
    "medio_pago" VARCHAR(30),
    "total" DECIMAL(10,2),
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" VARCHAR(20),
    "usuario_id" BIGINT,

    CONSTRAINT "historialpedidos_pkey" PRIMARY KEY ("historial_id")
);

-- CreateTable
CREATE TABLE "public"."historialproductos" (
    "historial_id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "nombre" VARCHAR(150),
    "descripcion" TEXT,
    "precio_base" DECIMAL(10,2),
    "stock" INTEGER,
    "estado" VARCHAR(20),
    "fecha" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" VARCHAR(20),
    "usuario_id" BIGINT,
    "categoria" VARCHAR(100),

    CONSTRAINT "historialproductos_pkey" PRIMARY KEY ("historial_id")
);

-- CreateTable
CREATE TABLE "public"."pedidos" (
    "pedido_id" BIGSERIAL NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "fecha_pedido" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" VARCHAR(30) DEFAULT 'pendiente',
    "medio_pago" VARCHAR(20) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("pedido_id")
);

-- CreateTable
CREATE TABLE "public"."personalizaciones" (
    "personalizacion_id" BIGSERIAL NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "color" VARCHAR(50),
    "tamano" VARCHAR(50),
    "forma" VARCHAR(50),
    "archivo_3d_url" TEXT,
    "vista_ar_url" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalizaciones_pkey" PRIMARY KEY ("personalizacion_id")
);

-- CreateTable
CREATE TABLE "public"."productos" (
    "producto_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "precio_base" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "estado" VARCHAR(20) DEFAULT 'activo',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imagen" VARCHAR(255),
    "categoria" VARCHAR(100),

    CONSTRAINT "productos_pkey" PRIMARY KEY ("producto_id")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "usuario_id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(20),
    "contrasena" VARCHAR(255) NOT NULL,
    "tipo_usuario" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "public"."carrito" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "session_id" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrito_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."carrito_item" (
    "id" BIGSERIAL NOT NULL,
    "carrito_id" BIGINT NOT NULL,
    "producto_id" BIGINT NOT NULL,
    "cantidad" INTEGER DEFAULT 1,
    "precio_unitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "carrito_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_detallepedido_pedido_producto" ON "public"."detallepedido"("pedido_id", "producto_id");

-- CreateIndex
CREATE INDEX "idx_envios_pedido_domiciliario" ON "public"."envios"("pedido_id", "domiciliario_id");

-- CreateIndex
CREATE INDEX "idx_historialpedidos_pedido_fecha" ON "public"."historialpedidos"("pedido_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_historialproductos_producto_fecha" ON "public"."historialproductos"("producto_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_pedido_usuario_estado" ON "public"."pedidos"("usuario_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "public"."usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "carrito_user_id_key" ON "public"."carrito"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrito_session_id_key" ON "public"."carrito"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_carrito_producto" ON "public"."carrito_item"("carrito_id", "producto_id");

-- AddForeignKey
ALTER TABLE "public"."auditoria" ADD CONSTRAINT "fk_auditoria_usuarios" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detallepedido" ADD CONSTRAINT "fk_detallepedido_pedidos" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("pedido_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detallepedido" ADD CONSTRAINT "fk_detallepedido_personalizaciones" FOREIGN KEY ("personalizacion_id") REFERENCES "public"."personalizaciones"("personalizacion_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detallepedido" ADD CONSTRAINT "fk_detallepedido_productos" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("producto_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."envios" ADD CONSTRAINT "fk_envios_domiciliarios" FOREIGN KEY ("domiciliario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."envios" ADD CONSTRAINT "fk_envios_pedidos" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("pedido_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historialpedidos" ADD CONSTRAINT "fk_historialpedidos_pedidos" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("pedido_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historialpedidos" ADD CONSTRAINT "fk_historialpedidos_usuarios" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historialproductos" ADD CONSTRAINT "fk_historialproductos_productos" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("producto_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."historialproductos" ADD CONSTRAINT "fk_historialproductos_usuarios" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."pedidos" ADD CONSTRAINT "fk_pedidos_usuarios" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."personalizaciones" ADD CONSTRAINT "fk_personalizaciones_productos" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("producto_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."carrito_item" ADD CONSTRAINT "fk_carritoitem_carrito" FOREIGN KEY ("carrito_id") REFERENCES "public"."carrito"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carrito_item" ADD CONSTRAINT "fk_carritoitem_producto" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("producto_id") ON DELETE NO ACTION ON UPDATE CASCADE;
