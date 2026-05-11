import { makeResetPasswordUseCase } from "@/use-cases/users/factories/make-reset-password-use-case";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { HTTP_STATUS } from "@/utils/constants";

const MINMUM_PASSWORD_LENGTH = 6;

export const ResetPasswordConstroller: FastifyPluginAsyncZod = async (app) => {
    app.post(
        "/password/reset",
        {
            schema: {
                tags: ["users"],
                summary: "Reset password using a token received by email.",
                body: z.object({
                    token: z.string().min(1),
                    newPassword: z.string().min(MINMUM_PASSWORD_LENGTH),
                }),
                response: {
                    200: z.object({ message: z.string() }),
                    400: z.object({ message: z.string() }),
                },
            },
        },
        async (request, reply) => {
            const { token, newPassword } = request.body;

            const resetPasswordUseCase = makeResetPasswordUseCase();
            const result = resetPasswordUseCase.execute({ token, newPassword });

            if ((await result).isLeft()) {
                return reply.status(HTTP_STATUS.BAD_REQUEST)
                            .send({ message: (await result).value.message });
            }

            return reply.status(HTTP_STATUS.OK)
                        .send({ message: (await result).value.message });
        }
    )
}
