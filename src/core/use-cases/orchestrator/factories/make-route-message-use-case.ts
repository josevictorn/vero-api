import { RouteMessageUseCase } from "../route-message-use-case";
import type { InstanceConfig } from "@/core/config/instance-config.port";

/**
 * Monta o RouteMessageUseCase injetando o StatusHandlerMap completo da instância.
 * A instância é responsável por registrar os handlers de todos os status,
 * incluindo IDENTIFYING e INTERVIEWING (que usarão os use cases do core internamente).
 */
export function makeRouteMessageUseCase(config: InstanceConfig) {
    return new RouteMessageUseCase(config.statusHandlers);
}