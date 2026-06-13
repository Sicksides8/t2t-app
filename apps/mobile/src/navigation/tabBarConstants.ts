/**
 * Constantes del tab bar flotante extraídas a un archivo aislado para evitar
 * require-cycles. `MainTabs`, `ScreenWrapper` y `ProfileScreenShell` necesitan
 * el `TAB_BAR_OVERLAY_PADDING`, pero si todos lo importaran de `MainTabs` se
 * arma un grafo cíclico que deja `T2TCoin` (y otros exports del barrel
 * `components/ui`) como `undefined` al renderizar la pantalla de Perfil.
 */
export const TAB_BAR_CONTENT_MIN = 60;

/** Espacio que reservar como padding inferior en pantallas dentro del tab para
 *  no ocultar contenido bajo el tab bar flotante. */
export const TAB_BAR_OVERLAY_PADDING = TAB_BAR_CONTENT_MIN + 16;
