import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { getInstallationAccessToken } from "../lib/accessToken.js";
import { Octokit } from "octokit";
export const webhookEvent = async (req: Request, res: Response) => {
    try {
        const githubEvent = req.headers['x-github-event'];
        const payload = req.body
        res.status(200).send("Webhook received");
        if (githubEvent === "pull_request" && payload.action === "opened") {
            const owner = payload.repository.owner.login
            const repo = payload.repository.name;
            const pull_number = payload.pull_request.number
            console.log(
                `🔔 New PR opened in ${owner}/${repo} (#${pull_number})`
            );

            const installation = await prisma.githubAppInstallation.findFirst({
                where: {
                    accountLogin: owner
                }
            })
            if (!installation) {
                console.log("No GitHub installation found for this repo");
                return;
            }
            const installationIdNum = parseInt(installation.installationId, 10);
            const accessToken = await getInstallationAccessToken(installationIdNum);
            const octokit = new Octokit({ auth: accessToken });
            const { data: files } = await octokit.request(
                "GET /repos/{owner}/{repo}/pulls/{pull_number}/files",
                { owner, repo, pull_number }
            );
            console.log(files)

        }

    } catch (error) {
        console.error(error);
    }
}

//hi there this is inside backend
