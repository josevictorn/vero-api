import { makeForgotPasswordUseCase } from "@/use-cases/users/factories/make-forgot-password-use-case";
import { HTTP_STATUS } from "@/utils/constants";
import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

export const ForgotPasswordController: FastifyPluginAsyncZod = async (app) => {
    app.post(
        "/password/forgot",
        {
            schema: {
                tags: ["users"],
                summary: "Request a password reset link via email",
                body: z.object({
                    email: z.email(),
                }),
                response: {
                    200: z.object({ message: z.string() }),
                },
            },
        },
        async (request, reply) => {
            const { email } = request.body;
            const forgotPasswordUseCase = makeForgotPasswordUseCase();
            const result = forgotPasswordUseCase.execute({ email });

            return reply.status(HTTP_STATUS.OK).send({ message: (await result).value.message});
        }
    );
}
