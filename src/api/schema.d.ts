// Generado por `pnpm gen:api` desde src/api/openapi.json. No editar a mano.

export interface paths {
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Chequeo de vida del proceso; no consulta la base ni R2 */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description El proceso responde. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            /** @enum {string} */
                            status: "ok";
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/sesion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Integrante de la sesión actual */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Integrante de la sesión. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            integrante: components["schemas"]["IntegranteDeSesion"];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/integrantes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista los integrantes, ordenados por nombre */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Integrantes. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            integrantes: components["schemas"]["Integrante"][];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `SIN_PERMISO`: Sesión válida sin el rol requerido (un `editor` en `/admin/integrantes`). */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SIN_PERMISO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        /** Da de alta un editor sin contraseña y le envía el correo para definirla */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                        /**
                         * Format: email
                         * @description Se guarda en minúsculas.
                         */
                        email: string;
                    };
                };
            };
            responses: {
                /** @description Editor creado. */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            integrante: components["schemas"]["Integrante"];
                        };
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `SIN_PERMISO`: Sesión válida sin el rol requerido (un `editor` en `/admin/integrantes`). */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SIN_PERMISO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `EMAIL_EN_USO`: Ya hay un integrante con ese email (sin distinguir mayúsculas). */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "EMAIL_EN_USO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/integrantes/{id}/desactivar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Desactiva un editor y cierra sus sesiones; idempotente */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Editor desactivado (`activo: false`). */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            integrante: components["schemas"]["Integrante"];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `SIN_PERMISO`: Sesión válida sin el rol requerido (un `editor` en `/admin/integrantes`). */
                403: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SIN_PERMISO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `INTEGRANTE_NO_ENCONTRADO`: El `:id` de integrante no existe. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "INTEGRANTE_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `INTEGRANTE_NO_DESACTIVABLE`: Se intentó desactivar al `owner`; solo se desactivan editores. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "INTEGRANTE_NO_DESACTIVABLE";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/categorias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista las categorías, ordenadas por nombre sin distinguir mayúsculas */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Categorías. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            categorias: components["schemas"]["Categoria"][];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crea una categoría */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                    };
                };
            };
            responses: {
                /** @description Categoría creada. */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Categoria"];
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NOMBRE_EN_USO`: Ya hay una categoría (o tipo de medida) con ese nombre, sin distinguir mayúsculas. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NOMBRE_EN_USO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/categorias/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Borra una categoría; sus productos quedan con `categoriaId: null` */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Categoría borrada. */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `CATEGORIA_NO_ENCONTRADA`: El `:id` de categoría no existe. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "CATEGORIA_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Renombra una categoría */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                    };
                };
            };
            responses: {
                /** @description Categoría renombrada. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Categoria"];
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `CATEGORIA_NO_ENCONTRADA`: El `:id` de categoría no existe. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "CATEGORIA_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NOMBRE_EN_USO`: Ya hay una categoría (o tipo de medida) con ese nombre, sin distinguir mayúsculas. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NOMBRE_EN_USO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/admin/tipos-medida": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista los tipos de medida, ordenados por nombre sin distinguir mayúsculas */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tipos de medida. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            tiposMedida: components["schemas"]["TipoMedida"][];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crea un tipo de medida */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                        /**
                         * @description Ausente, `null` o `""` se guarda como `null`.
                         * @default null
                         */
                        unidad?: string | null;
                    };
                };
            };
            responses: {
                /** @description Tipo de medida creado. */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TipoMedida"];
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NOMBRE_EN_USO`: Ya hay una categoría (o tipo de medida) con ese nombre, sin distinguir mayúsculas. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NOMBRE_EN_USO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/tipos-medida/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Borra un tipo de medida; sus medidas quedan con `tipoMedidaId: null` */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Tipo de medida borrado. */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `TIPO_MEDIDA_NO_ENCONTRADO`: El `:id` de tipo de medida no existe. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "TIPO_MEDIDA_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Edita nombre, unidad o ambos */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre?: string;
                        /** @description Ausente, `null` o `""` se guarda como `null`. */
                        unidad?: string | null;
                    };
                };
            };
            responses: {
                /** @description Tipo de medida editado. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["TipoMedida"];
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `TIPO_MEDIDA_NO_ENCONTRADO`: El `:id` de tipo de medida no existe. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "TIPO_MEDIDA_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NOMBRE_EN_USO`: Ya hay una categoría (o tipo de medida) con ese nombre, sin distinguir mayúsculas. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NOMBRE_EN_USO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/admin/productos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista todos los productos, borradores incluidos, en el orden global */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Productos en el orden global. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            productos: components["schemas"]["Producto"][];
                            /** @description Los ids de `productos`, en el mismo orden. */
                            orden: string[];
                            /** @description Versión que corresponde exactamente a esta lista. */
                            ordenVersion: number;
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        /** Crea un producto en borrador, al final del orden global */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre: string;
                        precio: components["schemas"]["Precio"];
                        /**
                         * @description `null`: sin categoría.
                         * @default null
                         */
                        categoriaId?: string | null;
                        /**
                         * @description Ausente, `null` o `""` se guarda como `null`.
                         * @default null
                         */
                        descripcion?: string | null;
                        /**
                         * @description Hasta 20; un `tipoMedidaId` no nulo no puede repetirse. En `PATCH` reemplaza la lista completa.
                         * @default []
                         */
                        medidas?: {
                            /**
                             * @description Ausente o `null`: sin tipo.
                             * @default null
                             */
                            tipoMedidaId?: string | null;
                            valor: string;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Producto creado (`estado: "borrador"`). */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Producto"];
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /**
                 * @description `CATEGORIA_INEXISTENTE`: El `categoriaId` del body no existe (por ejemplo, otro integrante la borró).
                 *
                 *     `TIPO_MEDIDA_INEXISTENTE`: Un `tipoMedidaId` de `medidas` no existe.
                 */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "CATEGORIA_INEXISTENTE" | "TIPO_MEDIDA_INEXISTENTE";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/orden": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Reemplaza el orden global con la lista completa de ids */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @description Ids de todos los productos, sin repetir, en el orden global. */
                        orden: string[];
                        /** @description Tal como la devolvió el listado. */
                        ordenVersion: number;
                    };
                };
            };
            responses: {
                /** @description Orden guardado, con la versión nueva. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            orden: string[];
                            ordenVersion: number;
                        };
                    };
                };
                /**
                 * @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos.
                 *
                 *     `ORDEN_INVALIDO`: El `orden` enviado no tiene exactamente los productos existentes (falta alguno o sobra uno ajeno).
                 */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA" | "ORDEN_INVALIDO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ORDEN_DESACTUALIZADO`: `ordenVersion` no es la actual: otro integrante creó, borró o reordenó productos. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ORDEN_DESACTUALIZADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Borra definitivamente un producto con sus medidas */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Producto borrado. */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /** Edita un producto; no cambia `estado` ni su posición */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        nombre?: string;
                        precio?: components["schemas"]["Precio"];
                        /** @description `null`: sin categoría. */
                        categoriaId?: string | null;
                        /** @description Ausente, `null` o `""` se guarda como `null`. */
                        descripcion?: string | null;
                        /** @description Hasta 20; un `tipoMedidaId` no nulo no puede repetirse. En `PATCH` reemplaza la lista completa. */
                        medidas?: {
                            /**
                             * @description Ausente o `null`: sin tipo.
                             * @default null
                             */
                            tipoMedidaId?: string | null;
                            valor: string;
                        }[];
                    };
                };
            };
            responses: {
                /** @description Producto editado. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Producto"];
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /**
                 * @description `CATEGORIA_INEXISTENTE`: El `categoriaId` del body no existe (por ejemplo, otro integrante la borró).
                 *
                 *     `TIPO_MEDIDA_INEXISTENTE`: Un `tipoMedidaId` de `medidas` no existe.
                 */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "CATEGORIA_INEXISTENTE" | "TIPO_MEDIDA_INEXISTENTE";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/admin/productos/{id}/publicar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Publica el producto si su imagen principal es válida; idempotente
         * @description La imagen principal (`galeria[0]`) tiene que estar procesada y no ser un diseño; si no, el producto queda como estaba. No cambia `ordenVersion` ni el lugar en el orden global.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Producto publicado. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Producto"];
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `SIN_IMAGEN_PRINCIPAL`: El producto publicado (o por publicar) quedaría sin una imagen válida (procesada y no diseño) en la posición 0. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SIN_IMAGEN_PRINCIPAL";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}/volver-a-borrador": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Pasa el producto a borrador; idempotente
         * @description No cambia `ordenVersion` ni el lugar en el orden global.
         */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Producto en borrador. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["Producto"];
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}/imagenes/orden": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Reemplaza el orden de la galería con la lista completa de ids */
        put: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @description Ids de todas las imágenes del producto, sin repetir; la primera es la principal. */
                        orden: string[];
                    };
                };
            };
            responses: {
                /** @description Galería en el orden nuevo. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            galeria: components["schemas"]["ImagenGaleria"][];
                        };
                    };
                };
                /**
                 * @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos.
                 *
                 *     `ORDEN_GALERIA_INVALIDO`: El `orden` de la galería no tiene exactamente las imágenes del producto.
                 */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA" | "ORDEN_GALERIA_INVALIDO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /**
                 * @description `DISENO_EN_PRINCIPAL`: El cambio dejaría un diseño en la posición 0 habiendo imágenes que no lo son.
                 *
                 *     `SIN_IMAGEN_PRINCIPAL`: El producto publicado (o por publicar) quedaría sin una imagen válida (procesada y no diseño) en la posición 0.
                 */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "DISENO_EN_PRINCIPAL" | "SIN_IMAGEN_PRINCIPAL";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ALMACENAMIENTO_NO_CONFIGURADO`: Faltan las variables `R2_*` (solo posible fuera de producción). */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ALMACENAMIENTO_NO_CONFIGURADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}/imagenes/upload-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Autoriza subir un archivo directo a R2 y crea la imagen en `pendiente_subida` */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        /** @enum {string} */
                        contentType: "image/jpeg" | "image/png" | "image/webp";
                        tamanoBytes: number;
                    };
                };
            };
            responses: {
                /** @description Subida autorizada. */
                201: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            imagenId: string;
                            /** @description URL firmada para `PUT` con el `Content-Type` y tamaño pedidos. */
                            uploadUrl: string;
                            /** @description ISO 8601; 15 minutos. */
                            expiraEn: string;
                        };
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `GALERIA_COMPLETA`: El producto ya tiene seis imágenes, contando las que todavía no se confirmaron. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "GALERIA_COMPLETA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ALMACENAMIENTO_NO_CONFIGURADO`: Faltan las variables `R2_*` (solo posible fuera de producción). */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ALMACENAMIENTO_NO_CONFIGURADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}/imagenes/{imagenId}/confirmar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Verifica que el archivo esté en R2 y encola el procesamiento; idempotente */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    imagenId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Imagen confirmada (o ya confirmada, sin encolar otro trabajo). */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            imagen: components["schemas"]["ImagenGaleria"];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `IMAGEN_NO_ENCONTRADA`: El `:imagenId` no existe o no es de ese producto. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "IMAGEN_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `SUBIDA_INCOMPLETA`: Se confirmó (o reintentó) una imagen cuyo archivo todavía no está en el almacenamiento. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SUBIDA_INCOMPLETA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ALMACENAMIENTO_NO_CONFIGURADO`: Faltan las variables `R2_*` (solo posible fuera de producción). */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ALMACENAMIENTO_NO_CONFIGURADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}/imagenes/{imagenId}/reintentar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Vuelve a encolar una imagen `fallida`; en otra etapa confirmada la devuelve como está */
        post: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    imagenId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Imagen reencolada o sin cambios. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            imagen: components["schemas"]["ImagenGaleria"];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `IMAGEN_NO_ENCONTRADA`: El `:imagenId` no existe o no es de ese producto. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "IMAGEN_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `SUBIDA_INCOMPLETA`: Se confirmó (o reintentó) una imagen cuyo archivo todavía no está en el almacenamiento. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SUBIDA_INCOMPLETA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ALMACENAMIENTO_NO_CONFIGURADO`: Faltan las variables `R2_*` (solo posible fuera de producción). */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ALMACENAMIENTO_NO_CONFIGURADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/admin/productos/{id}/imagenes/{imagenId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Consulta la etapa de una imagen (polling cada 1–2 s) */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    imagenId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Imagen. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            imagen: components["schemas"]["ImagenGaleria"];
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `IMAGEN_NO_ENCONTRADA`: El `:imagenId` no existe o no es de ese producto. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "IMAGEN_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ALMACENAMIENTO_NO_CONFIGURADO`: Faltan las variables `R2_*` (solo posible fuera de producción). */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ALMACENAMIENTO_NO_CONFIGURADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        /**
         * Borra una imagen en cualquier etapa; sus archivos se borran de R2 después, con reintentos
         * @description Si quedaría un diseño en la posición 0 habiendo imágenes que no lo son, sube la primera válida o, si no hay, la primera que no es diseño. En un publicado, la principal sigue siendo válida.
         */
        delete: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    imagenId: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Imagen borrada. */
                204: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /**
                 * @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador.
                 *
                 *     `IMAGEN_NO_ENCONTRADA`: El `:imagenId` no existe o no es de ese producto.
                 */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO" | "IMAGEN_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ULTIMA_IMAGEN_VALIDA`: Se intentó borrar la última imagen válida (procesada y no diseño) de un producto publicado; primero hay que volverlo a borrador. */
                409: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ULTIMA_IMAGEN_VALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        options?: never;
        head?: never;
        /**
         * Marca o desmarca un diseño y cambia su nombre
         * @description Desmarcar una imagen cuando todas son diseños la pasa a la posición 0. Marcar diseño la imagen principal da `422`.
         */
        patch: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                    imagenId: string;
                };
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": {
                        esDiseno?: boolean;
                        /** @description Se recorta; `""` o `null` lo quitan. Queda `null` si la imagen no es diseño. */
                        nombreDiseno?: string | null;
                    };
                };
            };
            responses: {
                /** @description Imagen editada. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            imagen: components["schemas"]["ImagenGaleria"];
                        };
                    };
                };
                /** @description `SOLICITUD_INVALIDA`: Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. */
                400: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "SOLICITUD_INVALIDA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `NO_AUTENTICADO`: Sin cookie de sesión, o sesión inválida o expirada. */
                401: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "NO_AUTENTICADO";
                                mensaje: string;
                            };
                        };
                    };
                };
                /**
                 * @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador.
                 *
                 *     `IMAGEN_NO_ENCONTRADA`: El `:imagenId` no existe o no es de ese producto.
                 */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO" | "IMAGEN_NO_ENCONTRADA";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `DISENO_EN_PRINCIPAL`: El cambio dejaría un diseño en la posición 0 habiendo imágenes que no lo son. */
                422: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "DISENO_EN_PRINCIPAL";
                                mensaje: string;
                            };
                        };
                    };
                };
                /** @description `ALMACENAMIENTO_NO_CONFIGURADO`: Faltan las variables `R2_*` (solo posible fuera de producción). */
                503: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "ALMACENAMIENTO_NO_CONFIGURADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        trace?: never;
    };
    "/api/productos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista los productos publicados, en el orden global */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Productos publicados. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            productos: components["schemas"]["ProductoPublico"][];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/productos/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Un producto publicado */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path: {
                    id: string;
                };
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Producto publicado. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": components["schemas"]["ProductoPublico"];
                    };
                };
                /** @description `PRODUCTO_NO_ENCONTRADO`: El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. */
                404: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            error: {
                                /** @enum {string} */
                                codigo: "PRODUCTO_NO_ENCONTRADO";
                                mensaje: string;
                            };
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/categorias": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista las categorías visibles (con productos publicados), por nombre sin distinguir mayúsculas */
        get: {
            parameters: {
                query?: never;
                header?: never;
                path?: never;
                cookie?: never;
            };
            requestBody?: never;
            responses: {
                /** @description Categorías visibles. */
                200: {
                    headers: {
                        [name: string]: unknown;
                    };
                    content: {
                        "application/json": {
                            categorias: components["schemas"]["Categoria"][];
                        };
                    };
                };
            };
        };
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /**
         * @description Forma de error de todas las rutas propias. `codigo` es estable y pensado para máquinas.
         *
         *     | Código | Status | Cuándo |
         *     | --- | --- | --- |
         *     | `SOLICITUD_INVALIDA` | `400` | Cuerpo que no es JSON, sin `Content-Type: application/json` o que no cumple el esquema; `mensaje` detalla los campos. |
         *     | `ORDEN_INVALIDO` | `400` | El `orden` enviado no tiene exactamente los productos existentes (falta alguno o sobra uno ajeno). |
         *     | `ORDEN_GALERIA_INVALIDO` | `400` | El `orden` de la galería no tiene exactamente las imágenes del producto. |
         *     | `NO_AUTENTICADO` | `401` | Sin cookie de sesión, o sesión inválida o expirada. |
         *     | `SIN_PERMISO` | `403` | Sesión válida sin el rol requerido (un `editor` en `/admin/integrantes`). |
         *     | `RUTA_NO_ENCONTRADA` | `404` | Ninguna ruta coincide con el método y la ruta pedidos. |
         *     | `INTEGRANTE_NO_ENCONTRADO` | `404` | El `:id` de integrante no existe. |
         *     | `CATEGORIA_NO_ENCONTRADA` | `404` | El `:id` de categoría no existe. |
         *     | `TIPO_MEDIDA_NO_ENCONTRADO` | `404` | El `:id` de tipo de medida no existe. |
         *     | `PRODUCTO_NO_ENCONTRADO` | `404` | El `:id` de producto no existe; en `/api/productos/{id}`, tampoco si es un borrador. |
         *     | `IMAGEN_NO_ENCONTRADA` | `404` | El `:imagenId` no existe o no es de ese producto. |
         *     | `EMAIL_EN_USO` | `409` | Ya hay un integrante con ese email (sin distinguir mayúsculas). |
         *     | `NOMBRE_EN_USO` | `409` | Ya hay una categoría (o tipo de medida) con ese nombre, sin distinguir mayúsculas. |
         *     | `ORDEN_DESACTUALIZADO` | `409` | `ordenVersion` no es la actual: otro integrante creó, borró o reordenó productos. |
         *     | `SUBIDA_INCOMPLETA` | `409` | Se confirmó (o reintentó) una imagen cuyo archivo todavía no está en el almacenamiento. |
         *     | `ULTIMA_IMAGEN_VALIDA` | `409` | Se intentó borrar la última imagen válida (procesada y no diseño) de un producto publicado; primero hay que volverlo a borrador. |
         *     | `INTEGRANTE_NO_DESACTIVABLE` | `422` | Se intentó desactivar al `owner`; solo se desactivan editores. |
         *     | `CATEGORIA_INEXISTENTE` | `422` | El `categoriaId` del body no existe (por ejemplo, otro integrante la borró). |
         *     | `TIPO_MEDIDA_INEXISTENTE` | `422` | Un `tipoMedidaId` de `medidas` no existe. |
         *     | `GALERIA_COMPLETA` | `422` | El producto ya tiene seis imágenes, contando las que todavía no se confirmaron. |
         *     | `DISENO_EN_PRINCIPAL` | `422` | El cambio dejaría un diseño en la posición 0 habiendo imágenes que no lo son. |
         *     | `SIN_IMAGEN_PRINCIPAL` | `422` | El producto publicado (o por publicar) quedaría sin una imagen válida (procesada y no diseño) en la posición 0. |
         *     | `ERROR_INTERNO` | `500` | Falla inesperada del servidor; el detalle queda en el log, no en la respuesta. |
         *     | `ALMACENAMIENTO_NO_CONFIGURADO` | `503` | Faltan las variables `R2_*` (solo posible fuera de producción). |
         */
        Error: {
            error: {
                /** @enum {string} */
                codigo: "SOLICITUD_INVALIDA" | "ORDEN_INVALIDO" | "ORDEN_GALERIA_INVALIDO" | "NO_AUTENTICADO" | "SIN_PERMISO" | "RUTA_NO_ENCONTRADA" | "INTEGRANTE_NO_ENCONTRADO" | "CATEGORIA_NO_ENCONTRADA" | "TIPO_MEDIDA_NO_ENCONTRADO" | "PRODUCTO_NO_ENCONTRADO" | "IMAGEN_NO_ENCONTRADA" | "EMAIL_EN_USO" | "NOMBRE_EN_USO" | "ORDEN_DESACTUALIZADO" | "SUBIDA_INCOMPLETA" | "ULTIMA_IMAGEN_VALIDA" | "INTEGRANTE_NO_DESACTIVABLE" | "CATEGORIA_INEXISTENTE" | "TIPO_MEDIDA_INEXISTENTE" | "GALERIA_COMPLETA" | "DISENO_EN_PRINCIPAL" | "SIN_IMAGEN_PRINCIPAL" | "ERROR_INTERNO" | "ALMACENAMIENTO_NO_CONFIGURADO";
                /** @description Texto en español para mostrar. */
                mensaje: string;
            };
        };
        IntegranteDeSesion: {
            id: string;
            nombre: string;
            email: string;
            /** @enum {string} */
            rol: "owner" | "editor";
        };
        Integrante: {
            id: string;
            nombre: string;
            email: string;
            /** @enum {string} */
            rol: "owner" | "editor";
            activo: boolean;
        };
        Categoria: {
            id: string;
            nombre: string;
        };
        TipoMedida: {
            id: string;
            nombre: string;
            unidad: string | null;
        };
        Producto: {
            id: string;
            nombre: string;
            precio: components["schemas"]["Precio"];
            categoriaId: string | null;
            descripcion: string | null;
            /** @description En el orden enviado. */
            medidas: components["schemas"]["Medida"][];
            /** @description Hasta seis imágenes en todas las etapas, en orden; `galeria[0]` es la imagen principal (nunca un diseño, salvo que todas lo sean). */
            galeria: components["schemas"]["ImagenGaleria"][];
            /** @enum {string} */
            estado: "borrador" | "publicado";
            /** @description ISO 8601, UTC. */
            creadoEn: string;
            /** @description ISO 8601, UTC. */
            actualizadoEn: string;
        };
        /** @description Entero en centavos, moneda fija `ARS`. */
        Precio: {
            amount: number;
            /** @enum {string} */
            currency: "ARS";
        };
        Medida: {
            id: string;
            tipoMedidaId: string | null;
            valor: string;
        };
        ImagenGaleria: {
            id: string;
            /** @enum {string} */
            etapa: "pendiente_subida" | "pendiente_procesamiento" | "procesando" | "procesada" | "fallida";
            /** @description `etapa === "procesada"`. */
            procesada: boolean;
            /** @description Igual a `url640`. */
            url: string | null;
            /** @description Derivado WebP de 160 px; `null` mientras no esté procesada. */
            url160: string | null;
            /** @description Derivado WebP de 640 px; `null` mientras no esté procesada. */
            url640: string | null;
            /** @description Derivado WebP de 1600 px; `null` mientras no esté procesada. */
            url1600: string | null;
            esDiseno: boolean;
            nombreDiseno: string | null;
            /** @description Motivo en español si `etapa` es `fallida`. */
            error: string | null;
        };
        ProductoPublico: {
            id: string;
            nombre: string;
            precio: components["schemas"]["Precio"];
            categoriaId: string | null;
            descripcion: string | null;
            /** @description En el orden del producto. */
            medidas: components["schemas"]["MedidaPublica"][];
            /** @description Solo las imágenes procesadas, en el orden de la galería; `galeria[0]` es la imagen principal (nunca un diseño). */
            galeria: components["schemas"]["ImagenPublica"][];
        };
        MedidaPublica: {
            /** @description Nombre del tipo; `null` si no tiene tipo. */
            tipo: string | null;
            /** @description `null` si el tipo no tiene unidad o no hay tipo. */
            unidad: string | null;
            valor: string;
        };
        /** @description URLs de los derivados WebP, por lado mayor en px. */
        ImagenPublica: {
            url160: string;
            url640: string;
            url1600: string;
            esDiseno: boolean;
            /** @description `null` si no es un diseño o no tiene nombre. */
            nombreDiseno: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export type operations = Record<string, never>;
